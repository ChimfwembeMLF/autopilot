import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { TenantSubscriptions } from './entities/tenant_subscriptions.entity';
import { AiUsage } from '../ai_usage/entities/ai_usage.entity';
import {
  PlanKey,
  normalizePlanKey,
} from './plan.constants';
import { PlansService } from './plans.service';

export interface SubscriptionSummary {
  tenantId: string;
  plan: PlanKey;
  status: string;
  dailyWorkflowEnabled: boolean;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  aiCallsLimit: number | null;
  aiCallsUsed: number;
  aiCallsRemaining: number | null;
  seatLimit: number | null;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(TenantSubscriptions)
    private readonly subRepo: Repository<TenantSubscriptions>,
    @InjectRepository(AiUsage)
    private readonly usageRepo: Repository<AiUsage>,
    private readonly plans: PlansService,
  ) {}

  private periodBounds(): { start: Date; end: Date } {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return { start, end };
  }

  async ensureForTenant(tenantId: string, plan: PlanKey = 'free'): Promise<TenantSubscriptions> {
    let sub = await this.subRepo.findOne({ where: { tenantId } });
    if (sub) return sub;

    const { start, end } = this.periodBounds();
    const cfg = this.plans.getPlan(plan);
    sub = await this.subRepo.save(
      this.subRepo.create({
        tenantId,
        plan,
        status: 'active',
        dailyWorkflowEnabled: cfg.dailyWorkflowEnabled,
        billingPeriodStart: start,
        billingPeriodEnd: end,
      }),
    );
    return sub;
  }

  async getSummary(tenantId: string): Promise<SubscriptionSummary> {
    const sub = await this.ensureForTenant(tenantId);
    const plan = normalizePlanKey(sub.plan);
    const cfg = this.plans.getPlan(plan);
    const used = await this.countAiCalls(tenantId, sub.billingPeriodStart, sub.billingPeriodEnd);
    const limit = cfg.aiCallsLimit;
    return {
      tenantId,
      plan,
      status: sub.status,
      dailyWorkflowEnabled: sub.dailyWorkflowEnabled && sub.status === 'active',
      billingPeriodStart: sub.billingPeriodStart.toISOString(),
      billingPeriodEnd: sub.billingPeriodEnd.toISOString(),
      aiCallsLimit: limit,
      aiCallsUsed: used,
      aiCallsRemaining: limit === null ? null : Math.max(0, limit - used),
      seatLimit: cfg.seatLimit,
    };
  }

  async countAiCalls(tenantId: string, from: Date, to: Date): Promise<number> {
    return this.usageRepo.count({
      where: {
        tenantId,
        created_at: Between(from, to),
      },
    });
  }

  async canUseAi(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const sub = await this.ensureForTenant(tenantId);
    if (sub.status !== 'active') {
      return { allowed: false, reason: 'Subscription is not active. Please renew your plan.' };
    }
    const plan = normalizePlanKey(sub.plan);
    const limit = this.plans.getPlan(plan).aiCallsLimit;
    if (limit === null) return { allowed: true };
    const used = await this.countAiCalls(tenantId, sub.billingPeriodStart, sub.billingPeriodEnd);
    if (used >= limit) {
      return {
        allowed: false,
        reason: `AI usage limit reached (${used}/${limit} calls this billing period). Upgrade your plan.`,
      };
    }
    return { allowed: true };
  }

  async assertCanUseAi(tenantId: string): Promise<void> {
    const check = await this.canUseAi(tenantId);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason ?? 'AI usage not allowed');
    }
  }

  async canRunDailyWorkflow(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const sub = await this.ensureForTenant(tenantId);
    if (sub.status !== 'active') {
      return { allowed: false, reason: 'Subscription is not active' };
    }
    if (!sub.dailyWorkflowEnabled) {
      return {
        allowed: false,
        reason: 'Daily auto-generate requires Starter or Pro. Upgrade on the Billing page.',
      };
    }
    return this.canUseAi(tenantId);
  }

  async assertCanRunDailyWorkflow(tenantId: string): Promise<void> {
    const check = await this.canRunDailyWorkflow(tenantId);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason ?? 'Daily workflow not allowed');
    }
  }

  async activatePlan(tenantId: string, planKey: PlanKey): Promise<TenantSubscriptions> {
    const plan = normalizePlanKey(planKey);
    if (plan === 'free') {
      throw new ForbiddenException('Cannot activate free plan via payment');
    }
    const cfg = this.plans.getPlan(plan);
    const { start, end } = this.periodBounds();
    await this.ensureForTenant(tenantId);
    return this.subRepo.save({
      tenantId,
      plan,
      status: 'active',
      dailyWorkflowEnabled: cfg.dailyWorkflowEnabled,
      billingPeriodStart: start,
      billingPeriodEnd: end,
    });
  }

  async findEligibleForDailyCron(): Promise<string[]> {
    const subs = await this.subRepo.find({
      where: { status: 'active', dailyWorkflowEnabled: true },
    });
    const eligible: string[] = [];
    for (const sub of subs) {
      const check = await this.canUseAi(sub.tenantId);
      if (check.allowed) eligible.push(sub.tenantId);
    }
    return eligible;
  }
}
