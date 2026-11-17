import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { OffreDto } from '@ramdam/shared';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { OffresService } from './offres.service.js';

const prisma = {
  offre: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};
const service = new OffresService(prisma as unknown as PrismaService);

const sophie: UtilisateurJwt = { sub: 'id-sophie', role: 'DIRECTEUR' };
const marc: UtilisateurJwt = { sub: 'id-marc', role: 'DIRECTEUR' };

const ligne = {
  id: 'id-offre',
  directeur_id: 'id-sophie',
  intitule: 'Animateur séjour montagne',
  structure: 'Les Chamois',
  type_structure: 'SEJOUR',
  region: 'Occitanie',
  date_debut: new Date('2027-07-05'),
  date_fin: new Date('2027-07-26'),
  description: 'Séjour de trois semaines avec des 8-12 ans.',
  diplome_requis: null,
  contact_externe: 'recrutement@chamois.fr',
  statut: 'OUVERTE',
  utilisateur: { pseudo: 'sophie' },
};

const dto: OffreDto = {
  intitule: 'Animateur séjour montagne',
  structure: 'Les Chamois',
  typeStructure: 'SEJOUR',
  region: 'Occitanie',
  dateDebut: '2027-07-05',
  dateFin: '2027-07-26',
  description: 'Séjour de trois semaines avec des 8-12 ans.',
  diplomeRequis: '',
  contactExterne: 'recrutement@chamois.fr',
};

beforeEach(() => vi.resetAllMocks());

describe('lister', () => {
  it('ne montre que les offres ouvertes, avec les filtres et la pagination', async () => {
    prisma.offre.findMany.mockResolvedValue([ligne]);
    prisma.offre.count.mockResolvedValue(11);

    const page = await service.lister({ region: 'Occitanie', page: 2, parPage: 5 });

    const requete = prisma.offre.findMany.mock.calls[0][0];
    expect(requete.where).toMatchObject({ statut: 'OUVERTE', region: 'Occitanie' });
    expect(requete.skip).toBe(5);
    expect(page).toMatchObject({ page: 2, pages: 3, total: 11 });
    expect(page.offres[0]).toMatchObject({ id: 'id-offre', dateDebut: '2027-07-05' });
  });

  it('filtre par mois : l’offre doit avoir au moins un jour dans le mois', async () => {
    prisma.offre.findMany.mockResolvedValue([]);
    prisma.offre.count.mockResolvedValue(0);

    await service.lister({ mois: '2099-07', page: 1, parPage: 10 });

    const { where } = prisma.offre.findMany.mock.calls[0][0];
    expect(where.date_debut).toEqual({ lte: new Date('2099-07-31') });
    expect(where.date_fin).toEqual({ gte: new Date('2099-07-01') });
  });
});

describe('créer et modifier', () => {
  it('enregistre l’offre au nom du Directeur, un diplôme vide devient null', async () => {
    prisma.offre.create.mockResolvedValue(ligne);

    const offre = await service.creer(dto, sophie);

    const { data } = prisma.offre.create.mock.calls[0][0];
    expect(data).toMatchObject({ directeur_id: 'id-sophie', diplome_requis: null });
    expect(data.date_debut).toEqual(new Date('2027-07-05'));
    expect(offre.estAMoi).toBe(true);
  });

  it('refuse qu’un Directeur modifie l’offre d’un autre (403)', async () => {
    prisma.offre.findUnique.mockResolvedValue(ligne);
    await expect(service.modifier('id-offre', dto, marc)).rejects.toThrow(ForbiddenException);
    expect(prisma.offre.update).not.toHaveBeenCalled();
  });
});

describe('clôturer et supprimer', () => {
  it('clôture son offre', async () => {
    prisma.offre.findUnique.mockResolvedValue(ligne);
    await expect(service.changerStatut('id-offre', 'CLOTUREE', sophie)).resolves.toEqual({
      statut: 'CLOTUREE',
    });
    expect(prisma.offre.update).toHaveBeenCalledWith({
      where: { id: 'id-offre' },
      data: { statut: 'CLOTUREE' },
    });
  });

  it('répond 404 pour une offre qui n’existe pas', async () => {
    prisma.offre.findUnique.mockResolvedValue(null);
    await expect(service.supprimer('id-offre', sophie)).rejects.toThrow(NotFoundException);
  });

  it('refuse de supprimer l’offre d’un autre', async () => {
    prisma.offre.findUnique.mockResolvedValue(ligne);
    await expect(service.supprimer('id-offre', marc)).rejects.toThrow(ForbiddenException);
    expect(prisma.offre.delete).not.toHaveBeenCalled();
  });
});
