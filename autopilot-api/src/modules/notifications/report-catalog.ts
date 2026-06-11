export const REPORT_CATALOG = [
  {
    id: 'content-performance',
    name: 'Content Performance',
    description: 'Top posts by engagement, likes, comments, and shares across platforms.',
    category: 'content',
  },
  {
    id: 'engagement-weekly',
    name: 'Weekly Engagement',
    description: 'Week-over-week interaction trends on published content.',
    category: 'content',
  },
  {
    id: 'publishing-activity',
    name: 'Publishing Activity',
    description: 'Posts published, failed, and scheduled per platform.',
    category: 'content',
  },
  {
    id: 'lead-pipeline',
    name: 'Lead Pipeline',
    description: 'Hot, warm, and cold leads captured this period.',
    category: 'leads',
  },
  {
    id: 'ai-usage',
    name: 'AI Usage',
    description: 'AI calls by function and remaining quota for the billing period.',
    category: 'billing',
  },
  {
    id: 'subscription-billing',
    name: 'Billing Summary',
    description: 'Plan status, recent payments, and billing period dates.',
    category: 'billing',
  },
  {
    id: 'comment-inbox',
    name: 'Comment & Reply Activity',
    description: 'Pending replies, auto-replies sent, and comment volume.',
    category: 'engagement',
  },
] as const;
