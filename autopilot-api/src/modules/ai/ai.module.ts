import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUsageModule } from '../ai_usage/ai_usage.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BrandProfiles } from '../brand_profiles/entities/brand_profiles.entity';
import { AiController } from './ai.controller';
import { MistralChatService } from './services/mistral-chat.service';
import { MistralAgentsService } from './services/mistral-agents.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { AiUsageTrackerService } from './services/ai-usage-tracker.service';
import { FormSuggestionsService } from './services/form-suggestions.service';

import { StorageModule } from '../media/storage.module';

@Module({
  imports: [
    AiUsageModule,
    SubscriptionsModule,
    StorageModule,
    TypeOrmModule.forFeature([BrandProfiles]),
  ],
  controllers: [AiController],
  providers: [
    MistralChatService,
    MistralAgentsService,
    PromptBuilderService,
    AiUsageTrackerService,
    FormSuggestionsService,
  ],
  exports: [
    MistralChatService,
    MistralAgentsService,
    PromptBuilderService,
    AiUsageTrackerService,
    FormSuggestionsService,
  ],
})
export class AiModule {}
