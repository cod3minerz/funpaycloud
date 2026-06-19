'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { adminApi, AdminSharedProxy } from '@/lib/api';
import { Card, CardContent } from '@/platform2/components/ui/card';
import Alert from '@/platform2/components/ui/alert/Alert';
import Badge from '@/platform2/components/ui/badge/Badge';
import Button from '@/platform2/components/ui/button/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/platform2/components/ui/table';
import Input from '@/platform2/components/form/input/InputField';
import { Select } from '@/platform2/components/form/Select';
import Label from '@/platform2/components/form/Label';

type FormState = {
  host: string; port: string; username: string; password: string;
  protocol: 'HTTP' | 'HTTPS' | 'SOCKS5'; expiresAt: string;
};

const initialForm: FormState = { host: '', port: '', username: '', password: '', protocol: 'HTTP', expiresAt: '' };

function proxyStatus(item: AdminSharedProxy): { label: string; color: 'error' | 'light' | 'warning' | 'success' } {
  const expiresAt = item.expires_at ? new Date(item.expires_at) : null;
  const isExpired = Boolean(expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now());
  if (isExpired) return { label: 'Истёк', color: 'error' };
  if (!item.is_active || item.health_state === 'unhealthy') return { label: 'Недоступен', color: 'light' };
  if (item.health_state === 'degraded') return { label: 'Проблемы', color: 'warning' };
  return { label: 'Активен', color: 'success' };
}

export default function AdminProxiesPage() {
  const [items, setItems] = useState<AdminSharedProxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.sharedProxies();
      setItems(Array.isArray(result.items) ? result.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить shared прокси');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    const host = form.host.trim();
    const port = Number(form.port);
    if (!host || !Number.isFinite(port) || port <= 0 || port > 65535) {
      setError('Укажите корректные host и port');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const expiresISO = form.expiresAt ? new Date(`${form.expiresAt}T23:59:59Z`).toISOString() : undefined;
      await adminApi.addSharedProxy({
        host, port,
        username: form.username.trim() || undefined,
        password: form.password.trim() || undefined,
        protocol: form.protocol,
        expires_at: expiresISO,
      });
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить прокси');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shared прокси</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Бесплатный пул для пользователей. На один прокси можно назначить ограниченное число аккаунтов.
        </p>
      </div>

      {error && <Alert variant="error" title="Ошибка" message={error} />}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">Добавить shared прокси</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Host</Label>
              <Input placeholder="host" value={form.host} onChange={e => setForm(p => ({ ...p, host: e.target.value }))} />
            </div>
            <div>
              <Label>Port</Label>
              <Input placeholder="port" value={form.port} onChange={e => setForm(p => ({ ...p, port: e.target.value }))} />
            </div>
            <div>
              <Label>Username <span className="font-normal text-gray-400">(опционально)</span></Label>
              <Input placeholder="username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
            </div>
            <div>
              <Label>Password <span className="font-normal text-gray-400">(опционально)</span></Label>
              <Input type="password" placeholder="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div>
              <Label>Протокол</Label>
              <Select value={form.protocol} onChange={val => setForm(p => ({ ...p, protocol: val as FormState['protocol'] }))}>
                <option value="HTTP">HTTP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="SOCKS5">SOCKS5</option>
              </Select>
            </div>
            <div>
              <Label>Аренда до</Label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4">
            <Button
              startIcon={saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              onClick={submit}
              disabled={saving}
            >
              Добавить в бесплатный пул
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">Текущий пул</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Shared прокси пока не добавлены.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-900">
                  <TableRow>
                    {['Номер', 'Адрес', 'Protocol', 'Загрузка', 'Аренда до', 'Статус'].map(h => (
                      <TableCell key={h} isHeader className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => {
                    const s = proxyStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200">#{item.shared_number}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.host}:{item.port}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.protocol}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.used_accounts}/{item.max_accounts}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{item.expires_at ? new Date(item.expires_at).toLocaleString('ru-RU') : '—'}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant="light" color={s.color} size="sm">{s.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
