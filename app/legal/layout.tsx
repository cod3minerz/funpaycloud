import type { ReactNode } from 'react';
import { PublicFooter, PublicHeader, PublicPageRoot } from '@/public/PublicShell';
import { VariantProvider } from '@/public/variants';
import { PUBLIC_VARIANT_DEFAULTS } from '@/public/variant-defaults';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <PublicPageRoot defaultTheme="light" className="public-page legal-page">
      <VariantProvider defaults={PUBLIC_VARIANT_DEFAULTS.legal}>
        <PublicHeader compact />
        <main className="legal-main">{children}</main>
        <PublicFooter />
      </VariantProvider>
    </PublicPageRoot>
  );
}
