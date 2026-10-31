import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: Number(config.getOrThrow<string>('JWT_DUREE_SECONDES')) },
      }),
    }),
    // 5 requêtes par minute et par IP sur les routes d'authentification.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  // Les autres modules qui importent AuthModule peuvent protéger leurs routes avec JwtAuthGuard.
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
