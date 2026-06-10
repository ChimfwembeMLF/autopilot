import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutoPublishService } from '../content_items/services/auto-publish.service';
import { DailyContentWorkflowService } from '../content_items/services/daily-content-workflow.service';
import { PaymentsService } from '../payments/payments.service';
import { QueueDispatchService } from '../queues/queue-dispatch.service';
import { FetchCommentsService } from '../content-publishing/social-comments.service';

@Injectable()
export class CommentSyncCron {
  private readonly logger = new Logger(CommentSyncCron.name);

  constructor(
    private readonly queueDispatch: QueueDispatchService,
    private readonly fetchComments: FetchCommentsService,
    private readonly config: ConfigService,
  ) {}

  /** Every 10 minutes — enqueue comment sync for all tenants. */
  @Cron('0 */10 * * * *')
  async syncComments(): Promise<void> {
    if (this.config.get<string>('COMMENT_SYNC_CRON_ENABLED') === 'false') return;
    try {
      if (this.queueDispatch.isEnabled()) {
        const { jobId } = await this.queueDispatch.enqueueSyncAllComments();
        this.logger.log(`Comment sync enqueued (job ${jobId})`);
        return;
      }
      const result = await this.fetchComments.fetchAllTenants();
      if (result.fetched > 0 || result.autoReplied > 0) {
        this.logger.log(
          `Comment sync: ${result.fetched} new, ${result.autoReplied} auto-replied across ${result.tenants} tenant(s)`,
        );
      }
    } catch (err) {
      this.logger.error('Comment sync cron error', err);
    }
  }
}

@Injectable()
export class AutoPublishCron {
  private readonly logger = new Logger(AutoPublishCron.name);

  constructor(
    private readonly autoPublish: AutoPublishService,
    private readonly queueDispatch: QueueDispatchService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoPublish(): Promise<void> {
    if (this.config.get<string>('AUTO_PUBLISH_CRON_ENABLED') === 'false') return;
    try {
      if (this.queueDispatch.isEnabled()) {
        const { jobId } = await this.queueDispatch.enqueueAutoPublishScan();
        this.logger.log(`Auto-publish scan enqueued (job ${jobId})`);
        return;
      }
      const result = await this.autoPublish.publishDueItems();
      if (result.attempted > 0) {
        this.logger.log(
          `Auto-publish complete: ${result.published}/${result.attempted} published, ${result.failed} failed`,
        );
      }
    } catch (err) {
      this.logger.error('Auto-publish cron error', err);
    }
  }
}

@Injectable()
export class DailyContentWorkflowCron {
  private readonly logger = new Logger(DailyContentWorkflowCron.name);

  constructor(
    private readonly dailyWorkflow: DailyContentWorkflowService,
    private readonly queueDispatch: QueueDispatchService,
    private readonly config: ConfigService,
  ) {}

  @Cron('0 8 * * *')
  async handleDailyWorkflow(): Promise<void> {
    if (this.config.get<string>('DAILY_WORKFLOW_CRON_ENABLED') === 'false') return;
    try {
      if (this.queueDispatch.isEnabled()) {
        const { jobId } = await this.queueDispatch.enqueueAiTask({
          type: 'daily-workflow',
          userId: 'system',
          payload: {},
        });
        this.logger.log(`Daily workflow enqueued (job ${jobId})`);
        return;
      }
      const result = await this.dailyWorkflow.run({});
      this.logger.log(
        `Daily content workflow: ${result.generated} generated, ${result.skipped} skipped, ${result.errors.length} messages`,
      );
    } catch (err) {
      this.logger.error('Daily workflow cron error', err);
    }
  }
}

@Injectable()
export class PaymentsCron {
  private readonly logger = new Logger(PaymentsCron.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkDeposits(): Promise<void> {
    if (
      this.config.get<string>('PAYMENTS_DEV_AUTO_COMPLETE') !== 'true' &&
      this.config.get<string>('PAWAPAY_DEV_AUTO_COMPLETE') !== 'true'
    ) return;
    const result = await this.payments.checkPendingDeposits();
    if (result.completed > 0) {
      this.logger.log(`Auto-completed ${result.completed} pending deposit(s)`);
    }
  }
}
