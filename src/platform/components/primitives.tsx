import * as React from 'react';
import { cn } from '@/app/components/ui/utils';

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
