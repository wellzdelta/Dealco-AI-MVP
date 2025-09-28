import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../common/cache/cache.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    SearchModule,
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}