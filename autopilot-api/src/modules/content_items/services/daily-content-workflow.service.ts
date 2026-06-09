import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandProfiles } from '../../brand_profiles/entities/brand_profiles.entity';
import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import { Tenants } from '../../tenants/entities/tenants.entity';
import { GenerateContentService } from './generate-content.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

@Injectable()
export class DailyContentWorkflowService {
  private readonly logger = new Logger(DailyContentWorkflowService.name);

  constructor(
    private readonly generateContent: GenerateContentService,
    private readonly subscriptions: SubscriptionsService,
    @InjectRepository(BrandProfiles)
    private readonly brandRepo: Repository<BrandProfiles>,
    @InjectRepository(Workspaces)
    private readonly workspaceRepo: Repository<Workspaces>,
    @InjectRepository(Tenants)
    private readonly tenantRepo: Repository<Tenants>,
  ) {}

  async run(params: {
    tenantId?: string;
    userId?: string;
  }): Promise<{ generated: number; skipped: number; errors: string[] }> {
    const targets = await this.resolveTargets(params);
    let generated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    for (const target of targets) {
      try {
        const workflowCheck = await this.subscriptions.canRunDailyWorkflow(target.tenantId);
        if (!workflowCheck.allowed) {
          skipped++;
          errors.push(`${target.tenantId}: ${workflowCheck.reason}`);
          continue;
        }

        const brand = await this.brandRepo.findOne({
          where: { tenantId: target.tenantId, userId: target.userId },
        });
        if (!brand?.companyName && !brand?.description) {
          skipped++;
          errors.push(`${target.tenantId}: brand profile incomplete — set up Brand Brain first`);
          continue;
        }

        const workspace = await this.workspaceRepo.findOne({
          where: { tenantId: target.tenantId },
        });
        if (!workspace) {
          skipped++;
          errors.push(`${target.tenantId}: no workspace found`);
          continue;
        }

        const theme = [
          `${weekday} social post for ${brand.companyName || 'your brand'}`,
          brand.keywords ? `Keywords: ${brand.keywords}` : '',
          brand.currentOffers ? `Promote: ${brand.currentOffers}` : '',
          brand.targetAudience ? `Audience: ${brand.targetAudience}` : '',
        ]
          .filter(Boolean)
          .join('. ');

        await this.generateContent.generate({
          userId: target.userId,
          tenantId: target.tenantId,
          workspaceId: workspace.id,
          theme,
          save: true,
        });

        generated++;
        this.logger.log(`Daily workflow generated content for tenant ${target.tenantId}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${target.tenantId}: ${msg}`);
        this.logger.warn(`Daily workflow failed for ${target.tenantId}: ${msg}`);
      }
    }

    return { generated, skipped, errors };
  }

  private async resolveTargets(params: {
    tenantId?: string;
    userId?: string;
  }): Promise<Array<{ tenantId: string; userId: string }>> {
    if (params.tenantId) {
      let userId = params.userId;
      if (!userId) {
        const tenant = await this.tenantRepo.findOne({ where: { id: params.tenantId } });
        userId = tenant?.ownerId;
      }
      if (!userId) return [];
      return [{ tenantId: params.tenantId, userId }];
    }

    const eligibleTenantIds = await this.subscriptions.findEligibleForDailyCron();
    const targets: Array<{ tenantId: string; userId: string }> = [];

    for (const tenantId of eligibleTenantIds) {
      const brand = await this.brandRepo.findOne({ where: { tenantId } });
      if (!brand) continue;
      targets.push({ tenantId, userId: brand.userId });
    }

    return targets;
  }
}
