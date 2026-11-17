import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ModerationController, SignalementsController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SignalementsController, ModerationController],
  providers: [ModerationService],
})
export class ModerationModule {}
