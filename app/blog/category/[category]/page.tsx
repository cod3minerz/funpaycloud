import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Button, Card, CardContent, Container, Grid, Heading, Section, Stack, Text } from '@/design-system';
import { PublicBlogCard } from '@/public/blog/BlogCard';
import { VariantBoundary } from '@/public/variants';
import { getCategories, getCategoryBySlug, getPostsByCategory, slugifyCategory } from '@/lib/blog';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return getCategories().map(category => ({ category: slugifyCategory(category) }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(decodeURIComponent(categorySlug));

  if (!category) {
    return { title: 'Категория не найдена | FunPay Cloud Blog' };
  }

  return {
    title: `${category} | FunPay Cloud Blog`,
    description: `Подборка материалов категории «${category}» в блоге FunPay Cloud.`,
    alternates: {
      canonical: `https://funpay.cloud/blog/category/${categorySlug}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(decodeURIComponent(categorySlug));

  if (!category) notFound();

  const posts = getPostsByCategory(category);

  return (
    <VariantBoundary id="blog-feed"><Section><Container><Stack gap={6}><Badge tone="brand">Категория</Badge><Heading as="h1" size="h1">{category}</Heading><Text size="lead">{posts.length} статей. Материалы отсортированы от новых к более ранним.</Text><Button href="/blog" variant="outline">Ко всем статьям</Button>{posts.length === 0 ? <Card><CardContent><Text>В этой категории пока нет материалов.</Text></CardContent></Card> : <Grid columns={3} className="blog-card-grid">{posts.map(post => <PublicBlogCard key={post.slug} post={post} />)}</Grid>}</Stack></Container></Section></VariantBoundary>
  );
}
