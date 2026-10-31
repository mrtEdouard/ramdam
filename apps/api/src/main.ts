import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { PREFIXE_IMAGES, StockageImages } from './images/stockage-images.service.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
