import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from './notifications.service.js';

const prisma = {
  notification: { findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn() },
};
const service = new NotificationsService(prisma as unknown as PrismaService);
const lea: UtilisateurJwt = { sub: 'id-lea', role: 'ANIMATEUR' };

beforeEach(() => vi.resetAllMocks());

describe('NotificationsService', () => {
  it('ne renvoie que les notifications de la personne connectée, avec le pseudo et la fiche', async () => {
    prisma.notification.findMany.mockResolvedValue([
      {
        id: 'id-notif',
        type: 'FICHE_AIMEE',
        lue_le: null,
        cree_le: new Date('2026-11-16T17:26:00Z'),
        utilisateur_notification_acteur_idToutilisateur: { pseudo: 'karim_gj' },
        fiche: { id: 'id-fiche', titre: 'Loup-garou' },
      },
    ]);

    await expect(service.lister(lea)).resolves.toEqual([
      {
        id: 'id-notif',
        type: 'FICHE_AIMEE',
        acteur: 'karim_gj',
        fiche: { id: 'id-fiche', titre: 'Loup-garou' },
        lue: false,
        creeLe: '2026-11-16T17:26:00.000Z',
      },
    ]);
    expect(prisma.notification.findMany.mock.calls[0][0].where).toEqual({
      destinataire_id: 'id-lea',
    });
  });

  it('compte les notifications non lues', async () => {
    prisma.notification.count.mockResolvedValue(3);
    await expect(service.nombreNonLues(lea)).resolves.toEqual({ nombre: 3 });
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { destinataire_id: 'id-lea', lue_le: null },
    });
  });

  it('marque seulement ses propres notifications non lues comme lues', async () => {
    await service.marquerToutesLues(lea);
    expect(prisma.notification.updateMany.mock.calls[0][0].where).toEqual({
      destinataire_id: 'id-lea',
      lue_le: null,
    });
  });
});
