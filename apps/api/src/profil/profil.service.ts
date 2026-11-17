import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ModifierProfilDto, MouvementXp, Profil } from '@ramdam/shared';
import * as argon2 from 'argon2';
import type { Prisma } from '../generated/prisma/client.js';
import { StockageImages } from '../images/stockage-images.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProfilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly images: StockageImages,
  ) {}

  async trouver(filtre: Prisma.utilisateurWhereUniqueInput): Promise<Profil> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: filtre,
      select: {
        id: true,
        pseudo: true,
        role: true,
        bio: true,
        avatar_url: true,
        xp: true,
        statut: true,
        cree_le: true,
      },
    });
    // Un compte suspendu n'a plus de profil public.
    if (!utilisateur || utilisateur.statut === 'SUSPENDU') {
      throw new NotFoundException('Profil introuvable');
    }

    // Seules les fiches publiées comptent : un brouillon ou une fiche masquée n'est pas public.
    const fichesPubliees = { auteur_id: utilisateur.id, statut: 'PUBLIEE' } as const;
    // Les deux comptages sont indépendants : on les lance en même temps.
    const [nbFiches, nbAimes] = await Promise.all([
      this.prisma.fiche.count({ where: fichesPubliees }),
      this.prisma.aimer.count({ where: { fiche: fichesPubliees } }),
    ]);

    return {
      pseudo: utilisateur.pseudo,
      role: utilisateur.role,
      bio: utilisateur.bio,
      avatarUrl: utilisateur.avatar_url,
      xp: utilisateur.xp,
      membreDepuis: utilisateur.cree_le.toISOString(),
      fichesPubliees: nbFiches,
      aimesRecus: nbAimes,
    };
  }

  // Les 5 derniers gains d'XP de l'utilisateur connecté (écrits par les triggers de la base).
  async historiqueXp(utilisateurId: string): Promise<MouvementXp[]> {
    const lignes = await this.prisma.historique_xp.findMany({
      where: { utilisateur_id: utilisateurId },
      orderBy: { gagne_le: 'desc' },
      take: 5,
    });

    // Dans l'historique, source_id est la fiche concernée (ou le commentaire) et
    // declencheur_id la personne qui a agi. On récupère titres et pseudos en deux requêtes.
    const [fiches, personnes] = await Promise.all([
      this.prisma.fiche.findMany({
        where: { id: { in: lignes.map((ligne) => ligne.source_id) } },
        select: { id: true, titre: true },
      }),
      this.prisma.utilisateur.findMany({
        where: { id: { in: lignes.map((ligne) => ligne.declencheur_id) } },
        select: { id: true, pseudo: true },
      }),
    ]);

    return lignes.map((ligne) => ({
      id: ligne.id.toString(), // bigint : converti en texte pour le JSON
      action: ligne.action,
      points: ligne.points,
      gagneLe: ligne.gagne_le.toISOString(),
      fiche: fiches.find((fiche) => fiche.id === ligne.source_id) ?? null,
      par:
        ligne.declencheur_id === utilisateurId
          ? null
          : (personnes.find((personne) => personne.id === ligne.declencheur_id)?.pseudo ?? null),
    }));
  }

  // ---------- Modifier son profil (l'identifiant vient toujours du jeton) ----------

  async modifier(utilisateurId: string, dto: ModifierProfilDto) {
    // Une bio vide devient null : « pas de bio ».
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { bio: dto.bio || null },
    });
    return this.trouver({ id: utilisateurId });
  }

  // Nouvelle photo de profil : remplace l'ancienne, qui est effacée du disque.
  async changerAvatar(utilisateurId: string, contenu: Buffer) {
    const avant = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { avatar_url: true },
    });
    const url = await this.images.enregistrer(contenu);
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { avatar_url: url },
    });
    await this.images.supprimer(avant?.avatar_url ?? null);
    return this.trouver({ id: utilisateurId });
  }

  async retirerAvatar(utilisateurId: string) {
    const avant = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { avatar_url: true },
    });
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { avatar_url: null },
    });
    await this.images.supprimer(avant?.avatar_url ?? null);
    return this.trouver({ id: utilisateurId });
  }

  // RGPD (droit à l'effacement) : supprime le compte et tout ce qu'il a publié.
  async supprimerCompte(utilisateurId: string, motDePasse: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { mot_de_passe_hash: true, avatar_url: true },
    });
    if (!utilisateur) {
      throw new NotFoundException('Compte introuvable');
    }
    if (!(await motDePasseValide(utilisateur.mot_de_passe_hash, motDePasse))) {
      throw new ForbiddenException('Mot de passe incorrect');
    }

    // Les adresses des photos sont relevées avant la suppression : ensuite, les lignes n'existent plus.
    const [fiches, photosFiches, photosOffres] = await Promise.all([
      this.prisma.fiche.findMany({
        where: { auteur_id: utilisateurId },
        select: { image_url: true },
      }),
      this.prisma.photo_fiche.findMany({
        where: { fiche: { auteur_id: utilisateurId } },
        select: { url: true },
      }),
      this.prisma.photo_offre.findMany({
        where: { offre: { directeur_id: utilisateurId } },
        select: { url: true },
      }),
    ]);

    // Une seule ligne supprimée : la base efface en cascade (ON DELETE CASCADE) ses fiches,
    // offres, commentaires, « j'aime », galerie, notifications et son historique d'XP.
    // Ses signalements restent, sans auteur (ON DELETE SET NULL), pour la modération.
    await this.prisma.utilisateur.delete({ where: { id: utilisateurId } });

    const urls = [
      utilisateur.avatar_url,
      ...fiches.map((fiche) => fiche.image_url),
      ...photosFiches.map((photo) => photo.url),
      ...photosOffres.map((photo) => photo.url),
    ];
    await Promise.all(urls.map((url) => this.images.supprimer(url)));
  }
}

async function motDePasseValide(hash: string, motDePasse: string) {
  try {
    return await argon2.verify(hash, motDePasse);
  } catch {
    // argon2 lève une erreur si l'empreinte stockée n'est pas au bon format.
    return false;
  }
}
