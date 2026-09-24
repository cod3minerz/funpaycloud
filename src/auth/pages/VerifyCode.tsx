'use client';

import { type ClipboardEvent, type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthShell } from '@/auth/components/AuthShell';
import { Badge, Button, Input, Stack, Text } from '@/design-system';
import { Loader2, RotateCcw } from '@/shared/streamline/icons';
import { authApi } from '@/lib/api';
import { clearStoredReferralCode } from '@/lib/referral';

function maskEmail(email: string) {
  const normalized = email.trim() || 'user@funpay.cloud';
  const [name, domain] = normalized.split('@');
  if (!domain) return normalized;
  return `${name.length <= 2 ? `${name[0] || '*'}*` : `${name.slice(0, 2)}***`}@${domain}`;
}

export default function VerifyCodePage({ email: rawEmail, mode: rawMode }: { email?: string; mode?: string }) {
  const router = useRouter();
  const email = rawEmail || 'user@funpay.cloud';
  const mode = rawMode === 'reset' ? 'reset' : 'register';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(25);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);
  useEffect(() => { if (seconds <= 0) return; const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [seconds]);

  function setDigit(index: number, value: string) {
    const number = value.replace(/\D/g, '').slice(-1);
    setDigits(current => current.map((digit, position) => position === index ? number : digit));
    if (number && index < 5) inputRefs.current[index + 1]?.focus();
  }
  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); inputRefs.current[index - 1]?.focus(); }
    if (event.key === 'ArrowRight' && index < 5) { event.preventDefault(); inputRefs.current[index + 1]?.focus(); }
  }
  function handlePaste(event: ClipboardEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (!values.length) return;
    setDigits(current => current.map((digit, index) => values[index] ?? digit));
    inputRefs.current[Math.min(values.length, 5)]?.focus();
  }
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const code = digits.join('');
    if (code.length < 6) { toast.error('Введите 6-значный код'); return; }
    setLoading(true);
    try {
      if (mode === 'reset') {
        const data = await authApi.verifyResetCode(email, code);
        router.push(`/auth/reset?token=${encodeURIComponent(data.reset_token)}`);
      } else {
        await authApi.verify(email, code);
        clearStoredReferralCode();
        router.push('/platform/dashboard');
      }
    } catch (requestError) { toast.error(requestError instanceof Error ? requestError.message : 'Неверный код'); }
    finally { setLoading(false); }
  }
  async function handleResend() {
    setResendLoading(true);
    try { await authApi.resendCode(email, mode); toast.success('Код отправлен повторно'); setSeconds(25); setDigits(['', '', '', '', '', '']); inputRefs.current[0]?.focus(); }
    catch (requestError) { toast.error(requestError instanceof Error ? requestError.message : 'Не удалось отправить код'); }
    finally { setResendLoading(false); }
  }

  return <AuthShell title={mode === 'reset' ? 'Код восстановления' : 'Код подтверждения'} subtitle="Введите шесть цифр из письма."><form onSubmit={handleSubmit} onPaste={handlePaste} className="auth-form"><Badge tone="neutral">Код отправлен на {maskEmail(email)}</Badge><div className="auth-code-grid">{digits.map((value, index) => <Input key={index} ref={element => { inputRefs.current[index] = element; }} value={value} onChange={event => setDigit(index, event.target.value)} onKeyDown={event => handleKeyDown(index, event)} maxLength={1} inputMode="numeric" aria-label={`Цифра ${index + 1}`} />)}</div><Button type="submit" block size="lg" disabled={loading} startIcon={loading ? <Loader2 size={17} className="auth-spinner" /> : undefined}>{loading ? 'Проверяем' : mode === 'reset' ? 'Продолжить' : 'Подтвердить'}</Button><Stack gap={2}><Button type="button" variant="ghost" disabled={seconds > 0 || resendLoading} onClick={handleResend} startIcon={resendLoading ? <Loader2 size={15} className="auth-spinner" /> : <RotateCcw size={15} />}>{seconds > 0 ? `Повторно через ${seconds}с` : 'Отправить код повторно'}</Button><Text size="sm" className="auth-form__footer"><Link href={mode === 'reset' ? '/auth/forgot' : '/auth/register'} className="auth-form__link">Изменить email</Link></Text><Text size="sm" tone="muted" className="auth-form__footer">Если письма нет, проверьте папку «Спам».</Text></Stack></form></AuthShell>;
}
