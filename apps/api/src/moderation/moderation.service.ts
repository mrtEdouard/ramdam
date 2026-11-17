import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  motifsSignalement,
  type CibleSignalement,
  type ContenuSignale,
  type DecisionDto,
  type SignalementDto,
} from '@ramdam/shared';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Colonne du signalement qui pointe vers chaque type de contenu (RG-20 : une seule est remplie).
const colonne = {
  FICHE: 'fiche_id',
  COMMENTAIRE: 'commentaire_id',
  OFFRE: 'offre_id',
} as const;

const PSEUDO = { select: { pseudo: true } } as const;

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Signaler (tout utilisateur connecté) ----------

  async signaler(dto: SignalementDto, utilisateur: UtilisateurJwt) {
    const auteurDuContenu = await this.auteurVisible(dto.cible, dto.cibleId);
    if (!auteurDuContenu) {
      throw new NotFoundException('Contenu introuvable');
    }
    if (auteurDuContenu === utilisateur.sub) {
      throw new BadRequestException('Tu ne peux pas signaler ton propre contenu');
    }

    // Le motif est enregistré en clair pour l'administrateur : « Spam ou publicité : … ».
    const libelle = motifsSignalement[dto.motif];
    const motif = dto.precision ? `${libelle} : ${dto.precision}` : libelle;
    try {
      await this.prisma.signalement.create({
        data: { auteur_id: utilisateur.sub, motif, [colonne[dto.cible]]: dto.cibleId },
      });
    } catch (erreur) {
      // RG-28 : l'index unique de la base refuse un deuxième signalement en attente.
      if (erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === 'P2002') {
        throw new ConflictException('Tu as déjà signalé ce contenu');
      }
      throw erreur;
    }
    return { message: 'Merci, la modération va regarder.' };
  }

  // L'auteur d'un contenu encore visible, ou null : on ne signale pas ce qui est déjà masqué.
  private async auteurVisible(cible: CibleSignalement, id: string) {
    if (cible === 'FICHE') {
      const fiche = await this.prisma.fiche.findUnique({ where: { id } });
      return fiche?.statut === 'PUBLIEE' ? fiche.auteur_id : null;
    }
    if (cible === 'COMMENTAIRE') {
      const commentaire = await this.prisma.commentaire.findUnique({ where: { id } });
      return commentaire?.statut === 'VISIBLE' ? commentaire.auteur_id : null;
    }
    const offre = await this.prisma.offre.findUnique({ where: { id } });
    return offre && offre.statut !== 'MASQUEE' ? offre.directeur_id : null;
  }

  // ---------- Modérer (administrateur, RG-29) ----------

  // Les contenus qui ont des signalements en attente, le plus anciennement signalé d'abord.
  async enAttente(): Promise<ContenuSignale[]> {
    const signalements = await this.prisma.signalement.findMany({
      where: { statut: 'EN_ATTENTE' },
      orderBy: { cree_le: 'asc' },
      include: {
        utilisateur_signalement_auteur_idToutilisateur: PSEUDO,
        fiche: { select: { id: true, titre: true, deroulement: true, utilisateur: PSEUDO } },
        commentaire: { select: { contenu: true, fiche_id: true, utilisateur: PSEUDO } },
        offre: { select: { intitule: true, description: true, utilisateur: PSEUDO } },
      },
    });

    // Plusieurs personnes peuvent signaler le même contenu : on les regroupe sous une seule carte.
    const contenus = new Map<string, ContenuSignale>();
    for (const s of signalements) {
      const cible: CibleSignalement = s.fiche ? 'FICHE' : s.commentaire ? 'COMMENTAIRE' : 'OFFRE';
      const cibleId = (s.fiche_id ?? s.commentaire_id ?? s.offre_id)!;
      const cle = `${cible}:${cibleId}`;
      if (!contenus.has(cle)) {
        contenus.set(cle, { cible, cibleId, ...apercu(s), signalements: [] });
      }
      contenus.get(cle)!.signalements.push({
        motif: s.motif,
        // null si la personne qui a signalé a depuis supprimé son compte.
        par: s.utilisateur_signalement_auteur_idToutilisateur?.pseudo ?? null,
        le: s.cree_le.toISOString(),
      });
    }
    return [...contenus.values()];
  }

  async decider(
    cible: CibleSignalement,
    cibleId: string,
    { decision }: DecisionDto,
    admin: UtilisateurJwt,
  ) {
    const enAttente = { statut: 'EN_ATTENTE' as const, [colonne[cible]]: cibleId };
    if ((await this.prisma.signalement.count({ where: enAttente })) === 0) {
      throw new NotFoundException('Aucun signalement en attente sur ce contenu');
    }

    // Tout ou rien : le contenu est masqué ET ses signalements sont clos, ou rien ne change.
    await this.prisma.$transaction(async (tx) => {
      if (decision === 'MASQUER') {
        if (cible === 'FICHE') {
          await tx.fiche.update({ where: { id: cibleId }, data: { statut: 'MASQUEE' } });
        } else if (cible === 'COMMENTAIRE') {
          await tx.commentaire.update({ where: { id: cibleId }, data: { statut: 'MASQUE' } });
        } else {
          await tx.offre.update({ where: { id: cibleId }, data: { statut: 'MASQUEE' } });
        }
      }
      await tx.signalement.updateMany({
        where: enAttente,
        data: {
          statut: decision === 'MASQUER' ? 'TRAITE' : 'IGNORE',
          admin_id: admin.sub,
          traite_le: new Date(),
        },
      });
    });
    return { decision };
  }
}

type SignalementLu = {
  fiche: { id: string; titre: string; deroulement: string; utilisateur: { pseudo: string } } | null;
  commentaire: { contenu: string; fiche_id: string; utilisateur: { pseudo: string } } | null;
  offre: { intitule: string; description: string; utilisateur: { pseudo: string } } | null;
};

// Ce qu'on montre à l'administrateur pour juger : un titre, un extrait, l'auteur.
function apercu({ fiche, commentaire, offre }: SignalementLu) {
  const extrait = (texte: string) => (texte.length > 160 ? `${texte.slice(0, 160)}…` : texte);
  if (fiche) {
    return {
      titre: fiche.titre,
      extrait: extrait(fiche.deroulement),
      auteur: fiche.utilisateur.pseudo,
      ficheId: fiche.id,
    };
  }
  if (commentaire) {
    return {
      titre: 'Commentaire',
      extrait: extrait(commentaire.contenu),
      auteur: commentaire.utilisateur.pseudo,
      ficheId: commentaire.fiche_id,
    };
  }
  return {
    titre: offre!.intitule,
    extrait: extrait(offre!.description),
    auteur: offre!.utilisateur.pseudo,
    ficheId: null,
  };
}
