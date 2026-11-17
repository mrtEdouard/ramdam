import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { EtatAime, FicheResume } from '@ramdam/shared';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AVEC_AUTEUR_ET_AIMES, versResume } from './fiches.service.js';

// « J'aime » et galerie (appelée « Malle » dans le code et la base) : ce qu'un animateur fait sur les fiches des autres.
// L'XP de l'auteur est donnée par les triggers de la base (aimer_xp : +2, favori_xp : +10),
// une seule fois par personne grâce à l'historique (RG-17, RG-18).
@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async aimer(id: string, utilisateur: UtilisateurJwt): Promise<EtatAime> {
    await this.ficheDUnAutre(id, utilisateur, 'Tu ne peux pas aimer ta propre fiche');
    // Le trigger de la base décide du gain (RG-23) : on compare l'XP avant et après pour l'annoncer.
    const avant = await this.xpDe(utilisateur);
    // upsert : aimer deux fois ne crée pas de doublon (RG-12) et ne renvoie pas d'erreur.
    await this.prisma.aimer.upsert({
      where: cle(id, utilisateur),
      create: { utilisateur_id: utilisateur.sub, fiche_id: id },
      update: {},
    });
    const xpGagne = (await this.xpDe(utilisateur)) - avant;
    return { ...(await this.etatAime(id, true)), xpGagne };
  }

  async retirerAime(id: string, utilisateur: UtilisateurJwt): Promise<EtatAime> {
    // deleteMany : retirer un « j'aime » qui n'existe pas n'est pas une erreur.
    await this.prisma.aimer.deleteMany({
      where: { utilisateur_id: utilisateur.sub, fiche_id: id },
    });
    return { ...(await this.etatAime(id, false)), xpGagne: 0 };
  }

  async garder(id: string, utilisateur: UtilisateurJwt) {
    // RG-14 : la base refuse aussi, mais on donne ici un message clair.
    await this.ficheDUnAutre(id, utilisateur, 'Tes fiches sont déjà dans ta galerie');
    // La Malle garde un simple lien vers la fiche : si son auteur la modifie, on voit la nouvelle version.
    await this.prisma.favori.upsert({
      where: cle(id, utilisateur),
      create: { utilisateur_id: utilisateur.sub, fiche_id: id },
      update: {},
    });
    return { dansMaMalle: true };
  }

  async retirerDeLaMalle(id: string, utilisateur: UtilisateurJwt) {
    await this.prisma.favori.deleteMany({
      where: { utilisateur_id: utilisateur.sub, fiche_id: id },
    });
    return { dansMaMalle: false };
  }

  // Les fiches gardées, de la plus récemment ajoutée à la plus ancienne.
  // Une fiche masquée par la modération ou repassée en brouillon n'apparaît plus.
  async malle(utilisateur: UtilisateurJwt): Promise<FicheResume[]> {
    const favoris = await this.prisma.favori.findMany({
      where: { utilisateur_id: utilisateur.sub, fiche: { statut: 'PUBLIEE' } },
      include: { fiche: { include: AVEC_AUTEUR_ET_AIMES } },
      orderBy: { ajoute_le: 'desc' },
    });
    return favoris.map((favori) => versResume(favori.fiche));
  }

  // On ne réagit qu'à une fiche publiée, et pas à la sienne.
  private async ficheDUnAutre(id: string, utilisateur: UtilisateurJwt, messageSiAuteur: string) {
    const fiche = await this.prisma.fiche.findUnique({ where: { id } });
    if (!fiche || fiche.statut !== 'PUBLIEE') {
      throw new NotFoundException('Fiche introuvable');
    }
    if (fiche.auteur_id === utilisateur.sub) {
      throw new ForbiddenException(messageSiAuteur);
    }
  }

  private async xpDe(utilisateur: UtilisateurJwt) {
    const ligne = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateur.sub },
      select: { xp: true },
    });
    return ligne?.xp ?? 0;
  }

  private async etatAime(id: string, aimeeParMoi: boolean): Promise<Omit<EtatAime, 'xpGagne'>> {
    return { aimes: await this.prisma.aimer.count({ where: { fiche_id: id } }), aimeeParMoi };
  }
}

const cle = (id: string, utilisateur: UtilisateurJwt) => ({
  utilisateur_id_fiche_id: { utilisateur_id: utilisateur.sub, fiche_id: id },
});
