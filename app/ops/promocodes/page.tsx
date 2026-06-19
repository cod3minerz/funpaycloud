'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Ticket, XCircle } from 'lucide-react';
import { adminApi, AdminPromoCode } from '@/lib/api';
import { Card, CardContent } from '@/platform2/components/ui/card';
import Alert from '@/platform2/components/ui/alert/Alert';
import Checkbox from '@/platform2/components/form/input/Checkbox';
import Badge from '@/platform2/components/ui/badge/Badge';
import Button from '@/platform2/components/ui/button/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/platform2/components/ui/table';
import Input from '@/platform2/components/form/input/InputField';
import { Select } from '@/platform2/components/form/Select';
import Label from '@/platform2/components/form/Label';

type ValidityPreset = 'day' | 'week' | 'month' | 'custom';
type RewardType = 'plan' | 'ai_messages';

type FormState = {
  code: string; generate: boolean; validityPreset: ValidityPreset; expiresAt: string;
  rewardType: RewardType; rewardPlan: 'lite' | 'pro' | 'ultra'; rewardAiMessages: string;
};

const initialForm: FormState = {
  code: '', generate: true, validityPreset: 'month', expiresAt: '',
  rewardType: 'plan', rewardPlan: 'pro', rewardAiMessages: '500',
};

function statusBadgeColor(status: string): 'success' | 'error' | 'warning' | 'light' {
  if (status === 'active') return 'success';
  if (status === 'deactivated') return 'error';
  if (status === 'expired') return 'warning';
  return 'light';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = { active: 'Активен', deactivated: 'Деактивирован', expired: 'Истёк', used: 'Использован' };
  return map[status] ?? status;
}

function rewardLabel(item: AdminPromoCode): string {
  if (item.reward_type === 'plan') return `${String(item.reward_plan || '').toUpperCase()} · ${item.duration_days} дн.`;
  return `+${item.reward_ai_messages} AI`;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU');
}

export default function AdminPromoCodesPage() {
  const [items, setItems] = useState<AdminPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.promoCodes();
      setItems(Array.isArray(result.items) ? result.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить промокоды');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const payload = useMemo(() => ({
    code: form.generate ? undefined : form.code.trim() || undefined,
    generate: form.generate,
    validity_preset: form.validityPreset,
    expires_at: form.validityPreset === 'custom' && form.expiresAt
      ? new Date(`${form.expiresAt}T23:59:59Z`).toISOString() : undefined,
    reward_type: form.rewardType,
    reward_plan: form.rewardType === 'plan' ? form.rewardPlan : undefined,
    reward_ai_messages: form.rewardType === 'ai_messages' ? Number(form.rewardAiMessages) || 0 : undefined,
    duration_days: form.rewardType === 'plan' ? 30 : undefined,
  }), [form]);

  async function submit() {
    if (!form.generate && form.code.trim().length < 4) { setError('Код должен содержать минимум 4 символа'); return; }
    if (form.rewardType === 'ai_messages' && (Number(form.rewardAiMessages) || 0) <= 0) { setError('Укажите количество AI сообщений больше 0'); return; }
    setSaving(true);
    setError(null);
    try {
      await adminApi.createPromoCode(payload);
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать промокод');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: number) {
    try {
      await adminApi.deactivatePromoCode(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось деактивировать промокод');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Промокоды</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Создавайте коды на тарифы или AI-сообщения. Один код может быть использован только одним пользователем.
        </p>
      </div>

      {error && <Alert variant="error" title="Ошибка" message={error} />}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">Создать промокод</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <Checkbox
                label="Сгенерировать автоматически"
                checked={form.generate}
                onChange={checked => setForm(p => ({ ...p, generate: checked }))}
              />
            </div>
            <div>
              <Label>Код <span className="font-normal text-gray-400">(если не генерация)</span></Label>
              <Input placeholder="Код" value={form.code} disabled={form.generate}
                onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <Label>Срок действия</Label>
              <Select value={form.validityPreset} onChange={val => setForm(p => ({ ...p, validityPreset: val as ValidityPreset }))}>
                <option value="day">1 день</option>
                <option value="week">1 неделя</option>
                <option value="month">1 месяц</option>
                <option value="custom">До даты</option>
              </Select>
            </div>
            <div>
              <Label>Дата истечения</Label>
              <Input type="date" value={form.expiresAt} disabled={form.validityPreset !== 'custom'}
                onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
            </div>
            <div>
              <Label>Тип награды</Label>
              <Select value={form.rewardType} onChange={val => setForm(p => ({ ...p, rewardType: val as RewardType }))}>
                <option value="plan">Тариф</option>
                <option value="ai_messages">AI сообщения</option>
              </Select>
            </div>
            {form.rewardType === 'plan' ? (
              <div>
                <Label>Тариф</Label>
                <Select value={form.rewardPlan} onChange={val => setForm(p => ({ ...p, rewardPlan: val as FormState['rewardPlan'] }))}>
                  <option value="lite">Lite (30 дней)</option>
                  <option value="pro">Pro (30 дней)</option>
                  <option value="ultra">Ultra (30 дней)</option>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Количество AI сообщений</Label>
                <Input type="number" min="1" placeholder="500" value={form.rewardAiMessages}
                  onChange={e => setForm(p => ({ ...p, rewardAiMessages: e.target.value }))} />
              </div>
            )}
          </div>
          <div className="mt-4">
            <Button startIcon={saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              onClick={submit} disabled={saving}>
              Создать промокод
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">Промокоды пока не созданы.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-900">
                  <TableRow>
                    {['Код', 'Награда', 'Статус', 'Истекает', 'Использовал', 'Действие'].map(h => (
                      <TableCell key={h} isHeader className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="px-4 py-3 font-semibold text-sm text-gray-800 dark:text-gray-200">
                        <span className="inline-flex items-center gap-1.5">
                          <Ticket size={12} className="text-brand-500" />{item.code}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{rewardLabel(item)}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="light" color={statusBadgeColor(item.status)} size="sm">{statusLabel(item.status)}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(item.expires_at)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.redeemed_by_email || '—'}</TableCell>
                      <TableCell className="px-4 py-3">
                        {item.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            startIcon={<XCircle className="h-3 w-3" />}
                            onClick={() => deactivate(item.id)}
                            className="border-error-200 text-error-600 hover:bg-error-50 dark:border-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10"
                          >
                            Деактивировать
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
