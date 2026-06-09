import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MistralChatService } from './mistral-chat.service';
import { PromptBuilderService } from './prompt-builder.service';
import { AiUsageTrackerService } from './ai-usage-tracker.service';
import { BrandProfiles } from '../../brand_profiles/entities/brand_profiles.entity';
import {
  FORM_SUGGESTION_FIELDS,
  FORM_SUGGESTION_FORMAT_HINTS,
  FORM_SUGGESTION_LABELS,
  FormSuggestionType,
  INPUT_STYLE_FIELDS,
  MAX_SUGGESTION_LENGTH,
  SUGGESTIONS_PER_FIELD,
} from '../form-suggestion-forms.constants';
import { brandContextBlock } from '../prompts/brand-fields';

const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
  companyName: ['Acme Labs', 'GreenHarvest — farm-to-market delivery', 'Pulse Digital Studio'],
  industry: ['SaaS', 'Agri-tech & logistics', 'B2B professional services'],
  description: [
    'We help SMEs grow with simple, affordable digital tools.',
    'Founded in 2019, we connect farmers to buyers across Southern Africa — cutting middlemen and raising margins for producers.',
    'Note: lead with outcomes, not features. “Less admin, more revenue.”',
  ],
  services: [
    'Web design, SEO, social media management',
    '- Mobile app development\n- API integrations\n- Monthly retainers\n- Training workshops',
    'End-to-end digital presence: strategy session → build → launch → 90-day optimization.',
  ],
  theme: [
    'Weekly productivity tip for busy founders',
    '- Product spotlight\n- Customer quote\n- Behind-the-scenes\n- Limited offer',
    'Launch week: announce the feature, share social proof, answer objections, drive sign-ups.',
  ],
  title: [
    '3 reasons teams switch to us',
    'What changed after we shipped v2?',
    'Quick note on pricing (and why it’s worth it)',
  ],
  goal: [
    'Drive 200 trial sign-ups in 30 days',
    '- Build awareness\n- Capture leads\n- Retarget warm traffic',
    'Primary: newsletter growth. Secondary: demo bookings from LinkedIn.',
  ],
  name: [
    'Spring Launch',
    'Trust Builder Series — Week 1',
    'Q3 Product Education Campaign',
  ],
  toneOfVoice: [
    'Friendly, expert, plain English — no jargon',
    'We sound like a smart colleague: confident but never preachy.\nDo: be specific. Don’t: hype or fear-monger.',
    'Warm + direct. Short sentences. Occasional light humor.',
  ],
  targetAudience: [
    'SME owners, 30–50, scaling online for the first time',
    '- Startup founders\n- Ops managers at 10–50 person firms\n- Solo consultants',
    'Marketing leads at B2B SaaS (Series A–B) who need consistent content without hiring.',
  ],
  audiencePainPoints: [
    'No time to post consistently; unclear messaging; low engagement',
    '1. Posting feels random, not strategic\n2. Can’t prove ROI to leadership\n3. Brand voice varies by whoever writes',
    'Comment we hear often: “We know we should be on social — we just never know what to say.”',
  ],
  brandPersonality: [
    'The helpful neighbor who’s also great at spreadsheets',
    '- Curious\n- Practical\n- Optimistic\n- Detail-oriented when it matters',
    'If our brand walked into a room: calm energy, listens first, then offers one clear next step.',
  ],
  currentOffers: [
    '20% off first month — ends Friday',
    '- Free audit call (limited slots)\n- Bundle: setup + 3 months content\n- Refer-a-friend credit',
    'Launch promo: waived onboarding fee for teams signing up before month-end.',
  ],
  uniqueSellingPoints: [
    'Local support, fixed pricing, done-for-you content',
    '- Same-day replies\n- Brand Brain keeps voice consistent\n- Publish to 5 platforms from one place',
    'Unlike generic tools: we learn your brand once, then every post sounds like you.',
  ],
  faqs: [
    'Q: How long setup takes? A: Most teams are live in under a week.',
    'Q: Can I cancel anytime?\nA: Yes — monthly plans, no lock-in.\n\nQ: Do you write in our voice?\nA: Yes, using your Brand Brain profile.',
    '- Pricing? Transparent tiers on our site.\n- Integrations? LinkedIn, Meta, X, and more.\n- Support? Email + in-app chat.',
  ],
  caseStudies: [
    'AgriCo: 3× inbound leads in 60 days after consistent LinkedIn posts',
    'Client: regional retailer. Challenge: stale social presence. Result: 40% engagement lift and 12 demo requests/month.',
    '- FinTech startup: 0 → 2k followers in 90 days\n- Clinic group: filled 30 appointment slots from one campaign',
  ],
  competitors: [
    'Buffer, Hootsuite, local agencies',
    '- Competitor A: strong scheduling, weak AI voice\n- Competitor B: cheap templates, generic output\n- Agencies: high cost, slow turnaround',
    'We compete with DIY tools on price and with agencies on quality — faster than both.',
  ],
  keywords: [
    'brand consistency, content automation, SME marketing',
    '#GrowOnline #BrandVoice #ContentThatConverts\n#SmallBusinessTips #MarketingMadeEasy',
    'Primary: “automated social media for SMEs”\nSecondary: brand brain, multi-platform publishing',
  ],
};

@Injectable()
export class FormSuggestionsService {
  constructor(
    private readonly mistral: MistralChatService,
    private readonly prompts: PromptBuilderService,
    private readonly usage: AiUsageTrackerService,
    @InjectRepository(BrandProfiles)
    private readonly brandRepo: Repository<BrandProfiles>,
  ) {}

  async getSuggestions(params: {
    tenantId: string;
    userId: string;
    form: FormSuggestionType;
    fields?: string[];
  }): Promise<{ suggestions: Record<string, string[]> }> {
    const allowed = FORM_SUGGESTION_FIELDS[params.form];
    const fields = (params.fields?.length ? params.fields : allowed).filter((f) =>
      allowed.includes(f),
    );

    if (!fields.length) {
      return { suggestions: {} };
    }

    await this.usage.assertWithinLimit(params.tenantId, params.userId);

    const brand = await this.brandRepo.findOne({
      where: { tenantId: params.tenantId, userId: params.userId },
    });
    const brandCtx = this.prompts.brandFromEntity(brand);

    const fieldList = fields
      .map((f) => {
        const hint = FORM_SUGGESTION_FORMAT_HINTS[f];
        return hint
          ? `- ${f} (${FORM_SUGGESTION_LABELS[f] ?? f}): ${hint}`
          : `- ${f}: ${FORM_SUGGESTION_LABELS[f] ?? f}`;
      })
      .join('\n');

    try {
      const { data, tokensUsed } = await this.mistral.completeJson<{
        suggestions?: Record<string, string[]>;
      }>(
        [
          {
            role: 'system',
            content: `You write varied placeholder suggestions for marketing form fields.
Return ONLY JSON: { "suggestions": { "fieldKey": ["suggestion1", "suggestion2", ...] } }

Rules:
- Exactly ${SUGGESTIONS_PER_FIELD} suggestions per field key.
- Vary LENGTH: include very short (under 40 chars), medium (1–2 sentences), and longer multi-line entries.
- Vary FORMAT across suggestions for the same field:
  • plain descriptions and one-liners
  • bullet lists (prefix lines with "- ")
  • numbered points where natural
  • note-style fragments ("Note:", "Tip:", "Reminder:")
  • comment/reply-style snippets ("We often hear:", "Reply:", "Customers ask:")
  • Q&A pairs for FAQ-style fields
- Use literal newlines inside strings for multi-line suggestions (lists, paragraphs, Q&A).
- No markdown headers, code fences, or HTML.
- Tailor to the brand when a profile exists; otherwise use realistic generic examples.
- Follow each field's format hint. Do not repeat the same structure for all 4 suggestions.`,
          },
          {
            role: 'user',
            content: [
              brand
                ? `Brand profile:\n${brandContextBlock(brandCtx)}`
                : 'No brand profile yet — use neutral professional examples.',
              `Form type: ${params.form}`,
              `Fields:\n${fieldList}`,
            ].join('\n\n'),
          },
        ],
        { model: this.mistral.defaultModel },
      );

      await this.usage.record({
        tenantId: params.tenantId,
        userId: params.userId,
        functionName: 'form-suggestions',
        tokensUsed,
      });

      return {
        suggestions: this.normalize(fields, data.suggestions),
      };
    } catch {
      return { suggestions: this.fallbackOnly(fields) };
    }
  }

  private normalize(
    fields: string[],
    raw?: Record<string, string[]>,
  ): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const field of fields) {
      const maxLen = INPUT_STYLE_FIELDS.has(field)
        ? MAX_SUGGESTION_LENGTH.input
        : MAX_SUGGESTION_LENGTH.textarea;
      const items = Array.isArray(raw?.[field])
        ? raw![field]
            .map((s) => this.trimSuggestion(String(s), maxLen))
            .filter(Boolean)
            .slice(0, SUGGESTIONS_PER_FIELD)
        : [];
      out[field] = items.length >= 2 ? items : this.fallbackFor(field);
    }
    return out;
  }

  private trimSuggestion(text: string, maxLen: number): string {
    const trimmed = text.trim();
    if (trimmed.length <= maxLen) return trimmed;
    return `${trimmed.slice(0, maxLen - 1).trimEnd()}…`;
  }

  private fallbackOnly(fields: string[]): Record<string, string[]> {
    return Object.fromEntries(fields.map((f) => [f, this.fallbackFor(f)]));
  }

  private fallbackFor(field: string): string[] {
    if (FALLBACK_SUGGESTIONS[field]?.length) {
      return FALLBACK_SUGGESTIONS[field].slice(0, SUGGESTIONS_PER_FIELD);
    }
    return [
      `Short ${FORM_SUGGESTION_LABELS[field] ?? field} example`,
      `- Point one\n- Point two\n- Point three`,
      `Note: a longer ${FORM_SUGGESTION_LABELS[field] ?? field} description with a bit more context for the user.`,
    ];
  }
}
