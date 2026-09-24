'use client';

import { type FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AuthShell } from '@/auth/components/AuthShell';
import { Button, Checkbox, Field, Input, Text } from '@/design-system';
import { Loader2 } from '@/shared/streamline/icons';
import { authApi } from '@/lib/api';
import { readStoredReferralCode, storeReferralCode } from '@/lib/referral';
import { sanitizeInput, validateEmail, validatePassword } from '@/lib/sanitize';

function strengthScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  return score;
}

const strengthLabels = ['', 'Слабый', 'Хороший', 'Надёжный'];
const strengthTones = ['', 'weak', 'good', 'strong'];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasPromo, setHasPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const score = useMemo(() => strengthScore(password), [password]);

  useEffect(() => {
    const fromUrl = (searchParams.get('ref') || '').trim();
    setReferralCode(fromUrl ? storeReferralCode(fromUrl) : readStoredReferralCode());
  }, [searchParams]);

  useEffect(() => {
    const oauthError = (searchParams.get('oauth_error') || '').trim();
    if (!oauthError) return;
    toast.error(oauthError);
    const params = new URLSearchParams(window.location.search);
    params.delete('oauth_error');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [searchParams]);

  function validate() {
    const errors: { email?: string; password?: string; confirm?: string } = {};
    if (!validateEmail(email)) errors.email = 'Введите корректный email';
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) errors.password = passwordCheck.error;
    if (password !== confirmPassword) errors.confirm = 'Пароли не совпадают';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.register(sanitizeInput(email), sanitizeInput(password), { referral_code: referralCode || undefined, promo_code: promoCode ? sanitizeInput(promoCode) : undefined });
      router.push(`/auth/verify?mode=register&email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка регистрации';
      if (message.toLowerCase().includes('почта уже зарегистрирована')) setFieldErrors(current => ({ ...current, email: 'Почта уже зарегистрирована. Войдите в аккаунт.' }));
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return <AuthShell title="Регистрация" subtitle="Создайте аккаунт и запустите автоматизацию FunPay."><form onSubmit={handleRegister} className="auth-form"><Field label="Email" error={fieldErrors.email}><Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} error={Boolean(fieldErrors.email)} /></Field><Field label="Пароль" error={fieldErrors.password}><Input type="password" autoComplete="new-password" placeholder="Минимум 8 символов" value={password} onChange={event => setPassword(event.target.value)} error={Boolean(fieldErrors.password)} /></Field>{password ? <div className="auth-strength"><div className="auth-strength__bars">{[1, 2, 3].map(value => <span key={value} className="auth-strength__bar" data-active={score >= value ? strengthTones[score] : undefined} />)}</div><Text size="sm" tone="muted">{strengthLabels[score]}</Text></div> : null}<Field label="Повторите пароль" error={fieldErrors.confirm}><Input type="password" autoComplete="new-password" placeholder="Повторите пароль" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} error={Boolean(fieldErrors.confirm)} /></Field><Checkbox label="Есть промокод" checked={hasPromo} onChange={event => setHasPromo(event.target.checked)} />{hasPromo ? <Field label="Промокод"><Input value={promoCode} onChange={event => setPromoCode(event.target.value)} placeholder="Введите промокод" /></Field> : null}<Button type="submit" block size="lg" disabled={loading} startIcon={loading ? <Loader2 size={17} className="auth-spinner" /> : undefined}>{loading ? 'Создаём аккаунт' : 'Создать аккаунт'}</Button><Text size="sm" className="auth-form__footer">Уже есть аккаунт? <Link href="/auth/login" className="auth-form__link">Войти</Link></Text></form></AuthShell>;
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
