import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CircleCheck, CircleOff, Plus, Search, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Account, accounts as initialAccounts } from '@/platform/data/demoData';
import {
  DataTableWrap,
  EmptyState,
  KpiCard,
  KpiGrid,
  PageHeader,
  PageShell,
  PageTitle,
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

export default function Accounts() {
  const [list, setList] = useState<Account[]>(initialAccounts);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: '', balance: '' });

  const filtered = useMemo(() => {
    return list.filter(acc => {
      if (statusFilter === 'online' && !acc.online) return false;
      if (statusFilter === 'offline' && acc.online) return false;
      if (query && !acc.username.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [list, query, statusFilter]);

  function createAccount() {
    const username = form.username.trim();
    const balance = Number(form.balance);
    if (!username || Number.isNaN(balance)) return;

    setList(prev => [
      {
        id: `acc-${Date.now()}`,
        username,
        avatar: username[0]?.toUpperCase() ?? 'U',
        balance,
        lotsCount: 0,
        online: true,
        rating: 4.8,
        sales: 0,
        verified: false,
      },
      ...prev,
    ]);

    setForm({ username: '', balance: '' });
    setShowCreate(false);
  }

  function toggleStatus(id: string) {
    setList(prev => prev.map(acc => (acc.id === id ? { ...acc, online: !acc.online } : acc)));
  }

  function removeAccount(id: string) {
    setList(prev => prev.filter(acc => acc.id !== id));
  }

  const verifiedCount = list.filter(a => a.verified).length;
  const onlineCount = list.filter(a => a.online).length;
  const offlineCount = list.filter(a => !a.online).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Аккаунты"
            subtitle="Управление фермами аккаунтов: статусы, баланс, рейтинг и операционные действия в одном месте."
          />
          <button className="platform-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Добавить аккаунт
          </button>
        </PageHeader>

        <KpiGrid>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <ShieldCheck size={15} color="#4ade80" />
              Верифицированы
            </div>
            <strong className="text-[26px]">{verifiedCount}</strong>
            <span className="platform-kpi-meta">Подтвержденные аккаунты</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <CircleCheck size={15} color="#4ade80" />
              Онлайн
            </div>
            <strong className="text-[26px]">{onlineCount}</strong>
            <span className="platform-kpi-meta">Аккаунты доступны сейчас</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
              <CircleOff size={15} color="#fbbf24" />
              Оффлайн
            </div>
            <strong className="text-[26px]">{offlineCount}</strong>
            <span className="platform-kpi-meta">Требуется проверка</span>
          </KpiCard>
          <KpiCard>
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold">Баланс аккаунтов</div>
            <strong className="text-[26px]">
              {list.reduce((sum, item) => sum + item.balance, 0).toLocaleString('ru-RU')} ₽
            </strong>
            <span className="platform-kpi-meta">Суммарный доступный остаток</span>
          </KpiCard>
        </KpiGrid>

        <SectionCard>
          <ToolbarRow>
            <label className="platform-search platform-toolbar-grow max-w-none">
              <Search size={14} color="var(--pf-text-dim)" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Поиск по логину аккаунта"
                aria-label="Поиск аккаунта"
              />
            </label>

            <select
              className="platform-select"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
              style={{ maxWidth: 220 }}
            >
              <option value="all">Все статусы</option>
              <option value="online">Онлайн</option>
              <option value="offline">Оффлайн</option>
            </select>

            <button className="platform-btn-secondary">Импорт CSV</button>
          </ToolbarRow>
        </SectionCard>

        <SectionCard className="p-0">
          <div className="platform-desktop-table">
            <DataTableWrap>
              <table className="platform-table" style={{ minWidth: 840 }}>
                <thead>
                  <tr>
                    <th style={{ width: 270 }}>Аккаунт</th>
                    <th>Статус</th>
                    <th style={{ textAlign: 'right' }}>Баланс</th>
                    <th style={{ textAlign: 'right' }}>Лоты</th>
                    <th style={{ textAlign: 'right' }}>Продажи</th>
                    <th style={{ textAlign: 'right' }}>Рейтинг</th>
                    <th style={{ textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(acc => (
                    <tr key={acc.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="platform-avatar">{acc.avatar}</span>
                          <div>
                            <div className="font-semibold">{acc.username}</div>
                            <div className="text-[12px] text-[var(--pf-text-muted)]">
                              {acc.verified ? 'Верифицирован' : 'Требует верификации'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={acc.online ? 'badge-active' : 'badge-inactive'}>
                          {acc.online ? 'Онлайн' : 'Оффлайн'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{acc.balance.toLocaleString('ru-RU')} ₽</td>
                      <td style={{ textAlign: 'right', color: 'var(--pf-text-muted)' }}>{acc.lotsCount}</td>
                      <td style={{ textAlign: 'right', color: 'var(--pf-text-muted)' }}>{acc.sales}</td>
                      <td style={{ textAlign: 'right', color: 'var(--pf-text-muted)' }}>
                        <span className="inline-flex items-center gap-1">
                          <Star size={12} color="#f5b94c" />
                          {acc.rating.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="inline-flex items-center gap-2">
                          <button className="platform-topbar-btn" onClick={() => toggleStatus(acc.id)} aria-label="Переключить статус">
                            {acc.online ? <CircleOff size={15} /> : <CircleCheck size={15} />}
                          </button>
                          <button className="platform-topbar-btn" onClick={() => removeAccount(acc.id)} aria-label="Удалить аккаунт">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableWrap>
          </div>

          <div className="platform-mobile-cards">
            {filtered.map(acc => (
              <article key={acc.id} className="platform-mobile-card">
                <div className="platform-mobile-card-head">
                  <div className="inline-flex items-center gap-2">
                    <span className="platform-avatar">{acc.avatar}</span>
                    <div>
                      <div className="text-[13px] font-semibold">{acc.username}</div>
                      <div className="text-[12px] text-[var(--pf-text-muted)]">
                        {acc.verified ? 'Верифицирован' : 'Требует верификации'}
                      </div>
                    </div>
                  </div>
                  <span className={acc.online ? 'badge-active' : 'badge-inactive'}>
                    {acc.online ? 'Онлайн' : 'Оффлайн'}
                  </span>
                </div>

                <div className="platform-mobile-meta">
                  <span>Баланс: {acc.balance.toLocaleString('ru-RU')} ₽</span>
                  <span>Лоты: {acc.lotsCount}</span>
                  <span>Продажи: {acc.sales}</span>
                  <span>Рейтинг: {acc.rating.toFixed(1)}</span>
                </div>

                <div className="platform-mobile-actions">
                  <button className="platform-btn-secondary" onClick={() => toggleStatus(acc.id)}>
                    {acc.online ? <CircleOff size={14} /> : <CircleCheck size={14} />}
                    {acc.online ? 'Оффлайн' : 'Онлайн'}
                  </button>
                  <button className="platform-topbar-btn" onClick={() => removeAccount(acc.id)} aria-label="Удалить аккаунт">
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && <EmptyState>По текущим фильтрам аккаунты не найдены.</EmptyState>}
        </SectionCard>
      </PageShell>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="platform-dialog-content" style={{ maxWidth: 460 }}>
          <DialogHeader>
            <DialogTitle>Новый аккаунт</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[var(--pf-text-muted)]">
            Добавьте аккаунт в ферму и сразу включите его в автоматизацию.
          </p>
          <div className="grid gap-3">
            <input
              className="platform-input"
              value={form.username}
              onChange={event => setForm(prev => ({ ...prev, username: event.target.value }))}
              placeholder="Логин аккаунта"
            />
            <input
              className="platform-input"
              value={form.balance}
              onChange={event => setForm(prev => ({ ...prev, balance: event.target.value }))}
              placeholder="Баланс, ₽"
              inputMode="numeric"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button className="platform-btn-secondary flex-1" onClick={() => setShowCreate(false)}>
              Отмена
            </button>
            <button className="platform-btn-primary flex-1" onClick={createAccount}>
              Создать
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
