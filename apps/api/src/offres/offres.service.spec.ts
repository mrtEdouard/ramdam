import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { OffreDto } from '@ramdam/shared';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import type { StockageImages } from '../images/stockage-images.service.js';
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
  photo_offre: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
};
const images = { enregistrer: vi.fn(), supprimer: vi.fn() };
const service = new OffresService(
  prisma as unknown as PrismaService,
  images as unknown as StockageImages,
);

const sophie: UtilisateurJwt = { sub: 'id-sophie', role: 'DIRECTEUR' };
const marc: UtilisateurJwt = { sub: 'id-marc', role: 'DIRECTEUR' };

const ligne = {
  id: 'id-offre',
  directeur_id: 'id-sophie',
  intitule: 'Animateur séjour montagne',
  structure: 'Les Chamois',
  type_structure: 'SEJOUR',
  region: 'Occitanie',
  ville: 'Millau',
  date_debut: new Date('2027-07-05'),
  date_fin: new Date('2027-07-26'),
  description: 'Séjour de trois semaines avec des 8-12 ans.',
  diplome_requis: null,
  contact_externe: 'recrutement@chamois.fr',
  statut: 'OUVERTE',
  utilisateur: { pseudo: 'sophie' },
  photo_offre: [{ id: 'id-photo', url: '/images/chalet.webp' }],
};

const dto: OffreDto = {
  intitule: 'Animateur séjour montagne',
  structure: 'Les Chamois',
  typeStructure: 'SEJOUR',
  region: 'Occitanie',
  ville: 'Millau',
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
    expect(page.offres[0]).toMatchObject({
      id: 'id-offre',
      dateDebut: '2027-07-05',
      photoUrl: '/images/chalet.webp', // la première photo sert de vignette
    });
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

  it('refuse de rouvrir une offre masquée par la modération', async () => {
    prisma.offre.findUnique.mockResolvedValue({ ...ligne, statut: 'MASQUEE' });
    await expect(service.changerStatut('id-offre', 'OUVERTE', sophie)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.offre.update).not.toHaveBeenCalled();
  });

  it('cache une offre masquée aux autres (404), pas à l’administrateur', async () => {
    prisma.offre.findUnique.mockResolvedValue({ ...ligne, statut: 'MASQUEE' });
    await expect(service.detail('id-offre', marc)).rejects.toThrow(NotFoundException);
    await expect(
      service.detail('id-offre', { sub: 'id-admin', role: 'ADMIN' }),
    ).resolves.toMatchObject({
      statut: 'MASQUEE',
    });
  });

  it('répond 404 pour une offre qui n’existe pas', async () => {
    prisma.offre.findUnique.mockResolvedValue(null);
    await expect(service.supprimer('id-offre', sophie)).rejects.toThrow(NotFoundException);
  });

  it('supprime aussi les fichiers des photos', async () => {
    prisma.offre.findUnique.mockResolvedValue(ligne);
    prisma.photo_offre.findMany.mockResolvedValue(ligne.photo_offre);

    await service.supprimer('id-offre', sophie);

    expect(prisma.offre.delete).toHaveBeenCalledWith({ where: { id: 'id-offre' } });
    expect(images.supprimer).toHaveBeenCalledWith('/images/chalet.webp');
  });

  it('refuse de supprimer l’offre d’un autre', async () => {
    prisma.offre.findUnique.mockResolvedValue(ligne);
    await expect(service.supprimer('id-offre', marc)).rejects.toThrow(ForbiddenException);
    expect(prisma.offre.delete).not.toHaveBeenCalled();
  });
});

describe('photos (RG-27)', () => {
  it('ajoute une photo à son offre', async () => {
    prisma.offre.findUnique.mockResolvedValue(ligne);
    prisma.photo_offre.count.mockResolvedValue(1);
    images.enregistrer.mockResolvedValue('/images/lac.webp');
    prisma.photo_offre.create.mockResolvedValue({ id: 'id-lac', url: '/images/lac.webp' });

    await expect(service.ajouterPhoto('id-offre', Buffer.from('x'), sophie)).resolves.toEqual({
      id: 'id-lac',
      url: '/images/lac.webp',
    });
  });

  it('refuse une 7e photo, sans rien enregistrer', async () => {
    prisma.offre.findUnique.mockResolvedValue(ligne);
    prisma.photo_offre.count.mockResolvedValue(6);

    await expect(service.ajouterPhoto('id-offre', Buffer.from('x'), sophie)).rejects.toThrow(
      BadRequestException,
    );
    expect(images.enregistrer).not.toHaveBeenCalled();
  });

  it('refuse d’ajouter une photo à l’offre d’un autre', async () => {
    prisma.offre.findUnique.mockResolvedValue(ligne);
    await expect(service.ajouterPhoto('id-offre', Buffer.from('x'), marc)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('ne retire pas une photo qui appartient à une autre offre', async () => {
    prisma.offre.findUnique.mockResolvedValue(ligne);
    prisma.photo_offre.findFirst.mockResolvedValue(null);

    await expect(service.retirerPhoto('id-offre', 'id-autre', sophie)).rejects.toThrow(
      NotFoundException,
    );
    expect(images.supprimer).not.toHaveBeenCalled();
  });
});
