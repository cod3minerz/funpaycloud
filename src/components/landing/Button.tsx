import Link from 'next/link';
import type { ReactNode } from 'react';

type ButtonVariant = 'ghost' | 'outline' | 'primary' | 'accent';
type ButtonSize = 'default' | 'lg';

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
};

function classes(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return ['btn', `btn-${variant}`, size === 'lg' ? 'btn-lg' : '', className ?? ''].filter(Boolean).join(' ');
}

export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  href,
  className,
  onClick,
  type = 'button',
}: ButtonProps) {
  const classNames = classes(variant, size, className);

  if (href) {
    if (href.startsWith('#')) {
      return (
        <a href={href} className={classNames}>
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={classNames}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classNames}>
      {children}
    </button>
  );
}
