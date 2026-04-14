export interface BlogAuthor {
  name: string;
  avatar: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  category: string;
  tags: string[];
  author: BlogAuthor;
  cover?: string;
  readingTime: number;
  featured: boolean;
  content: string;
}

export type BlogPostSummary = Omit<BlogPost, 'content'>;

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugifyHeading(rawText: string): string {
  return rawText
    .toLowerCase()
    .trim()
    .replace(/[`_*~]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
