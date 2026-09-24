import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Button, Card, CardContent, Container, Grid, Heading, Inline, Section, Stack, Text } from '@/design-system';
import { BlogPost } from '../../components/blog/BlogPost';
import { ReadingProgress } from '../../components/blog/ReadingProgress';
import { TableOfContents } from '../../components/blog/TableOfContents';
import { PublicBlogCard } from '@/public/blog/BlogCard';
import { VariantBoundary } from '@/public/variants';
import { extractHeadings, formatDate, getAllPostSummaries, getPostBySlug, getRelatedPosts, slugifyCategory } from '@/lib/blog';
import { getTopicForPost } from '@/lib/blog-cta';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPostSummaries().map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Статья не найдена | FunPay Cloud Blog' };

  return {
    title: `${post.title} | FunPay Cloud Blog`,
    description: post.description,
    keywords: post.tags.join(', '),
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      tags: post.tags,
      images: post.cover ? [{ url: post.cover, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.cover ? [post.cover] : [],
    },
    alternates: { canonical: `https://funpay.cloud/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const headings = extractHeadings(post.content);
  const relatedPosts = getRelatedPosts(post.slug, post.category, 3);
  const topic = getTopicForPost(post);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { '@type': 'Organization', name: post.author.name, url: 'https://funpay.cloud' },
    publisher: {
      '@type': 'Organization',
      name: 'FunPay Cloud',
      logo: { '@type': 'ImageObject', url: 'https://funpay.cloud/android-chrome-512x512.png' },
    },
    image: post.cover,
    mainEntityOfPage: `https://funpay.cloud/blog/${post.slug}`,
  };

  return (
    <>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <VariantBoundary id="blog-article">
        <Section className="blog-article">
          <Container className="blog-article__layout">
            <main className="blog-article__main">
              <nav className="blog-breadcrumbs">
                <Link href="/blog">Блог</Link>
                <span>/</span>
                <Link href={`/blog/category/${slugifyCategory(post.category)}`}>{post.category}</Link>
              </nav>
              <Card raised className="blog-article__header">
                <Stack gap={5}>
                  <div className="blog-article__meta">
                    <Badge tone="brand">{post.category}</Badge>
                    <time>{formatDate(post.date)}</time>
                    <span>{post.readingTime} мин</span>
                  </div>
                  <Heading as="h1" size="h1">{post.title}</Heading>
                  <Text size="lead">{post.description}</Text>
                  <div className="blog-author">
                    <Image src={post.author.avatar} alt={post.author.name} width={44} height={44} />
                    <div>
                      <strong>{post.author.name}</strong>
                      <span>Обновлено {formatDate(post.updated || post.date)}</span>
                    </div>
                  </div>
                </Stack>
              </Card>
              {post.cover ? (
                <Card className="blog-article__cover">
                  <Image src={post.cover} alt={post.title} width={1200} height={630} sizes="(max-width: 48rem) 100vw, 48rem" priority />
                </Card>
              ) : null}
              <details className="blog-mobile-toc ds-card">
                <summary>Содержание статьи</summary>
                <TableOfContents headings={headings} mobile />
              </details>
              <Card className="blog-article__body">
                <CardContent><BlogPost content={post.content} slug={post.slug} topic={topic} /></CardContent>
              </Card>
              <Card raised className="blog-callout">
                <CardContent>
                  <Stack gap={4}>
                    <Badge tone="brand">Обновление проекта</Badge>
                    <Heading as="h2" size="h2">Готовим новую версию FunPay Cloud</Heading>
                    <Text>Мы переписываем ядро сервиса. О запуске сообщим отдельно.</Text>
                    <Inline gap={3}>
                      <Button href="/" variant="outline">Статус обновления</Button>
                      <Button href="https://t.me/funpay_cloud">Наш канал</Button>
                    </Inline>
                  </Stack>
                </CardContent>
              </Card>
              {relatedPosts.length ? (
                <Section>
                  <Stack gap={6}>
                    <Heading as="h2" size="h2">Похожие статьи</Heading>
                    <Grid columns={3}>
                      {relatedPosts.map(item => <PublicBlogCard key={item.slug} post={item} />)}
                    </Grid>
                  </Stack>
                </Section>
              ) : null}
            </main>
            <aside>
              <Card className="blog-article__aside">
                <div className="ds-card__header"><Heading as="h2" size="h3">Содержание</Heading></div>
                <CardContent><TableOfContents headings={headings} /></CardContent>
                <CardContent>
                  <Stack gap={3}>
                    <Text size="sm">Регистрация временно недоступна. Новости о запуске появятся в канале.</Text>
                    <Button href="https://t.me/funpay_cloud" block>Наш канал</Button>
                  </Stack>
                </CardContent>
              </Card>
            </aside>
          </Container>
        </Section>
      </VariantBoundary>
    </>
  );
}
