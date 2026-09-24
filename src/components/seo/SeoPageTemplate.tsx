import Link from 'next/link';
import type { SeoPageConfig } from '@/lib/marketing-seo-pages';
import { Badge, Button, Card, Container, Grid, Heading, Inline, Section, Stack, Text } from '@/design-system';
import { PublicFooter, PublicHeader, PublicPageRoot } from '@/public/PublicShell';
import { VariantBoundary, VariantProvider } from '@/public/variants';
import { PUBLIC_VARIANT_DEFAULTS } from '@/public/variant-defaults';
import { ArrowRight, CheckCircle2 } from '@/shared/streamline/icons';

type SupportingArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: number;
};

type SeoPageTemplateProps = {
  page: SeoPageConfig;
  canonicalUrl: string;
  supportingArticles: SupportingArticle[];
};

export default function SeoPageTemplate({ page, canonicalUrl, supportingArticles }: SeoPageTemplateProps) {
  const faqSchema = page.faq.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faq.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }
    : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://funpay.cloud' },
      { '@type': 'ListItem', position: 2, name: page.h1, item: canonicalUrl },
    ],
  };

  return (
    <PublicPageRoot defaultTheme="dark" className="public-page seo-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
      <VariantProvider defaults={PUBLIC_VARIANT_DEFAULTS.seo}>
        <PublicHeader />
        <main>
          <VariantBoundary id="seo-hero" className="seo-variant seo-hero-variant">
            <Section><Container><div className="seo-hero">
              <Stack gap={6}>
                <Badge tone="brand">{page.primaryQuery}</Badge>
                <Heading as="h1" size="display">{page.h1}</Heading>
                <Text size="lead" tone="muted">{page.lead}</Text>
                <Inline gap={3}>
                  <Button href={page.ctaPrimary.href} size="lg" endIcon={<ArrowRight size={18} />}>{page.ctaPrimary.label}</Button>
                  <Button href={page.ctaSecondary.href} variant="outline" size="lg">{page.ctaSecondary.label}</Button>
                </Inline>
              </Stack>
              <Card className="seo-quick-points"><Stack gap={4}>
                <Text size="sm" tone="muted">Что получает продавец</Text>
                {page.quickPoints.map(point => <Inline key={point} gap={3} className="seo-quick-point"><CheckCircle2 size={20} /><Text>{point}</Text></Inline>)}
              </Stack></Card>
            </div></Container></Section>
          </VariantBoundary>

          <VariantBoundary id="seo-content" className="seo-variant seo-content-variant">
            <Section><Container><Grid columns={3} className="seo-section-grid">
              {page.sections.map((item, index) => <Card key={item.title} className="seo-content-card"><Stack gap={4}>
                <Badge tone="neutral">{String(index + 1).padStart(2, '0')}</Badge>
                <Heading as="h2" size="h3">{item.title}</Heading>
                <Text tone="muted">{item.text}</Text>
                {item.bullets ? <ul className="seo-bullets">{item.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul> : null}
              </Stack></Card>)}
            </Grid></Container></Section>
          </VariantBoundary>

          {page.faq.length > 0 ? <VariantBoundary id="seo-faq" className="seo-variant seo-faq-variant">
            <Section><Container className="seo-reading-container"><Stack gap={6}>
              <Heading as="h2" size="h2">Частые вопросы</Heading>
              <div className="seo-faq-list">{page.faq.map(item => <details key={item.question}><summary>{item.question}</summary><Text tone="muted">{item.answer}</Text></details>)}</div>
            </Stack></Container></Section>
          </VariantBoundary> : null}

          <Section><Container><Stack gap={6}>
            <Heading as="h2" size="h2">Продолжить изучение</Heading>
            <Grid columns={3} className="seo-related-grid">
              {page.relatedLinks.map(item => <Card key={item.href} interactive><Link href={item.href} className="seo-related-link">{item.label}<ArrowRight size={18} /></Link></Card>)}
              {supportingArticles.map(article => <Card key={article.slug} interactive><Stack gap={3}>
                <Inline gap={2}><Badge tone="neutral">{article.category}</Badge><Text size="sm" tone="muted">{article.readingTime} мин</Text></Inline>
                <Heading as="h3" size="h3"><Link href={`/blog/${article.slug}`}>{article.title}</Link></Heading>
                <Text tone="muted">{article.description}</Text>
              </Stack></Card>)}
            </Grid>
          </Stack></Container></Section>
        </main>
        <PublicFooter />
      </VariantProvider>
    </PublicPageRoot>
  );
}
