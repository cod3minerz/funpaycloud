'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthShell } from '@/auth/components/AuthShell';
import { Button, Field, Input, Text } from '@/design-system';
import { Loader2 } from '@/shared/streamline/icons';
import { authApi } from '@/lib/api';
import { sanitizeInput, validateEmail } from '@/lib/sanitize';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = sanitizeInput(email).toLowerCase();
    if (!validateEmail(normalized)) { setError('Введите корректный email'); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(normalized);
      toast.success('Код восстановления отправлен');
      router.push(`/auth/verify?mode=reset&email=${encodeURIComponent(normalized)}`);
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Не удалось отправить код');
    } finally { setLoading(false); }
  }

  return <AuthShell title="Восстановление" subtitle="Отправим код на email, привязанный к аккаунту."><form onSubmit={handleSubmit} className="auth-form"><Field label="Email" error={error}><Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} error={Boolean(error)} /></Field><Button type="submit" block size="lg" disabled={loading} startIcon={loading ? <Loader2 size={17} className="auth-spinner" /> : undefined}>{loading ? 'Отправляем' : 'Отправить код'}</Button><Text size="sm" className="auth-form__footer"><Link href="/auth/login" className="auth-form__link">Вернуться ко входу</Link></Text></form></AuthShell>;
}
