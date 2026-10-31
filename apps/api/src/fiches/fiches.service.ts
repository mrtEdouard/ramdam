import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PHOTOS_PAR_FICHE,
  type CreerFicheDto,
  type FicheDetail,
  type FicheResume,
  type FiltresFiches,
  type ModifierFicheDto,
  type PageDeFiches,
  type PhotoFiche,
  type TypeFiche,
} from '@ramdam/shared';
import type { Prisma } from '../generated/prisma/client.js';
import type { UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { StockageImages } from '../images/stockage-images.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Champs lus pour chaque fiche : l'auteur et le nombre de « j'aime » viennent des tables liées.
const AVEC_AUTEUR_ET_AIMES = {
  utilisateur: { select: { pseudo: true } },
  _count: { select: { aimer: true } },
} as const;

// Pour le détail, on ajoute la galerie, de la plus ancienne photo à la plus récente.
const DETAIL = {
  ...AVEC_AUTEUR_ET_AIMES,
  photo_fiche: { select: { id: true, url: true }, orderBy: { ajoutee_le: 'asc' } },
} as const;

type FicheLue = Prisma.ficheGetPayload<{ include: typeof AVEC_AUTEUR_ET_AIMES }>;
type FicheDetaillee = Prisma.ficheGetPayload<{ include: typeof DETAIL }>;

@Injectable()
export class FichesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly images: StockageImages,
  ) {}

  async lister(filtres: FiltresFiches): Promise<PageDeFiches> {
    // Seules les fiches publiées sont visibles dans la liste.
    const where: Prisma.ficheWhereInput = {
      statut: 'PUBLIEE',
      type: filtres.type,
      // Une fiche convient à un âge s'il est compris entre son âge minimum et son âge maximum.
      ...(filtres.age !== undefined && {
        age_min: { lte: filtres.age },
        age_max: { gte: filtres.age },
      }),
      ...(filtres.recherche && {
        titre: { contains: filtres.recherche, mode: 'insensitive' },
      }),
    };

    // Les deux requêtes partent ensemble : la page demandée et le nombre total de résultats.
    const [fiches, total] = await Promise.all([
      this.prisma.fiche.findMany({
        where,
        include: AVEC_AUTEUR_ET_AIMES,
        orderBy: { publiee_le: 'desc' },
        skip: (filtres.page - 1) * filtres.parPage,
        take: filtres.parPage,
      }),
      this.prisma.fiche.count({ where }),
    ]);

    return {
      fiches: fiches.map(versResume),
      page: filtres.page,
      pages: Math.max(1, Math.ceil(total / filtres.parPage)),
      total,
    };
  }

  // La fiche qui a reçu le plus de « j'aime » ces 7 derniers jours ; à égalité, la plus récente.
  async aLaUne(): Promise<FicheResume | null> {
    // Prisma ne sait pas trier sur un comptage filtré : on écrit la requête en SQL.
    // Le gabarit `` $queryRaw`...` `` transmet les valeurs comme paramètres : pas d'injection possible.
    const [meilleure] = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT f.id
      FROM fiche f
      LEFT JOIN aimer a ON a.fiche_id = f.id AND a.aime_le > now() - interval '7 days'
      WHERE f.statut = 'PUBLIEE'
      GROUP BY f.id
      ORDER BY count(a.fiche_id) DESC, f.publiee_le DESC
      LIMIT 1`;
    if (!meilleure) {
      return null;
    }
    const fiche = await this.prisma.fiche.findUnique({
      where: { id: meilleure.id },
      include: AVEC_AUTEUR_ET_AIMES,
    });
    return fiche && versResume(fiche);
  }

  // Les fiches de la personne connectée, brouillons compris.
  async miennes(utilisateur: UtilisateurJwt): Promise<FicheResume[]> {
    const fiches = await this.prisma.fiche.findMany({
      where: { auteur_id: utilisateur.sub },
      include: AVEC_AUTEUR_ET_AIMES,
      orderBy: { modifie_le: 'desc' },
    });
    return fiches.map(versResume);
  }

  async detail(id: string, utilisateur: UtilisateurJwt): Promise<FicheDetail> {
    const fiche = await this.prisma.fiche.findUnique({ where: { id }, include: DETAIL });
    const estAuteur = fiche?.auteur_id === utilisateur.sub;
    // Un brouillon ou une fiche masquée n'existe que pour son auteur : pour les autres, 404,
    // sans révéler qu'une fiche porte cet identifiant.
    if (!fiche || (fiche.statut !== 'PUBLIEE' && !estAuteur)) {
      throw new NotFoundException('Fiche introuvable');
    }
    return versDetail(fiche, estAuteur);
  }

  async creer(dto: CreerFicheDto, utilisateur: UtilisateurJwt): Promise<FicheDetail> {
    const fiche = await this.prisma.fiche.create({
      data: {
        auteur_id: utilisateur.sub,
        titre: dto.titre,
        type: dto.type,
        // RG-21 : le nom personnalisé n'est gardé que pour le type « Autre ».
        type_personnalise: dto.type === 'AUTRE' ? dto.typePersonnalise : null,
        age_min: dto.ageMin,
        age_max: dto.ageMax,
        duree_minutes: dto.dureeMinutes,
        nb_participants_min: dto.nbParticipantsMin,
        nb_participants_max: dto.nbParticipantsMax,
        objectifs: dto.objectifs,
        materiel: dto.materiel,
        deroulement: dto.deroulement,
        // RG-08 : publier = statut PUBLIEE et date de publication. Le trigger xp_fiche_publiee
        // donne alors 50 XP à l'auteur.
        statut: dto.publier ? 'PUBLIEE' : 'BROUILLON',
        publiee_le: dto.publier ? new Date() : null,
      },
      include: DETAIL,
    });
    return versDetail(fiche, true);
  }

  async modifier(
    id: string,
    dto: ModifierFicheDto,
    utilisateur: UtilisateurJwt,
  ): Promise<FicheDetail> {
    const fiche = await this.ficheDeLAuteur(id, utilisateur);

    // Les âges et les participants se comparent entre eux : on vérifie le résultat final,
    // en complétant ce qui est envoyé par ce qui est déjà enregistré.
    const ageMin = dto.ageMin ?? fiche.age_min;
    const ageMax = dto.ageMax ?? fiche.age_max;
    // undefined = champ non envoyé (on garde la valeur en base) ; null = limite retirée.
    const participantsMin =
      dto.nbParticipantsMin === undefined ? fiche.nb_participants_min : dto.nbParticipantsMin;
    const participantsMax =
      dto.nbParticipantsMax === undefined ? fiche.nb_participants_max : dto.nbParticipantsMax;
    if (
      ageMin > ageMax ||
      (participantsMin && participantsMax && participantsMin > participantsMax)
    ) {
      throw new BadRequestException('Les minimums doivent être inférieurs ou égaux aux maximums');
    }
    // Même principe pour le type : « Autre » demande un nom, les autres types n'en gardent pas.
    const type: TypeFiche = dto.type ?? fiche.type;
    const nomDuType =
      dto.typePersonnalise === undefined ? fiche.type_personnalise : dto.typePersonnalise;
    if (type === 'AUTRE' && !nomDuType) {
      throw new BadRequestException('Donne un nom à ton type d’activité');
    }

    // Une fiche publiée ne redevient pas brouillon, et une fiche masquée par la modération le reste.
    const publication =
      dto.publier && fiche.statut === 'BROUILLON'
        ? { statut: 'PUBLIEE' as const, publiee_le: new Date() }
        : {};

    const modifiee = await this.prisma.fiche.update({
      where: { id },
      data: {
        ...versColonnes(dto),
        type_personnalise: type === 'AUTRE' ? nomDuType : null,
        ...publication,
      },
      include: DETAIL,
    });
    return versDetail(modifiee, true);
  }

  async supprimer(id: string, utilisateur: UtilisateurJwt) {
    const fiche = await this.prisma.fiche.findUnique({ where: { id } });
    if (!fiche) {
      throw new NotFoundException('Fiche introuvable');
    }
    // RG-06 : l'auteur supprime sa fiche ; un administrateur peut aussi le faire (modération).
    if (fiche.auteur_id !== utilisateur.sub && utilisateur.role !== 'ADMIN') {
      throw new ForbiddenException('Tu ne peux supprimer que tes propres fiches');
    }
    const photos = await this.prisma.photo_fiche.findMany({ where: { fiche_id: id } });
    // La base supprime les lignes des photos avec la fiche (ON DELETE CASCADE) ;
    // les fichiers, eux, sont effacés du disque ici.
    await this.prisma.fiche.delete({ where: { id } });
    const urls = [fiche.image_url, ...photos.map((photo) => photo.url)];
    await Promise.all(urls.map((url) => this.images.supprimer(url)));
  }

  // Photo de couverture : remplace l'ancienne, qui est effacée du disque.
  async changerCouverture(id: string, contenu: Buffer, utilisateur: UtilisateurJwt) {
    const fiche = await this.ficheDeLAuteur(id, utilisateur);
    const url = await this.images.enregistrer(contenu);
    const modifiee = await this.prisma.fiche.update({
      where: { id },
      data: { image_url: url },
      include: DETAIL,
    });
    await this.images.supprimer(fiche.image_url);
    return versDetail(modifiee, true);
  }

  async retirerCouverture(id: string, utilisateur: UtilisateurJwt) {
    const fiche = await this.ficheDeLAuteur(id, utilisateur);
    const modifiee = await this.prisma.fiche.update({
      where: { id },
      data: { image_url: null },
      include: DETAIL,
    });
    await this.images.supprimer(fiche.image_url);
    return versDetail(modifiee, true);
  }

  async ajouterPhoto(
    id: string,
    contenu: Buffer,
    utilisateur: UtilisateurJwt,
  ): Promise<PhotoFiche> {
    await this.ficheDeLAuteur(id, utilisateur);
    // RG-22 : 10 photos au plus par galerie.
    const nombre = await this.prisma.photo_fiche.count({ where: { fiche_id: id } });
    if (nombre >= PHOTOS_PAR_FICHE) {
      throw new BadRequestException(`La galerie est pleine : ${PHOTOS_PAR_FICHE} photos maximum`);
    }
    const url = await this.images.enregistrer(contenu);
    return this.prisma.photo_fiche.create({
      data: { fiche_id: id, url },
      select: { id: true, url: true },
    });
  }

  async retirerPhoto(id: string, photoId: string, utilisateur: UtilisateurJwt) {
    await this.ficheDeLAuteur(id, utilisateur);
    // La photo doit appartenir à cette fiche : on ne supprime pas la photo d'une autre fiche.
    const photo = await this.prisma.photo_fiche.findFirst({ where: { id: photoId, fiche_id: id } });
    if (!photo) {
      throw new NotFoundException('Photo introuvable');
    }
    await this.prisma.photo_fiche.delete({ where: { id: photoId } });
    await this.images.supprimer(photo.url);
  }

  private async ficheDeLAuteur(id: string, utilisateur: UtilisateurJwt) {
    const fiche = await this.prisma.fiche.findUnique({ where: { id } });
    if (!fiche) {
      throw new NotFoundException('Fiche introuvable');
    }
    // RG-06 : seul l'auteur modifie sa fiche.
    if (fiche.auteur_id !== utilisateur.sub) {
      throw new ForbiddenException('Tu ne peux modifier que tes propres fiches');
    }
    return fiche;
  }
}

// Pour une modification : passage des noms de l'app (camelCase) aux noms des colonnes (snake_case).
// Un champ absent du DTO reste undefined : Prisma ne touche pas à cette colonne.
function versColonnes(dto: ModifierFicheDto) {
  return {
    titre: dto.titre,
    type: dto.type,
    age_min: dto.ageMin,
    age_max: dto.ageMax,
    duree_minutes: dto.dureeMinutes,
    nb_participants_min: dto.nbParticipantsMin,
    nb_participants_max: dto.nbParticipantsMax,
    objectifs: dto.objectifs,
    materiel: dto.materiel,
    deroulement: dto.deroulement,
  };
}

function versResume(fiche: FicheLue): FicheResume {
  return {
    id: fiche.id,
    titre: fiche.titre,
    type: fiche.type,
    typePersonnalise: fiche.type_personnalise,
    ageMin: fiche.age_min,
    ageMax: fiche.age_max,
    dureeMinutes: fiche.duree_minutes,
    statut: fiche.statut,
    publieeLe: fiche.publiee_le?.toISOString() ?? null,
    auteur: fiche.utilisateur.pseudo,
    aimes: fiche._count.aimer,
    imageUrl: fiche.image_url,
  };
}

function versDetail(fiche: FicheDetaillee, estAuteur: boolean): FicheDetail {
  return {
    ...versResume(fiche),
    nbParticipantsMin: fiche.nb_participants_min,
    nbParticipantsMax: fiche.nb_participants_max,
    objectifs: fiche.objectifs,
    materiel: fiche.materiel,
    deroulement: fiche.deroulement,
    photos: fiche.photo_fiche,
    estAuteur,
  };
}
