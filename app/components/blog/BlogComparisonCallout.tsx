import type { ReactNode } from 'react';
import { Badge, Card, CardContent, Stack } from '@/design-system';

type BlogComparisonCalloutProps = {
  title?: string;
  leftTitle?: string;
  rightTitle?: string;
  left: ReactNode;
  right: ReactNode;
};

export function BlogComparisonCallout({
  title = 'Сравнение подходов',
  leftTitle = 'Вариант 1',
  rightTitle = 'Вариант 2',
  left,
  right,
}: BlogComparisonCalloutProps) {
  return (
    <Card className="blog-callout"><CardContent><Stack gap={4}><Badge tone="brand">{title}</Badge><div className="blog-callout__comparison"><div className="blog-callout__panel"><strong>{leftTitle}</strong><div>{left}</div></div><div className="blog-callout__panel"><strong>{rightTitle}</strong><div>{right}</div></div></div></Stack></CardContent></Card>
  );
}
