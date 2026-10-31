import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FichesController } from './fiches.controller.js';
import { FichesService } from './fiches.service.js';

@Module({
  imports: [AuthModule],
  controllers: [FichesController],
  providers: [FichesService],
})
export class FichesModule {}
