'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { TocHeading } from '@/lib/blog-types';

export function TableOfContents({ headings, mobile = false }: { headings: TocHeading[]; mobile?: boolean }) {
  const [activeId, setActiveId] = useState<string>('');

  const ids = useMemo(() => headings.map(h => h.id).filter(Boolean), [headings]);

  useEffect(() => {
    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-35% 0px -55% 0px',
        threshold: 0.1,
      },
    );

    ids.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [ids]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Содержание статьи" className="blog-toc">
      {headings.map(heading => {
        const isActive = activeId === heading.id;

        return (
          <Link
            key={heading.id}
            href={`#${heading.id}`}
            data-level={heading.level}
            aria-current={isActive ? 'location' : undefined}
          >
            <span>{heading.text}</span>
          </Link>
        );
      })}
    </nav>
  );
}
