import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Commentaire, CommentaireDto, CommentaireEnvoye, Reponse } from '@ramdam/shared';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

const AVEC_AUTEUR = { utilisateur: { select: { pseudo: true } } } as const;

// Commentaires sous une fiche, avec un seul niveau de réponses (RG-11).
// L'XP (+5, une fois par fiche, RG-25) et les notifications (RG-26) sont gérées par les
// triggers de la base (migration 005) : ce service n'a qu'à lire et écrire les commentaires.
@Injectable()
export class CommentairesService {
  constructor(private readonly prisma: PrismaService) {}

  async lister(ficheId: string, utilisateur: UtilisateurJwt): Promise<Commentaire[]> {
    await this.fichePubliee(ficheId);
    // Un commentaire masqué par la modération n'est plus affiché (ni ses réponses).
    const lignes = await this.prisma.commentaire.findMany({
      where: { fiche_id: ficheId, statut: 'VISIBLE' },
      include: AVEC_AUTEUR,
      orderBy: { cree_le: 'asc' },
    });

    // On range les réponses sous leur commentaire : d'abord les commentaires, puis les réponses.
    const commentaires = lignes
      .filter((ligne) => ligne.parent_id === null)
      .map((ligne) => ({ ...versReponse(ligne, utilisateur), reponses: [] as Reponse[] }));
    for (const ligne of lignes) {
      const parent = commentaires.find((commentaire) => commentaire.id === ligne.parent_id);
      parent?.reponses.push(versReponse(ligne, utilisateur));
    }
    // Les plus récents en premier ; les réponses restent dans l'ordre de la conversation.
    return commentaires.reverse();
  }

  async envoyer(
    ficheId: string,
    dto: CommentaireDto,
    utilisateur: UtilisateurJwt,
  ): Promise<CommentaireEnvoye> {
    await this.fichePubliee(ficheId);

    let parentId: string | null = null;
    if (dto.parentId) {
      const parent = await this.prisma.commentaire.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.fiche_id !== ficheId || parent.statut !== 'VISIBLE') {
        throw new NotFoundException('Commentaire introuvable');
      }
      // Répondre à une réponse revient à répondre au commentaire d'origine (un seul niveau).
      parentId = parent.parent_id ?? parent.id;
    }

    // Comme pour les « j'aime », on compare l'XP avant et après pour annoncer le gain.
    const avant = await this.xpDe(utilisateur);
    const commentaire = await this.prisma.commentaire.create({
      data: {
        fiche_id: ficheId,
        auteur_id: utilisateur.sub,
        parent_id: parentId,
        contenu: dto.contenu,
      },
      include: AVEC_AUTEUR,
    });
    const xpGagne = (await this.xpDe(utilisateur)) - avant;

    return { commentaire: versReponse(commentaire, utilisateur), xpGagne };
  }

  // On ne supprime que ses propres commentaires ; les réponses partent avec (ON DELETE CASCADE).
  async supprimer(ficheId: string, commentaireId: string, utilisateur: UtilisateurJwt) {
    const commentaire = await this.prisma.commentaire.findUnique({ where: { id: commentaireId } });
    if (!commentaire || commentaire.fiche_id !== ficheId) {
      throw new NotFoundException('Commentaire introuvable');
    }
    if (commentaire.auteur_id !== utilisateur.sub) {
      throw new ForbiddenException('Tu ne peux supprimer que tes commentaires');
    }
    await this.prisma.commentaire.delete({ where: { id: commentaireId } });
  }

  private async fichePubliee(ficheId: string) {
    const fiche = await this.prisma.fiche.findUnique({ where: { id: ficheId } });
    if (!fiche || fiche.statut !== 'PUBLIEE') {
      throw new NotFoundException('Fiche introuvable');
    }
  }

  private async xpDe(utilisateur: UtilisateurJwt) {
    const ligne = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateur.sub },
      select: { xp: true },
    });
    return ligne?.xp ?? 0;
  }
}

type LigneCommentaire = {
  id: string;
  auteur_id: string;
  contenu: string;
  cree_le: Date;
  utilisateur: { pseudo: string };
};

function versReponse(ligne: LigneCommentaire, utilisateur: UtilisateurJwt): Reponse {
  return {
    id: ligne.id,
    auteur: ligne.utilisateur.pseudo,
    contenu: ligne.contenu,
    creeLe: ligne.cree_le.toISOString(),
    estAMoi: ligne.auteur_id === utilisateur.sub,
  };
}
