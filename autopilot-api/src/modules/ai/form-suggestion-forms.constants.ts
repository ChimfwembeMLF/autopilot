export type FormSuggestionType = 'brand-brain' | 'content' | 'campaign' | 'whatsapp-menu';

export const FORM_SUGGESTION_FIELDS: Record<FormSuggestionType, string[]> = {
  'brand-brain': [
    'companyName',
    'industry',
    'description',
    'services',
    'targetAudience',
    'audiencePainPoints',
    'toneOfVoice',
    'brandPersonality',
    'currentOffers',
    'uniqueSellingPoints',
    'faqs',
    'caseStudies',
    'competitors',
    'keywords',
  ],
  content: ['theme', 'title'],
  campaign: ['name', 'theme', 'goal'],
  'whatsapp-menu': [
    'serviceName',
    'welcomeMessage',
    'menuTitle',
    'menuDescription',
    'menuResponse',
  ],
};

export const FORM_SUGGESTION_LABELS: Record<string, string> = {
  companyName: 'Company name',
  industry: 'Industry',
  description: 'Company description',
  services: 'Products & services',
  targetAudience: 'Target audience',
  audiencePainPoints: 'Audience pain points',
  toneOfVoice: 'Tone of voice',
  brandPersonality: 'Brand personality',
  currentOffers: 'Current offers',
  uniqueSellingPoints: 'Unique selling points',
  faqs: 'FAQs',
  caseStudies: 'Case studies',
  bannedWords: 'Banned words',
  bannedTopics: 'Banned topics',
  competitors: 'Competitors',
  keywords: 'Keywords & phrases',
  theme: 'Campaign theme',
  title: 'Post title',
  name: 'Campaign name',
  goal: 'Campaign goal',
  serviceName: 'Business / service name',
  welcomeMessage: 'WhatsApp welcome message',
  menuTitle: 'Menu option label',
  menuDescription: 'Menu option short hint',
  menuResponse: 'Reply when customer picks this option',
};

/** Hints so AI varies format and length per field */
export const FORM_SUGGESTION_FORMAT_HINTS: Record<string, string> = {
  companyName: 'Mix: short name, name + tagline, descriptive brand name',
  industry: 'Mix: 1–3 word label, niche phrase, sector + sub-niche',
  description:
    'Mix: one punchy sentence, 2–3 sentence paragraph, brief mission-style note',
  services:
    'Mix: comma list, bullet list (- item per line), short catalog paragraph',
  targetAudience:
    'Mix: one-line persona, bullet list of segments, demographic + psychographic note',
  audiencePainPoints:
    'Mix: bullet pain points, numbered list, short empathy paragraph',
  toneOfVoice:
    'Mix: adjective list, “We sound like…” note, do/don’t style comment',
  brandPersonality:
    'Mix: metaphor (“If we were a person…”), trait bullets, short character sketch',
  currentOffers:
    'Mix: offer headline, bullet promos, urgency note with dates',
  uniqueSellingPoints:
    'Mix: 3 bullet USPs, comparison note, proof-point list',
  faqs:
    'Mix: Q&A pairs (Q: … A: …), bullet common questions, FAQ snippet with 2 Q&As',
  caseStudies:
    'Mix: client + result one-liner, mini story paragraph, bullet wins',
  competitors:
    'Mix: comma names, bullet list with one-line positioning each, comparison note',
  keywords:
    'Mix: comma phrases, hashtag-style list, grouped keyword bullets',
  theme:
    'Mix: short hook, multi-angle theme bullets, 1–2 sentence campaign brief',
  title:
    'Mix: punchy headline, question title, listicle-style (“3 ways to…”)',
  name:
    'Mix: short campaign codename, descriptive series title, seasonal name',
  goal:
    'Mix: KPI one-liner, bullet objectives, outcome + metric note',
  serviceName: 'Mix: short brand name, name + tagline, descriptive business name',
  welcomeMessage:
    'Mix: friendly one-liner with {serviceName}, question hook, brief “how can we help”',
  menuTitle: 'Mix: action labels — Pricing, Book demo, Track order, Talk to support',
  menuDescription: 'Mix: short subtitle under menu label, benefit hint, 3–6 words',
  menuResponse:
    'Mix: factual reply paragraph, bullet facts, hours + contact + next step',
};

export const SUGGESTIONS_PER_FIELD = 4;
export const MAX_SUGGESTION_LENGTH: Record<'input' | 'textarea', number> = {
  input: 160,
  textarea: 600,
};

export const INPUT_STYLE_FIELDS = new Set([
  'companyName',
  'industry',
  'title',
  'name',
  'goal',
  'serviceName',
  'menuTitle',
  'menuDescription',
]);
