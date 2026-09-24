'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from '@/shared/streamline/icons';
import { storeReferralCode } from '@/lib/referral';
import { PublicPageRoot } from '@/public/PublicShell';
import { Card, Heading, Stack, Text } from '@/design-system';

export default function ReferralRedirectPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    const code = String(params?.code || '');
    storeReferralCode(code);
    router.replace('/auth/register');
  }, [params?.code, router]);

  return (
    <PublicPageRoot defaultTheme="dark" className="system-page">
      <Card className="system-state">
        <Stack gap={4}>
          <Loader2 size={28} className="system-state__spinner" />
          <Heading as="h1" size="h3">Почти готово</Heading>
          <Text tone="muted">Сохраняем приглашение и открываем регистрацию.</Text>
        </Stack>
      </Card>
    </PublicPageRoot>
  );
}
