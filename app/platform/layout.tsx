'use client';

import PlatformFrame from '@/platform/layout/PlatformFrame';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformFrame basePath="/platform">{children}</PlatformFrame>;
}
