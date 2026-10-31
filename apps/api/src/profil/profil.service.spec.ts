import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ProfilService } from './profil.service.js';

const prisma = {
  utilisateur: { findUnique: vi.fn() },
  fiche: { count: vi.fn() },
  aimer: { count: vi.fn() },
};
const service = new ProfilService(prisma as unknown as PrismaService);

const lea = {
  id: '00000000-0000-0000-0000-000000000004',
  pseudo: 'lea.anim',
  role: 'ANIMATEUR',
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
