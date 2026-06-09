import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MistralChatService } from '../../ai/services/mistral-chat.service';
import { PromptBuilderService } from '../../ai/services/prompt-builder.service';
import { AiUsageTrackerService } from '../../ai/services/ai-usage-tracker.service';
import { BrandProfiles } from '../../brand_profiles/entities/brand_profiles.entity';
import { platformPublishGuide } from '../platform-publish.constants';

export type AdaptedPlatformPayload = {
  title: string;
  content: string;
};

@Injectable()
export class AdaptPlatformsService {
  constructor(
    private readonly mistral: MistralChatService,
    private readonly prompts: PromptBuilderService,
    private readonly usage: AiUsageTrackerService,
    @InjectRepository(BrandProfiles)
    private readonly brandRepo: Repository<BrandProfiles>,
  ) {}

  async adapt(params: {
    tenantId: string;
    userId: string;
    platforms: string[];
    title?: string;
    content: string;
  }): Promise<{ payloads: Record<string, AdaptedPlatformPayload>; tokensUsed: number }> {
    if (!params.tenantId) throw new BadRequestException('tenantId is required');
    if (!params.platforms?.length) throw new BadRequestException('platforms is required');
    if (!params.content?.trim()) throw new BadRequestException('content is required');

    await this.usage.assertWithinLimit(params.tenantId, params.userId);

    const brand = await this.brandRepo.findOne({
      where: { tenantId: params.tenantId, userId: params.userId },
    });
    const brandCtx = this.prompts.brandFromEntity(brand);

    const plainSource = params.content.replace(/<[^>]*>/g, '').trim();
    const payloads: Record<string, AdaptedPlatformPayload> = {};
    let totalTokens = 0;

    for (const platform of params.platforms) {
      const guide = platformPublishGuide(platform);
      const { data, tokensUsed } = await this.mistral.completeJson<{
        title?: string;
        content?: string;
      }>(
        [
          {
            role: 'system',
            content: this.prompts.platformAdaptSystem(brandCtx, platform, guide),
          },
          {
            role: 'user',
            content: [
              `Original title: ${params.title || 'Untitled'}`,
              `Original content:\n${plainSource}`,
              `Adapt specifically for ${platform}. Follow current ${platform} content trends.`,
            ].join('\n\n'),
          },
        ],
      );

      totalTokens += tokensUsed;
      let content = (data.content ?? plainSource).replace(/<[^>]*>/g, '').trim();
      if (content.length > guide.maxChars) {
        content = content.slice(0, guide.maxChars - 1).trimEnd() + '…';
      }

      payloads[platform] = {
        title: data.title?.trim() || params.title || platform,
        content,
      };
    }

    await this.usage.record({
      tenantId: params.tenantId,
      userId: params.userId,
      functionName: 'adapt-platforms',
      tokensUsed: totalTokens,
    });

    return { payloads, tokensUsed: totalTokens };
  }
}
