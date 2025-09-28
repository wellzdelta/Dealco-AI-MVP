import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiNormalizationService } from './ai-normalization.service';
import { AiNormalizationController } from './ai-normalization.controller';
import { ClaudeService } from './services/claude.service';
import { OpenAIService } from './services/openai.service';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../common/cache/cache.module';
import { QueueModule } from '../../common/queue/queue.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CacheModule,
    forwardRef(() => QueueModule),
  ],
  providers: [
    AiNormalizationService,
    ClaudeService,
    OpenAIService,
  ],
  controllers: [AiNormalizationController],
  exports: [AiNormalizationService],
})
export class AiNormalizationModule {}