"use client";

import Link from 'next/link';
import { Badge, Card, CardContent, Heading, PublicThemeRoot, Stack, Text } from '@/design-system';
import { BrandLogo } from '@/public/PublicShell';
import { VariantBoundary, VariantProvider } from '@/public/variants';
import { PUBLIC_VARIANT_DEFAULTS } from '@/public/variant-defaults';
import { Activity, Bot, ShieldCheck } from '@/shared/streamline/icons';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <PublicThemeRoot defaultTheme="dark" className="auth-redesign"><VariantProvider defaults={PUBLIC_VARIANT_DEFAULTS.auth}><VariantBoundary id="auth-shell"><main className="auth-shell"><section className="auth-shell__context"><BrandLogo /><Stack gap={6}><Badge tone="success">Платформа работает</Badge><Heading as="h2" size="h1">Автоматизация, к которой можно вернуться с любого устройства</Heading><Text size="lead">Аккаунты, чаты, выдача и контроль операций остаются в облаке круглосуточно.</Text><Stack gap={3}><AuthPoint icon={<Bot size={19} />} title="ИИ помнит контекст диалога" /><AuthPoint icon={<Activity size={19} />} title="Воркеры и прокси под наблюдением" /><AuthPoint icon={<ShieldCheck size={19} />} title="Секреты хранятся в зашифрованном виде" /></Stack></Stack></section><section className="auth-shell__form"><div className="auth-shell__mobile-logo"><BrandLogo /></div><Card raised><CardContent><Stack gap={6}><div><Heading as="h1" size="h2">{title}</Heading><Text>{subtitle}</Text></div>{children}</Stack></CardContent></Card><Text size="sm" tone="muted" className="auth-legal">Продолжая, вы принимаете <Link href="/legal/terms">Условия использования</Link> и <Link href="/legal/privacy">Политику конфиденциальности</Link>.</Text></section></main></VariantBoundary></VariantProvider></PublicThemeRoot>
  );
}

function AuthPoint({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="auth-point"><span>{icon}</span><strong>{title}</strong></div>;
}
