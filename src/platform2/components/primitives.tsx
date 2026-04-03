'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';

export function P2PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="p2-page-header">
      <div>
        <h1 className="p2-page-title">{title}</h1>
        <p className="p2-page-desc">{description}</p>
      </div>
      {actions ? <div className="inline-flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function P2Card({
  title,
  subtitle,
  right,
  children,
  bodyClassName,
  className,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section className={cn('p2-card', className)}>
      {title || subtitle || right ? (
        <div className="p2-card-head flex items-start justify-between gap-3">
          <div>
            {title ? <h3 className="p2-card-title">{title}</h3> : null}
            {subtitle ? <p className="p2-card-sub">{subtitle}</p> : null}
          </div>
          {right}
        </div>
      ) : null}
      <div className={cn('p2-card-body', bodyClassName)}>{children}</div>
    </section>
  );
}

export function P2Stat({
  label,
  value,
  foot,
}: {
  label: string;
  value: string;
  foot?: ReactNode;
}) {
  return (
    <article className="p2-kpi">
      <p className="p2-kpi-label">{label}</p>
      <p className="p2-kpi-value">{value}</p>
      {foot ? <div className="p2-kpi-foot">{foot}</div> : null}
    </article>
  );
}

export function P2Status({ type, children }: { type: 'success' | 'warning' | 'danger' | 'info'; children: ReactNode }) {
  return <span className={cn('p2-status', type)}>{children}</span>;
}

export function statusTypeByOrder(status: 'paid' | 'completed' | 'refund' | 'dispute') {
  if (status === 'completed') return 'success' as const;
  if (status === 'paid') return 'warning' as const;
  if (status === 'refund') return 'danger' as const;
  return 'info' as const;
}

export function statusLabelByOrder(status: 'paid' | 'completed' | 'refund' | 'dispute') {
  if (status === 'completed') return 'Выполнен';
  if (status === 'paid') return 'Оплачен';
  if (status === 'refund') return 'Возврат';
  return 'Спор';
}

export function P2PrimaryAction({ children, className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button className={cn('p2-primary-btn', className)} {...props}>
      {children}
    </Button>
  );
}

export function P2SecondaryAction({ children, className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" className={cn('p2-secondary-btn', className)} {...props}>
      {children}
    </Button>
  );
}
