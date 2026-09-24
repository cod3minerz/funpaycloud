'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthShell } from '@/auth/components/AuthShell';
import { Button, Field, Input, Text } from '@/design-system';
import { Loader2 } from '@/shared/streamline/icons';
import { authApi } from '@/lib/api';
import { sanitizeInput, validateEmail } from '@/lib/sanitize';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('oauth_error');
    if (!oauthError) return;
    toast.error(oauthError);
    params.delete('oauth_error');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, []);

  function validate() {
    const errors: { email?: string; password?: string } = {};
    if (!validateEmail(email)) errors.email = 'Введите корректный email';
    if (!password.trim()) errors.password = 'Введите пароль';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.login(sanitizeInput(email), sanitizeInput(password));
      router.push('/platform/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return <AuthShell title="Вход" subtitle="Продолжите работу с аккаунтами и автоматизацией."><form onSubmit={handleLogin} className="auth-form"><Field label="Email" error={fieldErrors.email}><Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} error={Boolean(fieldErrors.email)} /></Field><Field label={<span className="auth-form__row"><span>Пароль</span><Link href="/auth/forgot" className="auth-form__link">Забыли пароль?</Link></span>} error={fieldErrors.password}><Input type="password" autoComplete="current-password" placeholder="Введите пароль" value={password} onChange={event => setPassword(event.target.value)} error={Boolean(fieldErrors.password)} /></Field><Button type="submit" block size="lg" disabled={loading} startIcon={loading ? <Loader2 size={17} className="auth-spinner" /> : undefined}>{loading ? 'Входим' : 'Войти'}</Button><Text size="sm" className="auth-form__footer">Нет аккаунта? <Link href="/auth/register" className="auth-form__link">Зарегистрироваться</Link></Text></form></AuthShell>;
}
