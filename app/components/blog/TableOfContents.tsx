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
    <nav aria-label="Содержание статьи" className={mobile ? 'space-y-1' : 'space-y-1.5'}>
      {headings.map(heading => {
        const isActive = activeId === heading.id;

        return (
          <Link
            key={heading.id}
            href={`#${heading.id}`}
            className={`group flex rounded-lg border-l-2 py-1.5 text-sm transition-colors ${
              heading.level === 3 ? 'pl-4 pr-2' : 'pl-3 pr-2'
            } ${
              isActive
                ? 'border-l-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-l-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="line-clamp-2">{heading.text}</span>
          </Link>
        );
      })}
    </nav>
  );
}
