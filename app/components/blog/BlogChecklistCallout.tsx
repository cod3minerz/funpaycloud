import type { ReactNode } from 'react';

type BlogChecklistCalloutProps = {
  title?: string;
  children: ReactNode;
};

export function BlogChecklistCallout({ title = 'Чеклист внедрения', children }: BlogChecklistCalloutProps) {
  return (
    <aside className="my-8 rounded-2xl border border-[var(--line-2)] bg-[var(--bg-secondary)] p-4 sm:p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">{title}</p>
      <div className="prose-blog max-w-none text-[15px] leading-relaxed">{children}</div>
    </aside>
  );
}
