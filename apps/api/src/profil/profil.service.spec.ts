import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { StockageImages } from '../images/stockage-images.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ProfilService } from './profil.service.js';

const prisma = {
  utilisateur: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
  fiche: { count: vi.fn(), findMany: vi.fn() },
  photo_fiche: { findMany: vi.fn() },
  photo_offre: { findMany: vi.fn() },
  historique_xp: { findMany: vi.fn() },
  aimer: { count: vi.fn() },
};
const images = { enregistrer: vi.fn(), supprimer: vi.fn() };
const service = new ProfilService(
  prisma as unknown as PrismaService,
  images as unknown as StockageImages,
);

const lea = {
  id: '00000000-0000-0000-0000-000000000004',
  pseudo: 'lea.anim',
  role: 'ANIMATEUR',
  bio: 'Stagiaire BAFA',
  avatar_url: null,
  xp: 340,
  statut: 'ACTIF',
  cree_le: new Date('2026-09-01T10:00:00Z'),
};

beforeEach(() => vi.resetAllMocks());

describe('ProfilService.trouver', () => {
  it('renvoie le profil public avec le nombre de fiches et de « j aime » reçus', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(lea);
    prisma.fiche.count.mockResolvedValue(4);
    prisma.aimer.count.mockResolvedValue(27);

    await expect(service.trouver({ pseudo: 'lea.anim' })).resolves.toEqual({
      pseudo: 'lea.anim',
      role: 'ANIMATEUR',
      bio: 'Stagiaire BAFA',
      avatarUrl: null,
      xp: 340,
      membreDepuis: '2026-09-01T10:00:00.000Z',
      fichesPubliees: 4,
      aimesRecus: 27,
    });
  });

  it('ne compte que les fiches publiées et les « j aime » reçus sur celles-ci', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(lea);
    prisma.fiche.count.mockResolvedValue(0);
    prisma.aimer.count.mockResolvedValue(0);

    await service.trouver({ id: lea.id });

    const publiees = { auteur_id: lea.id, statut: 'PUBLIEE' };
    expect(prisma.fiche.count).toHaveBeenCalledWith({ where: publiees });
    expect(prisma.aimer.count).toHaveBeenCalledWith({ where: { fiche: publiees } });
  });

  it('répond 404 pour un pseudo inconnu', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(null);
    await expect(service.trouver({ pseudo: 'personne' })).rejects.toThrow(NotFoundException);
  });

  it('cache le profil d’un compte suspendu', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue({ ...lea, statut: 'SUSPENDU' });
    await expect(service.trouver({ pseudo: 'lea.anim' })).rejects.toThrow(NotFoundException);
  });
});

describe('ProfilService.historiqueXp', () => {
  it('renvoie les 5 derniers gains du compte, avec la fiche et la personne qui a agi', async () => {
    prisma.historique_xp.findMany.mockResolvedValue([
      {
        id: 12n,
        action: 'FICHE_AIMEE',
        points: 2,
        source_id: 'id-fiche',
        declencheur_id: 'id-karim',
        gagne_le: new Date('2026-11-16T10:00:00Z'),
      },
      {
        id: 11n,
        action: 'FICHE_PUBLIEE',
        points: 50,
        source_id: 'id-fiche',
        declencheur_id: lea.id,
        gagne_le: new Date('2026-11-15T10:00:00Z'),
      },
    ]);
    prisma.fiche.findMany.mockResolvedValue([{ id: 'id-fiche', titre: 'Béret express' }]);
    prisma.utilisateur.findMany.mockResolvedValue([{ id: 'id-karim', pseudo: 'karim' }]);

    const historique = await service.historiqueXp(lea.id);

    expect(prisma.historique_xp.findMany).toHaveBeenCalledWith({
      where: { utilisateur_id: lea.id },
      orderBy: { gagne_le: 'desc' },
      take: 5,
    });
    expect(historique).toEqual([
      {
        id: '12',
        action: 'FICHE_AIMEE',
        points: 2,
        gagneLe: '2026-11-16T10:00:00.000Z',
        fiche: { id: 'id-fiche', titre: 'Béret express' },
        par: 'karim',
      },
      {
        id: '11',
        action: 'FICHE_PUBLIEE',
        points: 50,
        gagneLe: '2026-11-15T10:00:00.000Z',
        fiche: { id: 'id-fiche', titre: 'Béret express' },
        par: null, // gagné par soi-même
      },
    ]);
  });
});

describe('modifier son profil', () => {
  it('une bio vide devient null', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(lea);
    await service.modifier(lea.id, { bio: '' });
    expect(prisma.utilisateur.update).toHaveBeenCalledWith({
      where: { id: lea.id },
      data: { bio: null },
    });
  });

  it('une nouvelle photo remplace l’ancienne, effacée du disque', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue({
      ...lea,
      avatar_url: '/images/ancienne.webp',
    });
    images.enregistrer.mockResolvedValue('/images/nouvelle.webp');

    await service.changerAvatar(lea.id, Buffer.from('photo'));

    expect(prisma.utilisateur.update).toHaveBeenCalledWith({
      where: { id: lea.id },
      data: { avatar_url: '/images/nouvelle.webp' },
    });
    expect(images.supprimer).toHaveBeenCalledWith('/images/ancienne.webp');
  });
});

describe('supprimer son compte (RGPD)', () => {
  let hash: string;
  beforeAll(async () => {
    hash = await argon2.hash('Bon-mot-de-passe-1');
  });

  it('refuse un mauvais mot de passe, sans rien supprimer', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue({ mot_de_passe_hash: hash, avatar_url: null });

    await expect(service.supprimerCompte(lea.id, 'mauvais')).rejects.toThrow(ForbiddenException);
    expect(prisma.utilisateur.delete).not.toHaveBeenCalled();
  });

  it('supprime le compte puis les fichiers de ses photos', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue({
      mot_de_passe_hash: hash,
      avatar_url: '/images/avatar.webp',
    });
    prisma.fiche.findMany.mockResolvedValue([{ image_url: '/images/couverture.webp' }]);
    prisma.photo_fiche.findMany.mockResolvedValue([{ url: '/images/galerie.webp' }]);
    prisma.photo_offre.findMany.mockResolvedValue([]);

    await service.supprimerCompte(lea.id, 'Bon-mot-de-passe-1');

    expect(prisma.utilisateur.delete).toHaveBeenCalledWith({ where: { id: lea.id } });
    for (const url of ['/images/avatar.webp', '/images/couverture.webp', '/images/galerie.webp']) {
      expect(images.supprimer).toHaveBeenCalledWith(url);
    }
  });
});
