import type { ReactNode } from 'react';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="landing legal-scope">
      <LandingNav homeAnchors />
      <main className="legal-main">
        <div className="wrap">{children}</div>
      </main>
      <LandingFooter />
    </div>
  );
}

