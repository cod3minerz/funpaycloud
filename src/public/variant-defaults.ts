import type { SectionVariantConfig } from './variants';

export const PUBLIC_VARIANT_DEFAULTS = {
  landing: {
    hero: 'a',
    proof: 'a',
    workflow: 'a',
    capabilities: 'a',
    ai: 'a',
    safety: 'a',
    pricing: 'a',
    faq: 'a',
    cta: 'a',
  },
  blog: {
    'blog-hero': 'a',
    'blog-feed': 'a',
    'blog-article': 'a',
  },
  auth: { 'auth-shell': 'a' },
  legal: { 'legal-article': 'a' },
  about: { 'legal-article': 'b' },
  seo: { 'seo-hero': 'a', 'seo-content': 'a', 'seo-faq': 'a' },
} satisfies Record<string, SectionVariantConfig>;
