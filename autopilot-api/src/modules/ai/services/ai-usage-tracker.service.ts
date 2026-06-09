import { Injectable, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { AiUsageService } from '../../ai_usage/ai_usage.service';

@Injectable()
export class AiUsageTrackerService {
  constructor(
    private readonly aiUsage: AiUsageService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async record(params: {
    tenantId: string;
    userId: string;
    functionName: string;
    tokensUsed: number;
  }): Promise<void> {
    if (!params.tenantId || !params.userId) return;
    await this.aiUsage.create({
      tenantId: params.tenantId,
      userId: params.userId,
      functionName: params.functionName,
      tokensUsed: String(Math.max(0, params.tokensUsed)),
    });
  }

  async assertWithinLimit(tenantId: string, _userId: string): Promise<void> {
    await this.subscriptions.assertCanUseAi(tenantId);
  }
}
