import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import type { StockageImages } from '../images/stockage-images.service.js';
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
  aimer: { findUnique: vi.fn() },
  favori: { findUnique: vi.fn() },
  photo_fiche: {
    count: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  $queryRaw: vi.fn(),
};
// Le stockage des images est simulé : les tests ne touchent pas au disque.
const images = { enregistrer: vi.fn(), supprimer: vi.fn() };
const service = new FichesService(
  prisma as unknown as PrismaService,
  images as unknown as StockageImages,
);

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
    type_personnalise: null,
    age_min: 8,
    age_max: 12,
    duree_minutes: 60,
    nb_participants_min: 8,
    nb_participants_max: 20,
    objectifs: [],
    materiel: ['Cartes rôles'],
    deroulement: 'Variante du loup-garou en extérieur.',
    image_url: null,
    statut: 'PUBLIEE',
    publiee_le: new Date('2026-10-20T18:00:00Z'),
    cree_le: new Date('2026-10-20T18:00:00Z'),
    modifie_le: new Date('2026-10-20T18:00:00Z'),
    utilisateur: { pseudo: 'lea.anim' },
    _count: { aimer: 3 },
    photo_fiche: [],
    ...modifs,
  };
}

const nouvelleFiche = {
  titre: 'Rallye nature',
  type: 'JEU' as const,
  ageMin: 6,
  ageMax: 12,
  dureeMinutes: 90,
  materiel: ['Fiches photos', 'Crayons'],
  objectifs: [],
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

describe('FichesService.creer avec un type personnalisé', () => {
  it('garde le nom du type pour « Autre » (RG-21)', async () => {
    prisma.fiche.create.mockResolvedValue(ficheEnBase());
    await service.creer({ ...nouvelleFiche, type: 'AUTRE', typePersonnalise: 'Théâtre' }, lea);
    expect(prisma.fiche.create.mock.calls[0][0].data.type_personnalise).toBe('Théâtre');
  });

  it('ignore le nom de type pour un type prédéfini', async () => {
    prisma.fiche.create.mockResolvedValue(ficheEnBase());
    await service.creer({ ...nouvelleFiche, typePersonnalise: 'Théâtre' }, lea);
    expect(prisma.fiche.create.mock.calls[0][0].data.type_personnalise).toBeNull();
  });
});

describe('FichesService.modifier', () => {
  it('refuse de passer au type « Autre » sans lui donner de nom', async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheEnBase());
    await expect(service.modifier('id-fiche', { type: 'AUTRE' }, lea)).rejects.toThrow(
      BadRequestException,
    );
  });

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
    prisma.photo_fiche.findMany.mockResolvedValue([]);
    await service.supprimer('id-fiche', lea);
    await service.supprimer('id-fiche', admin);
    expect(prisma.fiche.delete).toHaveBeenCalledTimes(2);
  });

  it('répond 404 pour une fiche qui n’existe pas', async () => {
    prisma.fiche.findUnique.mockResolvedValue(null);
    await expect(service.supprimer('id-inconnu', lea)).rejects.toThrow(NotFoundException);
  });
});

describe('Photos', () => {
  it('ajoute une photo à la galerie de sa fiche', async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheEnBase());
    prisma.photo_fiche.count.mockResolvedValue(2);
    images.enregistrer.mockResolvedValue('/images/abc.webp');
    prisma.photo_fiche.create.mockResolvedValue({ id: 'id-photo', url: '/images/abc.webp' });

    await expect(service.ajouterPhoto('id-fiche', Buffer.from('x'), lea)).resolves.toEqual({
      id: 'id-photo',
      url: '/images/abc.webp',
    });
  });

  it('refuse une onzième photo (RG-22), sans rien enregistrer sur le disque', async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheEnBase());
    prisma.photo_fiche.count.mockResolvedValue(10);

    await expect(service.ajouterPhoto('id-fiche', Buffer.from('x'), lea)).rejects.toThrow(
      'La galerie est pleine',
    );
    expect(images.enregistrer).not.toHaveBeenCalled();
  });

  it("refuse d'ajouter une photo à la fiche de quelqu'un d'autre", async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheEnBase());
    await expect(service.ajouterPhoto('id-fiche', Buffer.from('x'), karim)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('ne supprime pas une photo qui appartient à une autre fiche', async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheEnBase());
    prisma.photo_fiche.findFirst.mockResolvedValue(null);

    await expect(service.retirerPhoto('id-fiche', 'id-photo-ailleurs', lea)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.photo_fiche.delete).not.toHaveBeenCalled();
  });

  it("remplace la couverture et efface l'ancienne du disque", async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheEnBase({ image_url: '/images/ancienne.webp' }));
    images.enregistrer.mockResolvedValue('/images/nouvelle.webp');
    prisma.fiche.update.mockResolvedValue(ficheEnBase({ image_url: '/images/nouvelle.webp' }));

    const fiche = await service.changerCouverture('id-fiche', Buffer.from('x'), lea);

    expect(fiche.imageUrl).toBe('/images/nouvelle.webp');
    expect(images.supprimer).toHaveBeenCalledWith('/images/ancienne.webp');
  });

  it('efface la couverture et la galerie du disque quand la fiche est supprimée', async () => {
    prisma.fiche.findUnique.mockResolvedValue(
      ficheEnBase({ image_url: '/images/couverture.webp' }),
    );
    prisma.photo_fiche.findMany.mockResolvedValue([{ url: '/images/photo-1.webp' }]);

    await service.supprimer('id-fiche', lea);

    expect(images.supprimer).toHaveBeenCalledWith('/images/couverture.webp');
    expect(images.supprimer).toHaveBeenCalledWith('/images/photo-1.webp');
  });
});
