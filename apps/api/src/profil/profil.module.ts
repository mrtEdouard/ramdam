import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProfilController } from './profil.controller.js';
import { ProfilService } from './profil.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ProfilController],
  providers: [ProfilService],
})
export class ProfilModule {}
