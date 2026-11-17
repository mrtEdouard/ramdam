import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ReactionsService } from './reactions.service.js';

const prisma = {
  fiche: { findUnique: vi.fn() },
  utilisateur: { findUnique: vi.fn() },
  aimer: { upsert: vi.fn(), deleteMany: vi.fn(), count: vi.fn() },
  favori: { upsert: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
};
const service = new ReactionsService(prisma as unknown as PrismaService);

const lea: UtilisateurJwt = { sub: 'id-lea', role: 'ANIMATEUR' };
const karim: UtilisateurJwt = { sub: 'id-karim', role: 'ANIMATEUR' };
const ficheDeLea = { id: 'id-fiche', auteur_id: 'id-lea', statut: 'PUBLIEE' };

beforeEach(() => vi.resetAllMocks());

describe("« J'aime »", () => {
  it("aime la fiche d'un autre et renvoie le nouveau total et l'XP gagnée", async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheDeLea);
    prisma.aimer.count.mockResolvedValue(4);
    // XP de Karim avant puis après : le trigger de la base lui a donné 1 XP (RG-23).
    prisma.utilisateur.findUnique
      .mockResolvedValueOnce({ xp: 40 })
      .mockResolvedValueOnce({ xp: 41 });

    await expect(service.aimer('id-fiche', karim)).resolves.toEqual({
      aimes: 4,
      aimeeParMoi: true,
      xpGagne: 1,
    });
    expect(prisma.aimer.upsert.mock.calls[0][0].create).toEqual({
      utilisateur_id: 'id-karim',
      fiche_id: 'id-fiche',
    });
  });

  it('refuse que l’auteur aime sa propre fiche', async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheDeLea);
    await expect(service.aimer('id-fiche', lea)).rejects.toThrow(ForbiddenException);
    expect(prisma.aimer.upsert).not.toHaveBeenCalled();
  });

  it("refuse d'aimer un brouillon (404, comme s'il n'existait pas)", async () => {
    prisma.fiche.findUnique.mockResolvedValue({ ...ficheDeLea, statut: 'BROUILLON' });
    await expect(service.aimer('id-fiche', karim)).rejects.toThrow(NotFoundException);
  });

  it('retire son « j’aime »', async () => {
    prisma.aimer.count.mockResolvedValue(3);
    await expect(service.retirerAime('id-fiche', karim)).resolves.toEqual({
      aimes: 3,
      aimeeParMoi: false,
      xpGagne: 0,
    });
    expect(prisma.aimer.deleteMany).toHaveBeenCalledWith({
      where: { utilisateur_id: 'id-karim', fiche_id: 'id-fiche' },
    });
  });
});

describe('Malle', () => {
  it("garde la fiche d'un autre", async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheDeLea);
    await expect(service.garder('id-fiche', karim)).resolves.toEqual({ dansMaMalle: true });
    expect(prisma.favori.upsert).toHaveBeenCalled();
  });

  it('refuse de garder sa propre fiche (RG-14)', async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheDeLea);
    await expect(service.garder('id-fiche', lea)).rejects.toThrow(
      'Tes fiches sont déjà dans ta galerie',
    );
    expect(prisma.favori.upsert).not.toHaveBeenCalled();
  });

  it('ne liste que les fiches gardées encore publiées', async () => {
    prisma.favori.findMany.mockResolvedValue([]);
    await service.malle(karim);
    expect(prisma.favori.findMany.mock.calls[0][0].where).toEqual({
      utilisateur_id: 'id-karim',
      fiche: { statut: 'PUBLIEE' },
    });
  });
});
