import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConnexionDto, InscriptionDto, Session } from '@ramdam/shared';
import * as argon2 from 'argon2';
import { Prisma, type utilisateur } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async inscrire(dto: InscriptionDto) {
    // Argon2id : le mot de passe n'est jamais stocké, seulement son empreinte.
    const motDePasseHash = await argon2.hash(dto.motDePasse);

    try {
      const utilisateur = await this.prisma.utilisateur.create({
        data: {
          email: dto.email,
          pseudo: dto.pseudo,
          mot_de_passe_hash: motDePasseHash,
          role: dto.role,
          cgu_acceptees_le: new Date(),
        },
      });
      return this.creerSession(utilisateur);
    } catch (erreur) {
      // P2002 : la base a refusé un doublon sur une colonne UNIQUE (email ou pseudo).
      if (erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === 'P2002') {
        throw new ConflictException('Cet e-mail ou ce pseudo est déjà utilisé');
      }
      throw erreur;
    }
  }

  async connecter(dto: ConnexionDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { email: dto.email } });

    // Même message si l'e-mail n'existe pas ou si le mot de passe est faux :
    // on ne donne pas d'indice à quelqu'un qui teste des comptes.
    const motDePasseValide =
      utilisateur !== null &&
      (await this.verifierMotDePasse(utilisateur.mot_de_passe_hash, dto.motDePasse));
    if (!utilisateur || !motDePasseValide) {
      throw new UnauthorizedException('E-mail ou mot de passe incorrect');
    }

    if (utilisateur.statut === 'SUSPENDU') {
      throw new ForbiddenException('Ce compte est suspendu');
    }

    return this.creerSession(utilisateur);
  }

  private async verifierMotDePasse(hash: string, motDePasse: string) {
    try {
      return await argon2.verify(hash, motDePasse);
    } catch {
      // argon2 lève une erreur si l'empreinte stockée n'est pas au bon format.
      return false;
    }
  }

  private async creerSession(utilisateur: utilisateur): Promise<Session> {
    // sub (subject) est le nom standard de l'identifiant dans un JWT.
    const jeton = await this.jwt.signAsync({ sub: utilisateur.id, role: utilisateur.role });
    // On choisit les champs renvoyés : l'empreinte du mot de passe ne sort jamais de l'API.
    return {
      jeton,
      utilisateur: {
        id: utilisateur.id,
        pseudo: utilisateur.pseudo,
        role: utilisateur.role,
        xp: utilisateur.xp,
      },
    };
  }
}
