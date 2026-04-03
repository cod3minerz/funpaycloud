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
    <header className="p2-page-head">
      <div>
        <h1 className="p2-page-title">{title}</h1>
        <p className="p2-page-sub">{description}</p>
      </div>
      {actions ? <div className="inline-flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function P2Panel({
  title,
  subtitle,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('p2-panel', className)}>
      {title || subtitle || right ? (
        <div className="p2-panel-head">
          <div>
            {title ? <h3 className="p2-panel-title">{title}</h3> : null}
            {subtitle ? <p className="p2-panel-sub">{subtitle}</p> : null}
          </div>
          {right}
        </div>
      ) : null}
      <div className={cn('p2-panel-body', bodyClassName)}>{children}</div>
    </section>
  );
}

export function P2KPI({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="p2-kpi">
      <p className="p2-kpi-label">{label}</p>
      <p className="p2-kpi-value">{value}</p>
      {note ? <p className="p2-kpi-note">{note}</p> : null}
    </article>
  );
}

export function P2PrimaryAction({ children, className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button className={cn('p2-btn-primary', className)} {...props}>
      {children}
    </Button>
  );
}

export function P2SecondaryAction({ children, className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" className={cn('p2-btn-soft', className)} {...props}>
      {children}
    </Button>
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

export function p2FormatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
