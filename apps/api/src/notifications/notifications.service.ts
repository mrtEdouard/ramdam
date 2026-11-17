import { Injectable } from '@nestjs/common';
import type { Notification } from '@ramdam/shared';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Les notifications sont créées par les triggers de la base (migration 004) ;
// ce service se contente de les lire et de les marquer comme lues.
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Les 50 plus récentes, avec le pseudo de la personne et le titre de la fiche.
  async lister(utilisateur: UtilisateurJwt): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { destinataire_id: utilisateur.sub },
      include: {
        utilisateur_notification_acteur_idToutilisateur: { select: { pseudo: true } },
        fiche: { select: { id: true, titre: true } },
      },
      orderBy: { cree_le: 'desc' },
      take: 50,
    });
    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      acteur: notification.utilisateur_notification_acteur_idToutilisateur.pseudo,
      fiche: notification.fiche,
      lue: notification.lue_le !== null,
      creeLe: notification.cree_le.toISOString(),
    }));
  }

  // Le nombre affiché sur la cloche.
  async nombreNonLues(utilisateur: UtilisateurJwt) {
    const nombre = await this.prisma.notification.count({
      where: { destinataire_id: utilisateur.sub, lue_le: null },
    });
    return { nombre };
  }

  async marquerToutesLues(utilisateur: UtilisateurJwt) {
    await this.prisma.notification.updateMany({
      where: { destinataire_id: utilisateur.sub, lue_le: null },
      data: { lue_le: new Date() },
    });
  }
}
