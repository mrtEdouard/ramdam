import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ModerationService } from './moderation.service.js';

const prisma = {
  fiche: { findUnique: vi.fn(), update: vi.fn() },
  commentaire: { findUnique: vi.fn(), update: vi.fn() },
  offre: { findUnique: vi.fn(), update: vi.fn() },
  signalement: { create: vi.fn(), findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn() },
  // La transaction exécute la fonction avec le même faux client.
  $transaction: vi.fn((fonction: (tx: unknown) => unknown) => fonction(prisma)),
};
const service = new ModerationService(prisma as unknown as PrismaService);

const lea: UtilisateurJwt = { sub: 'id-lea', role: 'ANIMATEUR' };
const admin: UtilisateurJwt = { sub: 'id-admin', role: 'ADMIN' };
const ficheDeKarim = { id: 'id-fiche', auteur_id: 'id-karim', statut: 'PUBLIEE' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signaler', () => {
  it('enregistre le motif en clair, sur la bonne colonne', async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheDeKarim);

    await service.signaler(
      { cible: 'FICHE', cibleId: 'id-fiche', motif: 'SPAM', precision: 'lien vers un site' },
      lea,
    );

    expect(prisma.signalement.create).toHaveBeenCalledWith({
      data: {
        auteur_id: 'id-lea',
        motif: 'Spam ou publicité : lien vers un site',
        fiche_id: 'id-fiche',
      },
    });
  });

  it('refuse de signaler son propre contenu', async () => {
    prisma.fiche.findUnique.mockResolvedValue({ ...ficheDeKarim, auteur_id: 'id-lea' });
    await expect(
      service.signaler({ cible: 'FICHE', cibleId: 'id-fiche', motif: 'SPAM' }, lea),
    ).rejects.toThrow(BadRequestException);
  });

  it('répond 404 pour un contenu déjà masqué', async () => {
    prisma.offre.findUnique.mockResolvedValue({ directeur_id: 'id-sophie', statut: 'MASQUEE' });
    await expect(
      service.signaler({ cible: 'OFFRE', cibleId: 'id-offre', motif: 'FAUSSE_OFFRE' }, lea),
    ).rejects.toThrow(NotFoundException);
  });

  it('répond 409 si la même personne signale deux fois (RG-28, index unique)', async () => {
    prisma.fiche.findUnique.mockResolvedValue(ficheDeKarim);
    prisma.signalement.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7',
      }),
    );
    await expect(
      service.signaler({ cible: 'FICHE', cibleId: 'id-fiche', motif: 'SPAM' }, lea),
    ).rejects.toThrow(ConflictException);
  });
});

describe('modérer (RG-29)', () => {
  it('regroupe les signalements d’un même contenu', async () => {
    const fiche = {
      id: 'id-fiche',
      titre: 'Chasse au trésor',
      deroulement: 'Les équipes cherchent le coffre.',
      utilisateur: { pseudo: 'karim_gj' },
    };
    const commun = { fiche_id: 'id-fiche', commentaire_id: null, offre_id: null, fiche };
    prisma.signalement.findMany.mockResolvedValue([
      {
        ...commun,
        motif: 'Spam ou publicité',
        cree_le: new Date('2026-11-01'),
        utilisateur_signalement_auteur_idToutilisateur: { pseudo: 'lea.anim' },
      },
      {
        ...commun,
        motif: 'Insulte ou harcèlement',
        cree_le: new Date('2026-11-02'),
        utilisateur_signalement_auteur_idToutilisateur: null,
      },
    ]);

    const contenus = await service.enAttente();

    expect(contenus).toHaveLength(1);
    expect(contenus[0]).toMatchObject({
      cible: 'FICHE',
      titre: 'Chasse au trésor',
      auteur: 'karim_gj',
    });
    expect(contenus[0].signalements.map((s) => s.par)).toEqual(['lea.anim', null]);
  });

  it('masquer : la fiche passe en MASQUEE et ses signalements sont clos', async () => {
    prisma.signalement.count.mockResolvedValue(2);

    await service.decider('FICHE', 'id-fiche', { decision: 'MASQUER' }, admin);

    expect(prisma.fiche.update).toHaveBeenCalledWith({
      where: { id: 'id-fiche' },
      data: { statut: 'MASQUEE' },
    });
    expect(prisma.signalement.updateMany).toHaveBeenCalledWith({
      where: { statut: 'EN_ATTENTE', fiche_id: 'id-fiche' },
      data: expect.objectContaining({ statut: 'TRAITE', admin_id: 'id-admin' }),
    });
  });

  it('ignorer : le contenu reste, les signalements sont classés', async () => {
    prisma.signalement.count.mockResolvedValue(1);

    await service.decider('COMMENTAIRE', 'id-com', { decision: 'IGNORER' }, admin);

    expect(prisma.commentaire.update).not.toHaveBeenCalled();
    expect(prisma.signalement.updateMany).toHaveBeenCalledWith({
      where: { statut: 'EN_ATTENTE', commentaire_id: 'id-com' },
      data: expect.objectContaining({ statut: 'IGNORE' }),
    });
  });

  it('répond 404 s’il n’y a rien à décider', async () => {
    prisma.signalement.count.mockResolvedValue(0);
    await expect(
      service.decider('OFFRE', 'id-offre', { decision: 'MASQUER' }, admin),
    ).rejects.toThrow(NotFoundException);
  });
});
