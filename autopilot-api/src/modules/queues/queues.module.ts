import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ALL_QUEUES,
} from './queue.constants';
import { QueueDispatchService } from './queue-dispatch.service';
import { QueueJobsController } from './queue-jobs.controller';
import { ContentPublishProcessor } from './processors/content-publish.processor';
import { CommentsProcessor } from './processors/comments.processor';
import { WebhooksProcessor } from './processors/webhooks.processor';
import { EmailProcessor } from './processors/email.processor';
import { AiProcessor } from './processors/ai.processor';
import { ContentItemsModule } from '../content_items/content_items.module';
import { ContentPublishingModule } from '../content-publishing/content-publishing.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { LeadsModule } from '../leads/leads.module';
import { LeadSourcesModule } from '../lead_sources/lead_sources.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: Number(config.get<string>('REDIS_PORT') ?? 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    BullModule.registerQueue(
      ...ALL_QUEUES.map((name) => ({ name })),
    ),
    forwardRef(() => ContentItemsModule),
    forwardRef(() => ContentPublishingModule),
    forwardRef(() => WhatsappModule),
    forwardRef(() => LeadsModule),
    LeadSourcesModule,
  ],
  controllers: [QueueJobsController],
  providers: [
    QueueDispatchService,
    ContentPublishProcessor,
    CommentsProcessor,
    WebhooksProcessor,
    EmailProcessor,
    AiProcessor,
  ],
  exports: [QueueDispatchService, BullModule],
})
export class QueuesModule {}
