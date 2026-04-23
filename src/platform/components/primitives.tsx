import * as React from 'react';
import { cn } from '@/app/components/ui/utils';
import { motion } from 'motion/react';

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
  return (
    <article
      className={cn('platform-card platform-kpi-card platform-stat-card relative overflow-hidden', `platform-stat-card--${color}`, className)}
    >
      <div className="platform-stat-card-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      {icon && (
        <div className="platform-stat-card-icon inline-flex items-center gap-2 text-[13px] font-semibold">
          {icon}
        </div>
      )}
      <strong className="text-[28px] font-bold leading-none tracking-tight">{value}</strong>
      <span className="text-[12px] text-[var(--pf-text-dim)]">{label}</span>
    </article>
  );
}

export function PageShell({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('platform-page', className)}
      {...(props as any)}
    />
  );
}

export function PageHeader({ className, ...props }: React.ComponentProps<'header'>) {
  return <header className={cn('platform-page-header', className)} {...props} />;
}

export function PageTitle({
  title,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h1 className="platform-page-title">{title}</h1>
    </div>
  );
}

export function SectionCard({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <motion.section
      className={cn('platform-card', className)}
      {...(props as any)}
    />
  );
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
  return (
    <motion.article
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={cn('platform-card platform-kpi-card', className)}
      {...(props as any)}
    />
  );
}

export function DataTableWrap({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('platform-table-wrap', className)} {...props} />;
}

export function EmptyState({
  children,
  icon: Icon,
  title,
  action,
  className,
}: {
  children?: React.ReactNode;
  icon?: any;
  title?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  if (!title && !Icon && !action && children) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-[var(--pf-border-strong)] bg-[var(--pf-surface-2)]/40', className)}>
        <p className="text-[13px] text-[var(--pf-text-dim)]">{children}</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-[var(--pf-border-strong)] bg-[var(--pf-surface-2)]/40', className)}>
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--pf-surface)] shadow-sm border border-[var(--pf-border)] text-[var(--pf-text-muted)]">
          <Icon size={24} />
        </div>
      )}
      {title && <h3 className="mb-1 text-[15px] font-semibold text-[var(--pf-text)]">{title}</h3>}
      {children && <div className="mb-5 max-w-[320px] text-[13px] text-[var(--pf-text-dim)] leading-relaxed">{children}</div>}
      {action && <div>{action}</div>}
    </div>
  );
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
