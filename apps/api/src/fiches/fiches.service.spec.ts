import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { FichesService } from './fiches.service.js';

const prisma = {
  fiche: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $queryRaw: vi.fn(),
};
const service = new FichesService(prisma as unknown as PrismaService);

const lea: UtilisateurJwt = { sub: 'id-lea', role: 'ANIMATEUR' };
const karim: UtilisateurJwt = { sub: 'id-karim', role: 'ANIMATEUR' };
const admin: UtilisateurJwt = { sub: 'id-admin', role: 'ADMIN' };

// Une fiche telle que Prisma la renvoie, avec son auteur et son nombre de « j'aime ».
function ficheEnBase(modifs: Record<string, unknown> = {}) {
  return {
    id: 'id-fiche',
    auteur_id: 'id-lea',
    titre: 'Loup-garou sous les étoiles',
    type: 'VEILLEE',
    age_min: 8,
    age_max: 12,
    duree_minutes: 60,
    nb_participants_min: 8,
    nb_participants_max: 20,
    objectifs: null,
    materiel: 'Cartes rôles',
    deroulement: 'Variante du loup-garou en extérieur.',
    image_url: null,
    statut: 'PUBLIEE',
    publiee_le: new Date('2026-10-20T18:00:00Z'),
    cree_le: new Date('2026-10-20T18:00:00Z'),
    modifie_le: new Date('2026-10-20T18:00:00Z'),
    utilisateur: { pseudo: 'lea.anim' },
    _count: { aimer: 3 },
    ...modifs,
  };
}

const nouvelleFiche = {
  titre: 'Rallye nature',
  type: 'JEU' as const,
  ageMin: 6,
  ageMax: 12,
  dureeMinutes: 90,
  deroulement: 'Retrouver les éléments de la nature photographiés.',
  publier: true,
};

beforeEach(() => vi.resetAllMocks());

describe('FichesService.lister', () => {
  it('ne renvoie que les fiches publiées, filtrées par type, âge et titre', async () => {
    prisma.fiche.findMany.mockResolvedValue([ficheEnBase()]);
    prisma.fiche.count.mockResolvedValue(1);

    const page = await service.lister({
      type: 'VEILLEE',
      age: 9,
      recherche: 'loup',
      page: 1,
      parPage: 20,
    });

    const { where } = prisma.fiche.findMany.mock.calls[0][0];
    expect(where).toEqual({
      statut: 'PUBLIEE',
      type: 'VEILLEE',
      age_min: { lte: 9 },
      age_max: { gte: 9 },
      titre: { contains: 'loup', mode: 'insensitive' },
    });
    expect(page.fiches[0]).toMatchObject({
      titre: 'Loup-garou sous les étoiles',
      auteur: 'lea.anim',
      aimes: 3,
    });
  });

  it('calcule la pagination', async () => {
    prisma.fiche.findMany.mockResolvedValue([]);
    prisma.fiche.count.mockResolvedValue(45);

    const page = await service.lister({ page: 3, parPage: 20 });

    expect(prisma.fiche.findMany.mock.calls[0][0]).toMatchObject({ skip: 40, take: 20 });
    expect(page).toMatchObject({ page: 3, pages: 3, total: 45 });
  });
});

describe('FichesService.detail', () => {
  it("cache le brouillon d'un autre utilisateur (404)", async () => {
    prisma.fiche.findUnique.mockResolvedValue(
      ficheEnBase({ statut: 'BROUILLON', publiee_le: null }),
    );
    await expect(service.detail('id-fiche', karim)).rejects.toThrow(NotFoundException);
  });

  it('montre son brouillon à son auteur', async () => {
    prisma.fiche.findUnique.mockResolvedValue(
      ficheEnBase({ statut: 'BROUILLON', publiee_le: null }),
    );
    await expect(service.detail('id-fiche', lea)).resolves.toMatchObject({
      statut: 'BROUILLON',
      estAuteur: true,
    });
  });
});

describe('FichesService.creer', () => {
  it('publie la fiche avec sa date de publication (RG-08)', async () => {
    prisma.fiche.create.mockResolvedValue(ficheEnBase());
    await service.creer(nouvelleFiche, lea);

    const { data } = prisma.fiche.create.mock.calls[0][0];
    expect(data).toMatchObject({
      auteur_id: 'id-lea',
      statut: 'PUBLIEE',
      age_min: 6,
      duree_minutes: 90,
    });
    expect(data.publiee_le).toBeInstanceOf(Date);
  });

  it('enregistre un brouillon sans date de publication', async () => {
    prisma.fiche.create.mockResolvedValue(ficheEnBase({ statut: 'BROUILLON', publiee_le: null }));
    await service.creer({ ...nouvelleFiche, publier: false }, lea);

    expect(prisma.fiche.create.mock.calls[0][0].data).toMatchObject({
      statut: 'BROUILLON',
      publiee_le: null,
    });
  });
});

describe('FichesService.modifier', () => {
  it("refuse la modification par quelqu'un d'autre que l'auteur (RG-06)", async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheEnBase());
    await expect(service.modifier('id-fiche', { titre: 'Pirate' }, karim)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.fiche.update).not.toHaveBeenCalled();
  });

  it('vérifie les âges en tenant compte de ce qui est déjà enregistré', async () => {
    // La fiche va de 8 à 12 ans : un nouveau minimum de 14 dépasserait le maximum.
    prisma.fiche.findUnique.mockResolvedValue(ficheEnBase());
    await expect(service.modifier('id-fiche', { ageMin: 14 }, lea)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('publie un brouillon une seule fois', async () => {
    prisma.fiche.findUnique.mockResolvedValue(
      ficheEnBase({ statut: 'BROUILLON', publiee_le: null }),
    );
    prisma.fiche.update.mockResolvedValue(ficheEnBase());
    await service.modifier('id-fiche', { publier: true }, lea);

    expect(prisma.fiche.update.mock.calls[0][0].data).toMatchObject({ statut: 'PUBLIEE' });
  });

  it('ne republie pas une fiche masquée par la modération', async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheEnBase({ statut: 'MASQUEE' }));
    prisma.fiche.update.mockResolvedValue(ficheEnBase({ statut: 'MASQUEE' }));
    await service.modifier('id-fiche', { publier: true }, lea);

    expect(prisma.fiche.update.mock.calls[0][0].data.statut).toBeUndefined();
  });
});

describe('FichesService.supprimer', () => {
  it("refuse la suppression par quelqu'un d'autre que l'auteur", async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheEnBase());
    await expect(service.supprimer('id-fiche', karim)).rejects.toThrow(ForbiddenException);
    expect(prisma.fiche.delete).not.toHaveBeenCalled();
  });

  it("laisse l'auteur et un administrateur supprimer", async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheEnBase());
    await service.supprimer('id-fiche', lea);
    await service.supprimer('id-fiche', admin);
    expect(prisma.fiche.delete).toHaveBeenCalledTimes(2);
  });

  it('répond 404 pour une fiche qui n’existe pas', async () => {
    prisma.fiche.findUnique.mockResolvedValue(null);
    await expect(service.supprimer('id-inconnu', lea)).rejects.toThrow(NotFoundException);
  });
});
