import * as React from 'react';
import { Card as BaseCard, CardContent as BaseCardContent, CardDescription as BaseCardDescription, CardFooter as BaseCardFooter, CardHeader as BaseCardHeader, CardTitle as BaseCardTitle } from '@/app/components/ui/card';
import { cn } from '@/app/components/ui/utils';

export const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof BaseCard>>(({ className, ...props }, ref) => (
  <BaseCard ref={ref} className={cn('platform-v2-card', className)} {...props} />
));
Card.displayName = 'PlatformV2Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof BaseCardHeader>>(({ className, ...props }, ref) => (
  <BaseCardHeader ref={ref} className={cn('platform-v2-card-header', className)} {...props} />
));
CardHeader.displayName = 'PlatformV2CardHeader';

export const CardTitle = BaseCardTitle;
export const CardDescription = BaseCardDescription;
export const CardContent = BaseCardContent;
export const CardFooter = BaseCardFooter;
