'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, SegmentedControl } from '@/design-system';
import { Copy } from '@/shared/streamline/icons';

export type PublicVariant = 'a' | 'b' | 'c';
export type SectionVariantConfig = Record<string, PublicVariant>;

const STORAGE_KEY = 'fpc-public-variants';
const VariantContext = createContext<{ config: SectionVariantConfig; setVariant: (id: string, variant: PublicVariant) => void } | null>(null);

function readConfig(defaults: SectionVariantConfig): SectionVariantConfig {
  if (typeof window === 'undefined') return defaults;
  try {
    const fromUrl = new URL(window.location.href).searchParams.get('variants');
    const source = fromUrl ?? window.localStorage.getItem(STORAGE_KEY);
    return source ? { ...defaults, ...JSON.parse(source) } : defaults;
  } catch {
    return defaults;
  }
}

export function VariantProvider({ defaults, children }: { defaults: SectionVariantConfig; children: ReactNode }) {
  const [config, setConfig] = useState<SectionVariantConfig>(defaults);
  useEffect(() => setConfig(readConfig(defaults)), [defaults]);

  const setVariant = useCallback((id: string, variant: PublicVariant) => {
    setConfig(current => {
      const next = { ...current, [id]: variant };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ config, setVariant }), [config, setVariant]);
  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>;
}

export function VariantBoundary({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const context = useContext(VariantContext);
  const variant = context?.config[id] ?? 'a';
  return <div className={className} data-section={id} data-variant={variant}>{process.env.NODE_ENV === 'development' ? <div className="public-variant-control"><span>{id}</span><SegmentedControl label={`Вариант секции ${id}`} value={variant} options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }]} onChange={value => context?.setVariant(id, value as PublicVariant)} /></div> : null}{children}</div>;
}

export function VariantExportButton() {
  const context = useContext(VariantContext);
  if (process.env.NODE_ENV !== 'development') return null;
  return <Button variant="secondary" size="sm" startIcon={<Copy size={16} />} onClick={() => navigator.clipboard.writeText(JSON.stringify(context?.config ?? {}, null, 2))}>Скопировать конфигурацию</Button>;
}
