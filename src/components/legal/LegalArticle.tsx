import type { ReactNode } from 'react';
import { Badge, Card, Container, Heading, Stack, Text } from '@/design-system';
import { VariantBoundary } from '@/public/variants';

type LegalArticleProps = {
  title: string;
  description: string;
  updatedAt: string;
  children: ReactNode;
};

export default function LegalArticle({ title, description, updatedAt, children }: LegalArticleProps) {
  return (
    <VariantBoundary id="legal-article" className="legal-variant">
      <Container className="legal-container">
        <article className="legal-article">
          <Stack gap={5} className="legal-hero">
            <Badge tone="brand">Юридическая информация</Badge>
            <Heading as="h1" size="display">{title}</Heading>
            <Text size="lead" tone="muted">{description}</Text>
            <Text size="sm" tone="muted">Последнее обновление: {updatedAt}</Text>
          </Stack>
          <Card className="legal-content">{children}</Card>
        </article>
      </Container>
    </VariantBoundary>
  );
}
