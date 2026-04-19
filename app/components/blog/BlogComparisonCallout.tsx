import type { ReactNode } from 'react';

type BlogComparisonCalloutProps = {
  title?: string;
  leftTitle?: string;
  rightTitle?: string;
  left: ReactNode;
  right: ReactNode;
};

export function BlogComparisonCallout({
  title = 'Сравнение подходов',
  leftTitle = 'Вариант 1',
  rightTitle = 'Вариант 2',
  left,
  right,
}: BlogComparisonCalloutProps) {
  return (
    <aside className="my-8 rounded-2xl border border-[var(--line-2)] bg-[var(--bg-card)] p-4 sm:p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">{title}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--line-2)] bg-[var(--bg-secondary)] p-3">
          <p className="mb-1 text-sm font-semibold text-[var(--text-primary)]">{leftTitle}</p>
          <div className="text-sm leading-relaxed text-[var(--text-secondary)]">{left}</div>
        </div>
        <div className="rounded-xl border border-[var(--line-2)] bg-[var(--bg-secondary)] p-3">
          <p className="mb-1 text-sm font-semibold text-[var(--text-primary)]">{rightTitle}</p>
          <div className="text-sm leading-relaxed text-[var(--text-secondary)]">{right}</div>
        </div>
      </div>
    </aside>
  );
}
