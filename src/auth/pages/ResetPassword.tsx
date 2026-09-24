'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthShell } from '@/auth/components/AuthShell';
import { Button, Field, Input, Text } from '@/design-system';
import { Loader2 } from '@/shared/streamline/icons';
import { authApi } from '@/lib/api';
import { sanitizeInput, validatePassword } from '@/lib/sanitize';

export default function ResetPasswordPage({ token }: { token?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: { password?: string; confirm?: string } = {};
    const check = validatePassword(password);
    if (!check.valid) nextErrors.password = check.error;
    if (password !== confirmPassword) nextErrors.confirm = 'Пароли не совпадают';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !token) { if (!token) toast.error('Токен восстановления недействителен'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, sanitizeInput(password));
      toast.success('Пароль успешно обновлён');
      router.push('/auth/login');
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Не удалось обновить пароль');
    } finally { setLoading(false); }
  }

  return <AuthShell title="Новый пароль" subtitle="Используйте уникальный пароль, которого нет в других сервисах."><form onSubmit={handleSubmit} className="auth-form"><Field label="Новый пароль" error={errors.password}><Input type="password" autoComplete="new-password" placeholder="Минимум 8 символов" value={password} onChange={event => setPassword(event.target.value)} error={Boolean(errors.password)} /></Field><Field label="Повторите пароль" error={errors.confirm}><Input type="password" autoComplete="new-password" placeholder="Повторите новый пароль" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} error={Boolean(errors.confirm)} /></Field><Button type="submit" block size="lg" disabled={loading || !token} startIcon={loading ? <Loader2 size={17} className="auth-spinner" /> : undefined}>{loading ? 'Сохраняем' : 'Сохранить пароль'}</Button><Text size="sm" className="auth-form__footer"><Link href="/auth/login" className="auth-form__link">Вернуться ко входу</Link></Text></form></AuthShell>;
}
