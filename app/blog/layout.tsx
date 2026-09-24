import type { ReactNode } from 'react';
import { PublicFooter, PublicHeader, PublicPageRoot } from '@/public/PublicShell';
import { VariantProvider } from '@/public/variants';
import { PUBLIC_VARIANT_DEFAULTS } from '@/public/variant-defaults';

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <PublicPageRoot defaultTheme="light" className="blog-redesign"><VariantProvider defaults={PUBLIC_VARIANT_DEFAULTS.blog}><PublicHeader compact showThemeToggle blog /><main>{children}</main><PublicFooter blog /></VariantProvider></PublicPageRoot>
  );
}
