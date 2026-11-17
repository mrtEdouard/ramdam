import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { PREFIXE_IMAGES, StockageImages } from './images/stockage-images.service.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // En production, nginx transmet les requêtes depuis 127.0.0.1 : sans ce réglage, l'API croirait
  // que tout le monde a la même adresse et la limite de tentatives de connexion bloquerait tout
  // le monde à la fois. On fait confiance à l'en-tête X-Forwarded-For posé par le proxy local.
  app.set('trust proxy', 'loopback');
  // Le navigateur bloque les appels vers une autre origine sans autorisation (CORS).
  // L'app mobile native n'est pas concernée ; la liste sert à la version web d'Expo.
  app.enableCors({ origin: (process.env.CORS_ORIGINES ?? 'http://localhost:8081').split(',') });
  // Les photos sont servies telles quelles. Leur nom aléatoire ne change jamais :
  // le navigateur peut les garder en cache un an sans redemander.
  app.useStaticAssets(app.get(StockageImages).dossier, {
    prefix: PREFIXE_IMAGES,
    maxAge: '365d',
    immutable: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
