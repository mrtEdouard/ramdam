import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// @Global : les autres modules peuvent injecter PrismaService sans importer ce module.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
