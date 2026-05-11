'use client';

import React from 'react';

type CommonProps = {
  children?: React.ReactNode;
  className?: string;
  ClassName?: string;
};

type LinkishProps = CommonProps & {
  component?: React.ElementType;
  href?: string;
  link?: string;
  target?: string;
  img?: string;
};

export function AMSidebar({
  children,
  className,
}: CommonProps & {
  collapsible?: string;
  animation?: boolean;
  showProfile?: boolean;
  width?: string | number;
  showTrigger?: boolean;
  mode?: string;
}) {
  return <aside className={className}>{children}</aside>;
}

export function AMLogo({ component: Component = 'a', href = '/', children, className }: LinkishProps) {
  return (
    <Component href={href} className={className}>
      {children}
    </Component>
  );
}

export function AMMenu({ subHeading, children, ClassName, className }: CommonProps & { subHeading?: string }) {
  return <div className={ClassName || className}>{subHeading || children}</div>;
}

export function AMSubmenu({ icon, title, children, ClassName, className }: CommonProps & { icon?: React.ReactNode; title?: React.ReactNode }) {
  return (
    <details open className={ClassName || className}>
      <summary className="flex cursor-pointer list-none items-center gap-2 py-2">
        {icon}
        <span>{title}</span>
      </summary>
      <div className="ml-4">{children}</div>
    </details>
  );
}

export function AMMenuItem({
  icon,
  children,
  link,
  target,
  component: Component = 'a',
  className,
  isSelected,
  badge,
  badgeContent,
  disabled,
}: LinkishProps & {
  icon?: React.ReactNode;
  isSelected?: boolean;
  badge?: boolean;
  badgeColor?: string;
  badgeTextColor?: string;
  badgeContent?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Component
      href={link || '#'}
      target={target}
      aria-disabled={disabled}
      className={`${className || ''} flex items-center gap-2 rounded-md px-2 py-2 ${isSelected ? 'text-primary' : ''} ${disabled ? 'pointer-events-none opacity-60' : ''}`.trim()}
    >
      {icon}
      {children}
      {badge && badgeContent ? <span className="ml-auto text-xs">{badgeContent}</span> : null}
    </Component>
  );
}
