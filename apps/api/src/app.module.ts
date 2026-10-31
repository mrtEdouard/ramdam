import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfilModule } from './profil/profil.module.js';

@Module({
  imports: [
    // Le .env est à la racine du monorepo, partagé avec Docker Compose.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    PrismaModule,
    AuthModule,
    ProfilModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
