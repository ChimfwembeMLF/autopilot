import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantSubscriptions } from './entities/tenant_subscriptions.entity';
import { AiUsage } from '../ai_usage/entities/ai_usage.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
@Module({
  imports: [TypeOrmModule.forFeature([TenantSubscriptions, AiUsage])],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
