import { Injectable } from '@nestjs/common';
import { BrandProfiles } from '../../brand_profiles/entities/brand_profiles.entity';
import { BrandContext, brandContextBlock } from '../prompts/brand-fields';

@Injectable()
export class PromptBuilderService {
  brandFromEntity(profile: BrandProfiles | null): BrandContext {
    if (!profile) return {};
    return {
      companyName: profile.companyName,
      industry: profile.industry,
      description: profile.description,
      services: profile.services,
      targetAudience: profile.targetAudience,
      audiencePainPoints: profile.audiencePainPoints,
      toneOfVoice: profile.toneOfVoice,
      brandPersonality: profile.brandPersonality,
      currentOffers: profile.currentOffers,
      uniqueSellingPoints: profile.uniqueSellingPoints,
      faqs: profile.faqs,
      caseStudies: profile.caseStudies,
      bannedWords: profile.bannedWords,
      bannedTopics: profile.bannedTopics,
      competitors: profile.competitors,
      keywords: profile.keywords,
    };
  }

  contentGenerationSystem(brand: BrandContext, platform?: string): string {
    const guardrails = [
      brand.bannedWords ? `Never use these words: ${brand.bannedWords}` : '',
      brand.bannedTopics ? `Avoid these topics: ${brand.bannedTopics}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return `You are a marketing copywriter for ${brand.companyName || 'this brand'}.
Write on-brand content using the brand profile below.
${platform ? `Optimize for ${platform}.` : 'Write versatile marketing copy.'}
${guardrails}
Return ONLY valid JSON: {"title":"...","content":"<p>HTML paragraphs</p>"}
Use simple HTML (<p>, <ul>, <li>, <strong>) — no scripts or external links.`;
  }

  contentGenerationUser(
    brand: BrandContext,
    theme: string,
    draft?: string,
    contentType?: string,
  ): string {
    const parts = [
      `Brand profile:\n${brandContextBlock(brand)}`,
      `Campaign theme: ${theme}`,
    ];
    if (contentType) parts.push(`Content type: ${contentType}`);
    if (draft?.trim()) parts.push(`Existing draft to improve:\n${draft}`);
    return parts.join('\n\n');
  }

  repurposeSystem(brand: BrandContext, targetPlatform: string): string {
    return `Adapt marketing content for ${targetPlatform} while staying on-brand.
${brandContextBlock(brand)}
Return ONLY valid JSON: {"title":"...","content":"<p>HTML</p>"}`;
  }

  platformAdaptSystem(
    brand: BrandContext,
    platform: string,
    guide: { maxChars: number; trends: string; format: string },
  ): string {
    const guardrails = [
      brand.bannedWords ? `Never use: ${brand.bannedWords}` : '',
      brand.bannedTopics ? `Avoid topics: ${brand.bannedTopics}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return `You are an expert ${platform} content strategist for ${brand.companyName || 'this brand'}.
${brandContextBlock(brand)}

Platform: ${platform}
Character limit: ${guide.maxChars}
Current trends: ${guide.trends}
Format: ${guide.format}
${guardrails}

Return ONLY valid JSON: {"title":"short headline","content":"plain text post body"}
Rules:
- Match how top creators/brands post on ${platform} TODAY (tone, length, hooks, hashtags if appropriate).
- content must be plain text (no HTML, no markdown).
- Stay within ${guide.maxChars} characters for content.
- Do NOT mention other platforms.`;
  }

  replySystem(brand: BrandContext): string {
    return `Write a short, friendly social media reply on-brand.
${brandContextBlock(brand)}
Return ONLY valid JSON: {"content":"plain text reply under 280 chars"}`;
  }
}
