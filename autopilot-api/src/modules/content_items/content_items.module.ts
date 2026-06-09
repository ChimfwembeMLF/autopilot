import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentItems } from './entities/content_items.entity';
import { MediaAssets } from './entities/media_assets.entity';
import { ContentItemsService } from './content_items.service';
import { ContentItemsController } from './content_items.controller';
import { ContentAiController } from './content-ai.controller';
import { AiModule } from '../ai/ai.module';
import { BrandProfiles } from '../brand_profiles/entities/brand_profiles.entity';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { Tenants } from '../tenants/entities/tenants.entity';
import { GenerateContentService } from './services/generate-content.service';
import { RepurposeContentService } from './services/repurpose-content.service';
import { AdaptPlatformsService } from './services/adapt-platforms.service';
import { GenerateImageService } from './services/generate-image.service';
import { PublishContentService } from './services/publish-content.service';
import { AutoPublishService } from './services/auto-publish.service';
import { DailyContentWorkflowService } from './services/daily-content-workflow.service';
import { ContentPublishingModule } from '../content-publishing/content-publishing.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BrandProfilesModule } from '../brand_profiles/brand_profiles.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentItems, MediaAssets, BrandProfiles, Workspaces, Tenants]),
    AiModule,
    ContentPublishingModule,
    SubscriptionsModule,
    BrandProfilesModule,
    MediaModule,
  ],
  providers: [
    ContentItemsService,
    GenerateContentService,
    RepurposeContentService,
    AdaptPlatformsService,
    GenerateImageService,
    PublishContentService,
    AutoPublishService,
    DailyContentWorkflowService,
  ],
  controllers: [ContentItemsController, ContentAiController],
  exports: [
    ContentItemsService,
    PublishContentService,
    GenerateContentService,
    AutoPublishService,
    DailyContentWorkflowService,
  ],
})
export class ContentItemsModule {}
