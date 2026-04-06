import React from 'react';

type MarkProps = {
  size?: number;
  className?: string;
};

export function TelegramMark({ size = 14, className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8.5 12.15L15.9 8.95C16.22 8.81 16.52 9.12 16.39 9.43L13.14 16.98C12.99 17.33 12.5 17.33 12.35 16.98L11.19 14.15L8.36 13C8.01 12.85 8 12.29 8.5 12.15Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function VkMark({ size = 14, className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <text
        x="12"
        y="15.3"
        textAnchor="middle"
        fill="currentColor"
        fontSize="7.8"
        fontWeight="700"
        fontFamily="Manrope, Arial, sans-serif"
        letterSpacing="0.1"
      >
        VK
      </text>
    </svg>
  );
}
