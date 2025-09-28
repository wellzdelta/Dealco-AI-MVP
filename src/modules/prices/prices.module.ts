import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../common/cache/cache.module';
import { PriceEngineModule } from '../price-engine/price-engine.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    PriceEngineModule,
  ],
  providers: [PricesService],
  controllers: [PricesController],
  exports: [PricesService],
})
export class PricesModule {}