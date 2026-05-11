'use client';

import React from 'react';

type SimpleBarProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

const SimpleBar = React.forwardRef<HTMLDivElement, SimpleBarProps>(function SimpleBar(
  { className = '', children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`overflow-auto ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
});

export default SimpleBar;

