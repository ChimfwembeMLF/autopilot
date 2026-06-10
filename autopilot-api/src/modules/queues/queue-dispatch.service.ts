import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUE_AI,
  QUEUE_COMMENTS,
  QUEUE_CONTENT_PUBLISH,
  QUEUE_EMAIL,
  QUEUE_WEBHOOKS,
  JOB_AI_TASK,
  JOB_AUTO_PUBLISH_SCAN,
  JOB_LEAD_WEBHOOK,
  JOB_PUBLISH_CONTENT,
  JOB_SEND_EMAIL,
  JOB_SYNC_ALL_COMMENTS,
  JOB_SYNC_TENANT_COMMENTS,
  JOB_WHATSAPP_INBOUND,
  AiTaskJobData,
  LeadWebhookJobData,
  PublishContentJobData,
  SendEmailJobData,
  SyncTenantCommentsJobData,
  WhatsappInboundJobData,
} from './queue.constants';

@Injectable()
export class QueueDispatchService {
  private readonly logger = new Logger(QueueDispatchService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_CONTENT_PUBLISH) private readonly publishQueue: Queue,
    @InjectQueue(QUEUE_COMMENTS) private readonly commentsQueue: Queue,
    @InjectQueue(QUEUE_WEBHOOKS) private readonly webhooksQueue: Queue,
    @InjectQueue(QUEUE_AI) private readonly aiQueue: Queue,
    @InjectQueue(QUEUE_EMAIL) private readonly emailQueue: Queue,
  ) {}

  isEnabled(): boolean {
    return this.config.get<string>('QUEUES_ENABLED') !== 'false';
  }

  async enqueuePublish(data: PublishContentJobData) {
    const job = await this.publishQueue.add(JOB_PUBLISH_CONTENT, data, {
      jobId: `publish-${data.contentId}-${Date.now()}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
    return { jobId: job.id, queue: QUEUE_CONTENT_PUBLISH };
  }

  async enqueueAutoPublishScan() {
    const job = await this.publishQueue.add(
      JOB_AUTO_PUBLISH_SCAN,
      {},
      {
        jobId: `auto-publish-scan-${Math.floor(Date.now() / 60000)}`,
        attempts: 2,
        removeOnComplete: 20,
      },
    );
    return { jobId: job.id, queue: QUEUE_CONTENT_PUBLISH };
  }

  async enqueueSyncTenantComments(data: SyncTenantCommentsJobData) {
    const job = await this.commentsQueue.add(JOB_SYNC_TENANT_COMMENTS, data, {
      jobId: `comments-${data.tenantId}-${Math.floor(Date.now() / 60000)}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 50,
    });
    return { jobId: job.id, queue: QUEUE_COMMENTS };
  }

  async enqueueSyncAllComments() {
    const job = await this.commentsQueue.add(
      JOB_SYNC_ALL_COMMENTS,
      {},
      {
        jobId: `comments-all-${Math.floor(Date.now() / 60000)}`,
        attempts: 2,
        removeOnComplete: 20,
      },
    );
    return { jobId: job.id, queue: QUEUE_COMMENTS };
  }

  async enqueueWhatsappInbound(data: WhatsappInboundJobData) {
    const job = await this.webhooksQueue.add(JOB_WHATSAPP_INBOUND, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 200,
      removeOnFail: 500,
    });
    return { jobId: job.id, queue: QUEUE_WEBHOOKS };
  }

  async enqueueLeadWebhook(data: LeadWebhookJobData) {
    const job = await this.webhooksQueue.add(JOB_LEAD_WEBHOOK, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
    });
    return { jobId: job.id, queue: QUEUE_WEBHOOKS };
  }

  async enqueueEmail(data: SendEmailJobData) {
    const job = await this.emailQueue.add(JOB_SEND_EMAIL, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 100,
    });
    return { jobId: job.id, queue: QUEUE_EMAIL };
  }

  async enqueueAiTask(data: AiTaskJobData) {
    const job = await this.aiQueue.add(JOB_AI_TASK, data, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 4000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
    return { jobId: job.id, queue: QUEUE_AI };
  }

  async getJobStatus(queueName: string, jobId: string) {
    const queue = this.queueByName(queueName);
    if (!queue) return null;
    const job = await queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    return {
      id: job.id,
      queue: queueName,
      name: job.name,
      state,
      progress: job.progress,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
    };
  }

  private queueByName(name: string): Queue | null {
    switch (name) {
      case QUEUE_CONTENT_PUBLISH:
        return this.publishQueue;
      case QUEUE_COMMENTS:
        return this.commentsQueue;
      case QUEUE_WEBHOOKS:
        return this.webhooksQueue;
      case QUEUE_AI:
        return this.aiQueue;
      case QUEUE_EMAIL:
        return this.emailQueue;
      default:
        return null;
    }
  }
}
