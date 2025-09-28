import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PriceEngineService } from './price-engine.service';
import { PriceEngineController } from './price-engine.controller';
import { AmazonApiService } from './services/amazon-api.service';
import { WalmartApiService } from './services/walmart-api.service';
import { EbayApiService } from './services/ebay-api.service';
import { BestBuyApiService } from './services/bestbuy-api.service';
import { ZalandoApiService } from './services/zalando-api.service';
import { FarfetchApiService } from './services/farfetch-api.service';
import { ScrapingService } from './services/scraping.service';
import { ApifyService } from './services/apify.service';
import { PlaywrightService } from './services/playwright.service';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CacheModule,
  ],
  providers: [
    PriceEngineService,
    AmazonApiService,
    WalmartApiService,
    EbayApiService,
    BestBuyApiService,
    ZalandoApiService,
    FarfetchApiService,
    ScrapingService,
    ApifyService,
    PlaywrightService,
  ],
  controllers: [PriceEngineController],
  exports: [PriceEngineService],
})
export class PriceEngineModule {}