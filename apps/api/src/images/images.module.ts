import { Global, Module } from '@nestjs/common';
import { StockageImages } from './stockage-images.service.js';

@Global()
@Module({
  providers: [StockageImages],
  exports: [StockageImages],
})
export class ImagesModule {}
