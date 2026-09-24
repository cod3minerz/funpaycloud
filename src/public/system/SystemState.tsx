'use client';

import type { ReactNode } from 'react';
import { Button, ErrorState } from '@/design-system';
import { PublicPageRoot } from '@/public/PublicShell';
import { Activity, AlertTriangle, Search } from '@/shared/streamline/icons';

type SystemStateProps = {
  kind?: 'not-found' | 'error' | 'loading';
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: ReactNode;
};

const icons = {
  'not-found': <Search size={28} />,
  error: <AlertTriangle size={28} />,
  loading: <Activity size={28} />,
};

export function SystemState({ kind = 'error', title, description, actionLabel, actionHref, onAction, icon }: SystemStateProps) {
  const action = actionLabel
    ? <Button href={actionHref} onClick={onAction}>{actionLabel}</Button>
    : undefined;
  return <PublicPageRoot defaultTheme="dark" className="system-page"><ErrorState icon={icon ?? icons[kind]} title={title} description={description} action={action} /></PublicPageRoot>;
}
