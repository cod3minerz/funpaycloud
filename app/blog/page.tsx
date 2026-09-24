import type { Metadata } from 'next';
import { BlogFeed } from '@/public/blog/BlogFeed';
import { getAllPostSummaries, getCategories } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Блог FunPay Cloud — Руководства для продавцов',
  description:
    'Руководства, советы и кейсы по автоматизации продаж на FunPay. Узнайте как увеличить продажи и сэкономить время.',
  openGraph: {
    title: 'Блог FunPay Cloud',
    description: 'Руководства для продавцов FunPay',
    type: 'website',
  },
  alternates: {
    canonical: 'https://funpay.cloud/blog',
  },
};

export default function BlogPage() {
  const posts = getAllPostSummaries();
  const categories = getCategories();

  return <BlogFeed posts={posts} categories={categories} />;
}
