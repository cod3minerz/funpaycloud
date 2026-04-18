import * as React from 'react';
import { cn } from '@/app/components/ui/utils';

export function StatCard({
  label,
  value,
  icon,
  color = 'accent',
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  color?: 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const colorMap = {
    accent: 'var(--pf-accent)',
    success: 'var(--pf-success)',
    warning: 'var(--pf-warning)',
    danger: 'var(--pf-danger)',
  };

  return (
    <article
      className={cn('platform-card platform-kpi-card relative overflow-hidden', className)}
      style={{ '--stat-color': colorMap[color] } as React.CSSProperties}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${colorMap[color]}, transparent)` }}
        aria-hidden
      />
      {icon && (
        <div className="inline-flex items-center gap-2 text-[13px] font-semibold" style={{ color: colorMap[color] }}>
          {icon}
        </div>
      )}
      <strong className="text-[28px] font-bold leading-none tracking-tight">{value}</strong>
      <span className="text-[12px]" style={{ color: 'var(--pf-text-dim)' }}>{label}</span>
    </article>
  );
}

export function PageShell({ className, ...props }: React.ComponentProps<'section'>) {
  return <section className={cn('platform-page', className)} {...props} />;
}

export function PageHeader({ className, ...props }: React.ComponentProps<'header'>) {
  return <header className={cn('platform-page-header', className)} {...props} />;
}

export function PageTitle({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h1 className="platform-page-title">{title}</h1>
      {subtitle && <p className="platform-page-subtitle">{subtitle}</p>}
    </div>
  );
}

export function SectionCard({ className, ...props }: React.ComponentProps<'section'>) {
  return <section className={cn('platform-card', className)} {...props} />;
}

export function Panel({ className, ...props }: React.ComponentProps<'article'>) {
  return <article className={cn('platform-panel', className)} {...props} />;
}

export function ToolbarRow({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('platform-toolbar', className)} {...props} />;
}

export function KpiGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('platform-kpi-grid', className)} {...props} />;
}

export function KpiCard({ className, ...props }: React.ComponentProps<'article'>) {
  return <article className={cn('platform-card platform-kpi-card', className)} {...props} />;
}

export function DataTableWrap({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('platform-table-wrap', className)} {...props} />;
}

export function EmptyState({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('platform-empty', className)}>{children}</div>;
}

export function RequestErrorState({
  message,
  onRetry,
  buttonLabel = 'Повторить',
  className,
}: {
  message: string;
  onRetry: () => void;
  buttonLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('platform-empty', className)}>
      <p className="mb-3">{message}</p>
      <button className="platform-btn-secondary" onClick={onRetry}>
        {buttonLabel}
      </button>
    </div>
  );
}
