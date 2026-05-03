'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { storeReferralCode } from '@/lib/referral';

export default function ReferralRedirectPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    const code = String(params?.code || '');
    storeReferralCode(code);
    router.replace('/auth/register');
  }, [params?.code, router]);

  return (
    <div className="landing flex min-h-[100dvh] items-center justify-center bg-[var(--bg)] text-[var(--ink)]">
      <div className="inline-flex items-center gap-2 text-sm text-[var(--ink-2)]">
        <Loader2 size={16} className="animate-spin" />
        Перенаправляем на регистрацию...
      </div>
    </div>
  );
}
