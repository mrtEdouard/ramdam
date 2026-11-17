import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { CommentairesService } from './commentaires.service.js';

const prisma = {
  fiche: { findUnique: vi.fn() },
  utilisateur: { findUnique: vi.fn() },
  commentaire: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
};
const service = new CommentairesService(prisma as unknown as PrismaService);

const karim: UtilisateurJwt = { sub: 'id-karim', role: 'ANIMATEUR' };
const fichePubliee = { id: 'id-fiche', auteur_id: 'id-lea', statut: 'PUBLIEE' };
const ligne = (id: string, parent_id: string | null, auteur_id: string, pseudo: string) => ({
  id,
  fiche_id: 'id-fiche',
  parent_id,
  auteur_id,
  contenu: `texte ${id}`,
  statut: 'VISIBLE',
  cree_le: new Date('2026-11-17T10:00:00Z'),
  utilisateur: { pseudo },
});

beforeEach(() => vi.resetAllMocks());

describe('lister', () => {
  it('range les réponses sous leur commentaire, les commentaires récents en premier', async () => {
    prisma.fiche.findUnique.mockResolvedValue(fichePubliee);
    prisma.commentaire.findMany.mockResolvedValue([
      ligne('c1', null, 'id-lea', 'lea'),
      ligne('c2', null, 'id-karim', 'karim'),
      ligne('r1', 'c1', 'id-karim', 'karim'),
    ]);

    const commentaires = await service.lister('id-fiche', karim);

    expect(commentaires.map((c) => c.id)).toEqual(['c2', 'c1']);
    expect(commentaires[1].reponses).toEqual([
      expect.objectContaining({ id: 'r1', auteur: 'karim', estAMoi: true }),
    ]);
    expect(commentaires[1].estAMoi).toBe(false);
    // Seuls les commentaires visibles (non masqués par la modération) sont lus.
    expect(prisma.commentaire.findMany.mock.calls[0][0].where).toEqual({
      fiche_id: 'id-fiche',
      statut: 'VISIBLE',
    });
  });

  it("refuse les commentaires d'un brouillon (404)", async () => {
    prisma.fiche.findUnique.mockResolvedValue({ ...fichePubliee, statut: 'BROUILLON' });
    await expect(service.lister('id-fiche', karim)).rejects.toThrow(NotFoundException);
  });
});

describe('envoyer', () => {
  it("publie un commentaire et annonce l'XP gagnée", async () => {
    prisma.fiche.findUnique.mockResolvedValue(fichePubliee);
    prisma.utilisateur.findUnique
      .mockResolvedValueOnce({ xp: 10 })
      .mockResolvedValueOnce({ xp: 15 });
    prisma.commentaire.create.mockResolvedValue(ligne('c3', null, 'id-karim', 'karim'));

    const envoi = await service.envoyer('id-fiche', { contenu: 'Top !' }, karim);

    expect(envoi.xpGagne).toBe(5);
    expect(prisma.commentaire.create.mock.calls[0][0].data).toEqual({
      fiche_id: 'id-fiche',
      auteur_id: 'id-karim',
      parent_id: null,
      contenu: 'Top !',
    });
  });

  it("rattache une réponse à une réponse au commentaire d'origine (un seul niveau)", async () => {
    prisma.fiche.findUnique.mockResolvedValue(fichePubliee);
    prisma.commentaire.findUnique.mockResolvedValue(ligne('r1', 'c1', 'id-lea', 'lea'));
    prisma.utilisateur.findUnique.mockResolvedValue({ xp: 10 });
    prisma.commentaire.create.mockResolvedValue(ligne('r2', 'c1', 'id-karim', 'karim'));

    await service.envoyer('id-fiche', { contenu: 'Merci', parentId: 'r1' }, karim);

    expect(prisma.commentaire.create.mock.calls[0][0].data.parent_id).toBe('c1');
  });

  it("refuse de répondre à un commentaire d'une autre fiche", async () => {
    prisma.fiche.findUnique.mockResolvedValue(fichePubliee);
    prisma.commentaire.findUnique.mockResolvedValue({
      ...ligne('c9', null, 'id-lea', 'lea'),
      fiche_id: 'autre-fiche',
    });
    await expect(
      service.envoyer('id-fiche', { contenu: 'Hop', parentId: 'c9' }, karim),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.commentaire.create).not.toHaveBeenCalled();
  });
});

describe('supprimer', () => {
  it('supprime son propre commentaire', async () => {
    prisma.commentaire.findUnique.mockResolvedValue(ligne('c2', null, 'id-karim', 'karim'));
    await service.supprimer('id-fiche', 'c2', karim);
    expect(prisma.commentaire.delete).toHaveBeenCalledWith({ where: { id: 'c2' } });
  });

  it("refuse de supprimer le commentaire d'un autre", async () => {
    prisma.commentaire.findUnique.mockResolvedValue(ligne('c1', null, 'id-lea', 'lea'));
    await expect(service.supprimer('id-fiche', 'c1', karim)).rejects.toThrow(ForbiddenException);
    expect(prisma.commentaire.delete).not.toHaveBeenCalled();
  });
});
