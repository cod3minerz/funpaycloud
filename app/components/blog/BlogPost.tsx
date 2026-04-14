import type { ReactNode } from 'react';
import Image from 'next/image';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import { slugifyHeading } from '@/lib/blog-types';

function extractText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join(' ');
  }

  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as { props?: { children?: ReactNode } }).props?.children ?? '');
  }

  return '';
}

export async function BlogPost({ content }: { content: string }) {
  const headingMap = new Map<string, number>();

  const nextHeadingId = (children: ReactNode) => {
    const text = extractText(children).trim();
    const base = slugifyHeading(text) || 'section';
    const count = headingMap.get(base) ?? 0;
    headingMap.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };

  const components = {
    h2: ({ children }: { children: ReactNode }) => {
      const id = nextHeadingId(children);
      return <h2 id={id}>{children}</h2>;
    },
    h3: ({ children }: { children: ReactNode }) => {
      const id = nextHeadingId(children);
      return <h3 id={id}>{children}</h3>;
    },
    a: ({ href, children }: { href?: string; children: ReactNode }) => (
      <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
        {children}
      </a>
    ),
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <Image
        src={src || '/og-image.png'}
        alt={alt || 'Blog image'}
        width={1200}
        height={630}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 680px"
        className="h-auto w-full rounded-lg border border-[var(--border)]"
      />
    ),
  };

  const evaluated = await evaluate(content, {
    ...runtime,
    useMDXComponents: () => components,
  });

  const MDXContent = evaluated.default;

  return (
    <article className="prose-blog w-full max-w-none">
      <MDXContent components={components} />
    </article>
  );
}
