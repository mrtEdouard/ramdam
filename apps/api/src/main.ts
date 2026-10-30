import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Le navigateur bloque les appels vers une autre origine sans autorisation (CORS).
  // L'app mobile native n'est pas concernée ; la liste sert à la version web d'Expo.
  app.enableCors({ origin: (process.env.CORS_ORIGINES ?? 'http://localhost:8081').split(',') });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
