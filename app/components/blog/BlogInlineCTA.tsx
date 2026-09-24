'use client';

import { Badge, Button, Card, CardContent, Inline, Stack, Text } from '@/design-system';
import { trackBlogEvent } from './trackBlogEvent';
import { getCtaConfig, type BlogCtaTopic } from '@/lib/blog-cta';

type BlogInlineCTAProps = {
  topic?: BlogCtaTopic;
  slug?: string;
};

export function BlogInlineCTA({ topic = 'automation', slug }: BlogInlineCTAProps) {
  const config = getCtaConfig(topic);

  return (
    <Card className="blog-callout"><CardContent><Stack gap={4}><Badge tone="brand">Обновление проекта</Badge><strong>{config.title}</strong><Text size="sm">{config.description}</Text><Inline gap={2}><Badge tone="neutral">Скоро запуск</Badge></Inline><Button href={config.actionHref} variant="outline" size="sm" onClick={() => trackBlogEvent('blog_cta_inline_click', { slug: slug ?? 'unknown', topic: config.topic, target: 'status' })}>{config.actionLabel}</Button></Stack></CardContent></Card>
  );
}
