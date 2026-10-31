import { Injectable, NotFoundException } from '@nestjs/common';
import type { OffreDetail, OffreResume } from '@ramdam/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const AVEC_DIRECTEUR = { utilisateur: { select: { pseudo: true } } } as const;
type OffreLue = Prisma.offreGetPayload<{ include: typeof AVEC_DIRECTEUR }>;

// Lecture des offres. La publication par les Directeurs viendra avec la fonctionnalité Offres.
@Injectable()
export class OffresService {
  constructor(private readonly prisma: PrismaService) {}

  // Les offres ouvertes, de la plus récente à la plus ancienne.
  async lister(nombre: number): Promise<OffreResume[]> {
    const offres = await this.prisma.offre.findMany({
      where: { statut: 'OUVERTE' },
      include: AVEC_DIRECTEUR,
      orderBy: { cree_le: 'desc' },
      take: nombre,
    });
    return offres.map(versResume);
  }

  async detail(id: string): Promise<OffreDetail> {
    const offre = await this.prisma.offre.findUnique({ where: { id }, include: AVEC_DIRECTEUR });
    if (!offre) {
      throw new NotFoundException('Offre introuvable');
    }
    return {
      ...versResume(offre),
      description: offre.description,
      diplomeRequis: offre.diplome_requis,
      contactExterne: offre.contact_externe,
    };
  }
}

// Les dates sans heure sont envoyées au format AAAA-MM-JJ.
const versJour = (date: Date) => date.toISOString().slice(0, 10);

function versResume(offre: OffreLue): OffreResume {
  return {
    id: offre.id,
    intitule: offre.intitule,
    structure: offre.structure,
    typeStructure: offre.type_structure,
    region: offre.region,
    dateDebut: versJour(offre.date_debut),
    dateFin: versJour(offre.date_fin),
    directeur: offre.utilisateur.pseudo,
  };
}
