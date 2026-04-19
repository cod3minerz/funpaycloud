import Link from 'next/link';
import type { SeoPageConfig } from '@/lib/marketing-seo-pages';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';

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
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
    : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Главная',
        item: 'https://funpay.cloud',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.h1,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="landing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <LandingNav homeAnchors />
      <main className="seo-page">
        <div className="wrap">
          <section className="seo-hero">
            <p className="seo-kicker">{page.primaryQuery}</p>
            <h1>{page.h1}</h1>
            <p className="seo-lead">{page.lead}</p>
            <div className="seo-ctas">
              <Link href={page.ctaPrimary.href} className="btn btn-accent btn-lg">
                {page.ctaPrimary.label}
              </Link>
              <Link href={page.ctaSecondary.href} className="btn btn-outline btn-lg">
                {page.ctaSecondary.label}
              </Link>
            </div>
            <ul className="seo-points">
              {page.quickPoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>

          <section className="seo-intent">
            <p>
              <strong>Кластер:</strong> {page.cluster}
            </p>
            <p>
              <strong>Основной запрос:</strong> {page.primaryQuery}
            </p>
            <p>
              <strong>Дополнительные запросы:</strong> {page.secondaryQueries.join(', ')}
            </p>
          </section>

          <section className="seo-sections">
            {page.sections.map(section => (
              <article key={section.title} className="seo-card">
                <h2>{section.title}</h2>
                <p>{section.text}</p>
                {section.bullets && (
                  <ul>
                    {section.bullets.map(bullet => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </section>

          {page.faq.length > 0 && (
            <section className="seo-faq">
              <h2>Частые вопросы</h2>
              <div className="seo-faq-list">
                {page.faq.map(item => (
                  <details key={item.question}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <section className="seo-related">
            <h2>Связанные материалы</h2>
            <div className="seo-related-grid">
              {page.relatedLinks.map(link => (
                <Link key={link.href} href={link.href} className="seo-related-link">
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          {supportingArticles.length > 0 && (
            <section className="seo-related mt-4">
              <h2>Читайте в блоге по этой теме</h2>
              <div className="seo-sections">
                {supportingArticles.map(article => (
                  <article key={article.slug} className="seo-card">
                    <p className="seo-kicker">{article.category}</p>
                    <h3 className="mt-3 text-[24px] font-semibold leading-tight text-[var(--ink)]">
                      <Link href={`/blog/${article.slug}`} className="hover:text-[var(--accent)]">
                        {article.title}
                      </Link>
                    </h3>
                    <p>{article.description}</p>
                    <div className="mt-3">
                      <Link href={`/blog/${article.slug}`} className="seo-related-link">
                        Читать статью ({article.readingTime} мин)
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
