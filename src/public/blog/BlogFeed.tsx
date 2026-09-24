'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, Container, Grid, Heading, Input, Section, Stack, Text } from '@/design-system';
import { Search } from '@/shared/streamline/icons';
import type { BlogPostSummary } from '@/lib/blog-types';
import { VariantBoundary } from '../variants';
import { PublicBlogCard } from './BlogCard';

export function BlogFeed({ posts, categories }: { posts: BlogPostSummary[]; categories: string[] }) {
  const [category, setCategory] = useState('Все');
  const [query, setQuery] = useState('');
  const featured = posts.find(post => post.featured) ?? posts[0];
  const filtered = useMemo(() => posts.filter(post => {
    if (post.slug === featured?.slug) return false;
    if (category !== 'Все' && post.category !== category) return false;
    const normalized = query.trim().toLowerCase();
    return !normalized || `${post.title} ${post.description} ${post.tags.join(' ')}`.toLowerCase().includes(normalized);
  }), [category, featured?.slug, posts, query]);

  return <><VariantBoundary id="blog-hero"><Section className="blog-hero"><Container className="blog-hero__layout"><Stack gap={6}><Badge tone="brand">Блог FunPay Cloud</Badge><Heading as="h1" size="display">Практика облачной автоматизации без воды</Heading><Text size="lead">Разбираем архитектуру магазина, работу с клиентами и процессы, которые возвращают продавцу время.</Text><label className="blog-search"><Search size={18} /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти статью" aria-label="Поиск по блогу" /></label></Stack>{featured ? <Card raised className="blog-featured"><Link href={`/blog/${featured.slug}`}>{featured.cover ? <Image src={featured.cover} alt={featured.title} width={900} height={506} priority /> : null}</Link><CardContent><Stack gap={3}><Badge tone="success">Выбор редакции</Badge><Link href={`/blog/${featured.slug}`} className="blog-featured__title">{featured.title}</Link><Text>{featured.description}</Text></Stack></CardContent></Card> : null}</Container></Section></VariantBoundary><VariantBoundary id="blog-feed"><Section subtle><Container><div className="blog-feed__toolbar"><Stack gap={2}><Heading as="h2" size="h2">Все материалы</Heading><Text size="sm">{filtered.length} публикаций по выбранным условиям</Text></Stack><div className="blog-categories"><Button size="sm" variant={category === 'Все' ? 'primary' : 'outline'} onClick={() => setCategory('Все')}>Все</Button>{categories.map(item => <Button key={item} size="sm" variant={category === item ? 'primary' : 'outline'} onClick={() => setCategory(item)}>{item}</Button>)}</div></div>{filtered.length ? <Grid columns={3} className="blog-card-grid">{filtered.map(post => <PublicBlogCard key={post.slug} post={post} />)}</Grid> : <Card className="blog-empty"><CardContent><Heading as="h3" size="h3">Материалы не найдены</Heading><Text>Измените запрос или выберите другую категорию.</Text></CardContent></Card>}</Container></Section></VariantBoundary></>;
}
