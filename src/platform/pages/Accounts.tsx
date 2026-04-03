import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, ShieldCheck, CircleOff, CircleCheck, Trash2 } from 'lucide-react';
import { accounts as initialAccounts, Account } from '@/platform/data/demoData';

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
    const avatar = username[0]?.toUpperCase() ?? 'U';

    setList(prev => [
      {
        id: `acc-${Date.now()}`,
        username,
        avatar,
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} style={{ paddingTop: 18 }}>
      <section className="platform-card" style={{ marginBottom: 18 }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="platform-page-title">Управление аккаунтами</h1>
            <p className="platform-page-subtitle">
              Добавляйте аккаунты и формируйте фермы, контролируйте статусы, баланс и эффективность из одного места.
            </p>
          </div>
          <button className="platform-btn-primary inline-flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Добавить аккаунт
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <label className="platform-search max-w-none" style={{ minHeight: 40 }}>
            <Search size={15} color="var(--pf-text-dim)" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по логину..."
              aria-label="Поиск аккаунта"
            />
          </label>
          <select className="platform-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">Все статусы</option>
            <option value="online">Онлайн</option>
            <option value="offline">Оффлайн</option>
          </select>
          <button className="platform-btn-secondary">Импорт CSV</button>
        </div>
      </section>

      <section className="platform-card" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)', fontSize: 12 }}>
              <th style={{ textAlign: 'left', padding: '12px 10px', fontWeight: 700 }}>Аккаунт</th>
              <th style={{ textAlign: 'left', padding: '12px 10px', fontWeight: 700 }}>Статус</th>
              <th style={{ textAlign: 'left', padding: '12px 10px', fontWeight: 700 }}>Баланс</th>
              <th style={{ textAlign: 'left', padding: '12px 10px', fontWeight: 700 }}>Лоты</th>
              <th style={{ textAlign: 'left', padding: '12px 10px', fontWeight: 700 }}>Продажи</th>
              <th style={{ textAlign: 'left', padding: '12px 10px', fontWeight: 700 }}>Рейтинг</th>
              <th style={{ textAlign: 'right', padding: '12px 10px', fontWeight: 700 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(acc => (
              <tr key={acc.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                <td style={{ padding: '12px 10px' }}>
                  <div className="flex items-center gap-3">
                    <span className="platform-avatar">{acc.avatar}</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{acc.username}</div>
                      <div style={{ fontSize: 12, color: 'var(--pf-text-muted)' }}>
                        {acc.verified ? 'Верифицирован' : 'Требует верификации'}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <span className={acc.online ? 'badge-active' : 'badge-inactive'}>
                    {acc.online ? 'Онлайн' : 'Оффлайн'}
                  </span>
                </td>
                <td style={{ padding: '12px 10px', fontWeight: 700 }}>{acc.balance.toLocaleString('ru-RU')} ₽</td>
                <td style={{ padding: '12px 10px', color: 'var(--pf-text-muted)' }}>{acc.lotsCount}</td>
                <td style={{ padding: '12px 10px', color: 'var(--pf-text-muted)' }}>{acc.sales}</td>
                <td style={{ padding: '12px 10px', color: 'var(--pf-text-muted)' }}>⭐ {acc.rating.toFixed(1)}</td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>
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

        {filtered.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--pf-text-muted)' }}>
            По текущим фильтрам аккаунты не найдены.
          </div>
        )}
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <article className="platform-card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={18} color="#4ade80" />
          <div>
            <div style={{ fontWeight: 700 }}>{list.filter(a => a.verified).length} аккаунтов</div>
            <div style={{ color: 'var(--pf-text-muted)', fontSize: 13 }}>Верифицировано</div>
          </div>
        </article>
        <article className="platform-card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CircleCheck size={18} color="#4ade80" />
          <div>
            <div style={{ fontWeight: 700 }}>{list.filter(a => a.online).length} онлайн</div>
            <div style={{ color: 'var(--pf-text-muted)', fontSize: 13 }}>Активно сейчас</div>
          </div>
        </article>
        <article className="platform-card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CircleOff size={18} color="#fbbf24" />
          <div>
            <div style={{ fontWeight: 700 }}>{list.filter(a => !a.online).length} оффлайн</div>
            <div style={{ color: 'var(--pf-text-muted)', fontSize: 13 }}>Нужна проверка</div>
          </div>
        </article>
      </section>

      {showCreate && (
        <div className="platform-mobile-overlay" style={{ zIndex: 80, display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="platform-card" style={{ width: '100%', maxWidth: 460 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Новый аккаунт</h2>
            <p style={{ margin: '8px 0 14px', color: 'var(--pf-text-muted)', fontSize: 14 }}>
              Добавьте аккаунт в ферму и сразу включите его в автоматизацию.
            </p>
            <div className="space-y-3">
              <input
                className="platform-input"
                value={form.username}
                onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Логин аккаунта"
              />
              <input
                className="platform-input"
                value={form.balance}
                onChange={e => setForm(prev => ({ ...prev, balance: e.target.value }))}
                placeholder="Баланс, ₽"
                inputMode="numeric"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button className="platform-btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>
                Отмена
              </button>
              <button className="platform-btn-primary" style={{ flex: 1 }} onClick={createAccount}>
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
