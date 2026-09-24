import Image from 'next/image';
import Link from 'next/link';
import { Badge, Card, CardContent, Stack, Text } from '@/design-system';
import type { BlogPostSummary } from '@/lib/blog-types';
import { formatDate, slugifyCategory } from '@/lib/blog-types';

export function PublicBlogCard({ post }: { post: BlogPostSummary }) {
  return <Card interactive className="blog-card"><Link href={`/blog/${post.slug}`} className="blog-card__cover">{post.cover ? <Image src={post.cover} alt={post.title} width={800} height={450} sizes="(max-width: 48rem) 100vw, (max-width: 64rem) 50vw, 33vw" /> : null}</Link><CardContent><Stack gap={4}><div className="blog-card__meta"><Badge tone="brand"><Link href={`/blog/category/${slugifyCategory(post.category)}`}>{post.category}</Link></Badge><span>{post.readingTime} мин</span></div><Link href={`/blog/${post.slug}`} className="blog-card__title">{post.title}</Link><Text>{post.description}</Text><div className="blog-card__footer"><time>{formatDate(post.date)}</time><Link href={`/blog/${post.slug}`}>Читать</Link></div></Stack></CardContent></Card>;
}
