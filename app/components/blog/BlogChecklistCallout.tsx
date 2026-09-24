import type { ReactNode } from 'react';
import { Badge, Card, CardContent, Stack } from '@/design-system';

type BlogChecklistCalloutProps = {
  title?: string;
  children: ReactNode;
};

export function BlogChecklistCallout({ title = 'Чеклист внедрения', children }: BlogChecklistCalloutProps) {
  return (
    <Card className="blog-callout"><CardContent><Stack gap={3}><Badge tone="brand">{title}</Badge><div className="prose-blog">{children}</div></Stack></CardContent></Card>
  );
}
