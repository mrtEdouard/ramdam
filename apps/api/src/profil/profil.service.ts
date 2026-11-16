import { Injectable, NotFoundException } from '@nestjs/common';
import type { MouvementXp, Profil } from '@ramdam/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProfilService {
  constructor(private readonly prisma: PrismaService) {}

  async trouver(filtre: Prisma.utilisateurWhereUniqueInput): Promise<Profil> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: filtre,
      select: { id: true, pseudo: true, role: true, xp: true, statut: true, cree_le: true },
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
}
