import 'server-only';

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { BlogPost, BlogPostSummary, TocHeading } from './blog-types';
import { slugifyCategory, slugifyHeading } from './blog-types';

export * from './blog-types';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function toDateOrToday(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizePost(slug: string, data: Record<string, unknown>, content: string): BlogPost {
  const calcReadingMinutes = Math.ceil(readingTime(content).minutes);
  const fmReading = Number(data.readingTime);

  const tags = Array.isArray(data.tags)
    ? data.tags.map(tag => String(tag).trim()).filter(Boolean)
    : [];

  const authorData = typeof data.author === 'object' && data.author !== null
    ? (data.author as Record<string, unknown>)
    : {};

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ''),
    date: toDateOrToday(data.date),
    updated: typeof data.updated === 'string' ? data.updated : undefined,
    category: String(data.category ?? 'Без категории'),
    tags,
    author: {
      name: String(authorData.name ?? 'Команда FunPay Cloud'),
      avatar: String(authorData.avatar ?? '/images/team-avatar.svg'),
    },
    cover: typeof data.cover === 'string' ? data.cover : undefined,
    readingTime: Number.isFinite(fmReading) && fmReading > 0 ? Math.round(fmReading) : Math.max(calcReadingMinutes, 1),
    featured: Boolean(data.featured),
    content,
  };
}

function readPostFile(fileName: string): BlogPost {
  const slug = fileName.replace(/\.mdx?$/, '');
  const filePath = path.join(BLOG_DIR, fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return normalizePost(slug, data as Record<string, unknown>, content);
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter(file => file.endsWith('.mdx') || file.endsWith('.md'));

  return files
    .map(readPostFile)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllPostSummaries(): BlogPostSummary[] {
  return getAllPosts().map(({ content, ...summary }) => summary);
}

export function getPostBySlug(slug: string): BlogPost | null {
  const candidate = path.join(BLOG_DIR, `${slug}.mdx`);
  const altCandidate = path.join(BLOG_DIR, `${slug}.md`);

  const filePath = fs.existsSync(candidate) ? candidate : altCandidate;
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return normalizePost(slug, data as Record<string, unknown>, content);
}

export function getCategories(): string[] {
  const categories = getAllPostSummaries().map(post => post.category);
  return [...new Set(categories)].sort((a, b) => a.localeCompare(b, 'ru'));
}

export function getCategoryBySlug(categorySlug: string): string | null {
  const categories = getCategories();
  return categories.find(category => slugifyCategory(category) === categorySlug) ?? null;
}

export function getPostsByCategory(category: string): BlogPostSummary[] {
  return getAllPostSummaries().filter(post => post.category === category);
}

export function getRelatedPosts(currentSlug: string, category: string, limit = 3): BlogPostSummary[] {
  const all = getAllPostSummaries().filter(post => post.slug !== currentSlug);
  const sameCategory = all.filter(post => post.category === category);

  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }

  const fallback = all.filter(post => post.category !== category);
  return [...sameCategory, ...fallback].slice(0, limit);
}

export function extractHeadings(content: string): TocHeading[] {
  const lines = content.split(/\r?\n/);
  const headings: TocHeading[] = [];
  const usedIds = new Map<string, number>();

  for (const line of lines) {
    const match = /^(##|###)\s+(.+)$/.exec(line.trim());
    if (!match) continue;

    const level = match[1] === '##' ? 2 : 3;
    const text = match[2].replace(/\[(.*?)\]\(.*?\)/g, '$1').trim();
    const base = slugifyHeading(text);
    const seenCount = usedIds.get(base) ?? 0;
    usedIds.set(base, seenCount + 1);
    const id = seenCount === 0 ? base : `${base}-${seenCount + 1}`;

    headings.push({ id, text, level });
  }

  return headings;
}
