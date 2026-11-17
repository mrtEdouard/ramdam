import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { OffresController } from './offres.controller.js';
import { OffresService } from './offres.service.js';

@Module({
  imports: [AuthModule],
  controllers: [OffresController],
  providers: [OffresService],
})
export class OffresModule {}
