import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ContentItemsModule } from '../content_items/content_items.module';
import { PaymentsModule } from '../payments/payments.module';
import { AutoPublishCron, DailyContentWorkflowCron, PaymentsCron } from './content-jobs.cron';

@Module({
  imports: [ScheduleModule.forRoot(), ContentItemsModule, PaymentsModule],
  providers: [AutoPublishCron, DailyContentWorkflowCron, PaymentsCron],
})
export class JobsModule {}
