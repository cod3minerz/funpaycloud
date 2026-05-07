'use client';

import '@/styles/platform-v2.css';
import PlatformFrame from '@/platform/layout/PlatformFrame';

export default function PlatformV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformFrame basePath="/platform-v2" scopeClassName="platform-v2-scope">
      {children}
    </PlatformFrame>
  );
}
