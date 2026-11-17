import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PHOTOS_PAR_OFFRE,
  type FiltresOffres,
  type OffreDetail,
  type OffreDto,
  type OffreResume,
  type PageDOffres,
  type PhotoOffre,
  type StatutOffre,
} from '@ramdam/shared';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import type { Prisma } from '../generated/prisma/client.js';
import { StockageImages } from '../images/stockage-images.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

// On lit toujours le pseudo du Directeur et les photos, de la plus ancienne à la plus récente.
const AVEC_DIRECTEUR = {
  utilisateur: { select: { pseudo: true } },
  photo_offre: { select: { id: true, url: true }, orderBy: { ajoutee_le: 'asc' } },
} as const;
type OffreLue = Prisma.offreGetPayload<{ include: typeof AVEC_DIRECTEUR }>;

// Offres de recrutement. Tout le monde les lit ; seuls les Directeurs les publient (RG-15),
// et seul le Directeur qui a publié une offre peut la modifier, la clôturer ou la supprimer.
@Injectable()
export class OffresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly images: StockageImages,
  ) {}

  // Les offres ouvertes et pas encore terminées, filtrées par région, type et mois.
  async lister(filtres: FiltresOffres): Promise<PageDOffres> {
    const where: Prisma.offreWhereInput = {
      statut: 'OUVERTE',
      date_fin: { gte: aujourdhui() },
      region: filtres.region,
      type_structure: filtres.typeStructure,
    };
    if (filtres.mois) {
      // Une offre est dans le mois si elle commence avant sa fin et finit après son début.
      const [annee, mois] = filtres.mois.split('-').map(Number);
      where.date_debut = { lte: new Date(Date.UTC(annee, mois, 0)) }; // dernier jour du mois
      where.date_fin = { gte: maxDate(aujourdhui(), new Date(Date.UTC(annee, mois - 1, 1))) };
    }

    const [offres, total] = await Promise.all([
      this.prisma.offre.findMany({
        where,
        include: AVEC_DIRECTEUR,
        // Celles qui commencent le plus tôt d'abord ; l'id départage les égalités (pagination stable).
        orderBy: [{ date_debut: 'asc' }, { id: 'asc' }],
        skip: (filtres.page - 1) * filtres.parPage,
        take: filtres.parPage,
      }),
      this.prisma.offre.count({ where }),
    ]);
    return {
      offres: offres.map(versResume),
      page: filtres.page,
      pages: Math.max(1, Math.ceil(total / filtres.parPage)),
      total,
    };
  }

  // Toutes les offres du Directeur connecté, clôturées comprises, les plus récentes d'abord.
  async miennes(utilisateur: UtilisateurJwt): Promise<OffreResume[]> {
    const offres = await this.prisma.offre.findMany({
      where: { directeur_id: utilisateur.sub },
      include: AVEC_DIRECTEUR,
      orderBy: { cree_le: 'desc' },
    });
    return offres.map(versResume);
  }

  async detail(id: string, utilisateur: UtilisateurJwt): Promise<OffreDetail> {
    const offre = await this.prisma.offre.findUnique({ where: { id }, include: AVEC_DIRECTEUR });
    // Une offre masquée par la modération (RG-29) n'existe plus que pour son Directeur
    // et pour l'administrateur ; pour les autres, 404.
    const peutVoir =
      offre?.statut !== 'MASQUEE' ||
      offre.directeur_id === utilisateur.sub ||
      utilisateur.role === 'ADMIN';
    if (!offre || !peutVoir) {
      throw new NotFoundException('Offre introuvable');
    }
    return versDetail(offre, utilisateur);
  }

  async creer(dto: OffreDto, utilisateur: UtilisateurJwt): Promise<OffreDetail> {
    // RolesGuard a déjà refusé les non-Directeurs ; le trigger offre_role_directeur aussi (RG-15).
    const offre = await this.prisma.offre.create({
      data: { ...versColonnes(dto), directeur_id: utilisateur.sub },
      include: AVEC_DIRECTEUR,
    });
    return versDetail(offre, utilisateur);
  }

  async modifier(id: string, dto: OffreDto, utilisateur: UtilisateurJwt): Promise<OffreDetail> {
    await this.offreDe(id, utilisateur);
    const offre = await this.prisma.offre.update({
      where: { id },
      data: versColonnes(dto),
      include: AVEC_DIRECTEUR,
    });
    return versDetail(offre, utilisateur);
  }

  // Clôturer : le poste est pourvu, l'offre disparaît de la liste mais reste consultable.
  async changerStatut(id: string, statut: StatutOffre, utilisateur: UtilisateurJwt) {
    const offre = await this.offreDe(id, utilisateur);
    // Rouvrir une offre masquée la ferait réapparaître : seule la modération en décide.
    if (offre.statut === 'MASQUEE') {
      throw new ForbiddenException('Cette offre a été masquée par la modération');
    }
    await this.prisma.offre.update({ where: { id }, data: { statut } });
    return { statut };
  }

  async supprimer(id: string, utilisateur: UtilisateurJwt) {
    await this.offreDe(id, utilisateur);
    const photos = await this.prisma.photo_offre.findMany({ where: { offre_id: id } });
    // La base supprime les lignes des photos avec l'offre (ON DELETE CASCADE) ;
    // les fichiers, eux, sont effacés du disque ici.
    await this.prisma.offre.delete({ where: { id } });
    await Promise.all(photos.map((photo) => this.images.supprimer(photo.url)));
  }

  // ---------- Photos (RG-27) ----------

  async ajouterPhoto(
    id: string,
    contenu: Buffer,
    utilisateur: UtilisateurJwt,
  ): Promise<PhotoOffre> {
    await this.offreDe(id, utilisateur);
    const nombre = await this.prisma.photo_offre.count({ where: { offre_id: id } });
    if (nombre >= PHOTOS_PAR_OFFRE) {
      throw new BadRequestException(`${PHOTOS_PAR_OFFRE} photos maximum par offre`);
    }
    const url = await this.images.enregistrer(contenu);
    return this.prisma.photo_offre.create({
      data: { offre_id: id, url },
      select: { id: true, url: true },
    });
  }

  async retirerPhoto(id: string, photoId: string, utilisateur: UtilisateurJwt) {
    await this.offreDe(id, utilisateur);
    // La photo doit appartenir à cette offre : on ne supprime pas la photo d'une autre offre.
    const photo = await this.prisma.photo_offre.findFirst({ where: { id: photoId, offre_id: id } });
    if (!photo) {
      throw new NotFoundException('Photo introuvable');
    }
    await this.prisma.photo_offre.delete({ where: { id: photoId } });
    await this.images.supprimer(photo.url);
  }

  // L'offre existe et appartient au Directeur connecté, sinon 404 ou 403.
  private async offreDe(id: string, utilisateur: UtilisateurJwt) {
    const offre = await this.prisma.offre.findUnique({ where: { id } });
    if (!offre) {
      throw new NotFoundException('Offre introuvable');
    }
    if (offre.directeur_id !== utilisateur.sub) {
      throw new ForbiddenException('Ce n’est pas ton offre');
    }
    return offre;
  }
}

// Les dates sans heure sont échangées au format AAAA-MM-JJ.
const versJour = (date: Date) => date.toISOString().slice(0, 10);
const aujourdhui = () => new Date(versJour(new Date()));
const maxDate = (a: Date, b: Date) => (a > b ? a : b);

function versColonnes(dto: OffreDto) {
  return {
    intitule: dto.intitule,
    structure: dto.structure,
    type_structure: dto.typeStructure,
    region: dto.region,
    ville: dto.ville,
    date_debut: new Date(dto.dateDebut),
    date_fin: new Date(dto.dateFin),
    description: dto.description,
    // Un champ vide devient null : « pas de diplôme demandé ».
    diplome_requis: dto.diplomeRequis || null,
    contact_externe: dto.contactExterne,
  };
}

function versResume(offre: OffreLue): OffreResume {
  return {
    id: offre.id,
    intitule: offre.intitule,
    structure: offre.structure,
    typeStructure: offre.type_structure,
    region: offre.region,
    ville: offre.ville,
    dateDebut: versJour(offre.date_debut),
    dateFin: versJour(offre.date_fin),
    directeur: offre.utilisateur.pseudo,
    statut: offre.statut,
    photoUrl: offre.photo_offre[0]?.url ?? null,
  };
}

function versDetail(offre: OffreLue, utilisateur: UtilisateurJwt): OffreDetail {
  return {
    ...versResume(offre),
    description: offre.description,
    diplomeRequis: offre.diplome_requis,
    contactExterne: offre.contact_externe,
    photos: offre.photo_offre,
    estAMoi: offre.directeur_id === utilisateur.sub,
  };
}
