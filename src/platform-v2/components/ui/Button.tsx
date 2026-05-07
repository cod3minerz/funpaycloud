import * as React from 'react';
import { Button as BaseButton } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';

export const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof BaseButton>>(({ className, ...props }, ref) => (
  <BaseButton ref={ref} className={cn('platform-v2-btn', className)} {...props} />
));

Button.displayName = 'PlatformV2Button';
