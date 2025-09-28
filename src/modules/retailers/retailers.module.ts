import { Module } from '@nestjs/common';
import { RetailersService } from './retailers.service';
import { RetailersController } from './retailers.controller';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
  ],
  providers: [RetailersService],
  controllers: [RetailersController],
  exports: [RetailersService],
})
export class RetailersModule {}