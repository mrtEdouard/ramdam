import { Injectable, NotFoundException } from '@nestjs/common';
import type { Profil } from '@ramdam/shared';
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
}
