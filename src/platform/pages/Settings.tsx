import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Check, CreditCard, KeyRound, Shield, UserCircle2 } from 'lucide-react';

const tabs = [
  { key: 'profile', label: 'Профиль', icon: UserCircle2 },
  { key: 'notifications', label: 'Уведомления', icon: Bell },
  { key: 'plan', label: 'Подписка', icon: CreditCard },
  { key: 'security', label: 'Безопасность', icon: Shield },
] as const;

const plans = [
  {
    name: 'Старт',
    price: 299,
    current: false,
    features: ['1 аккаунт FunPay', 'Базовая автоматизация', 'Email поддержка'],
  },
  {
    name: 'Про',
    price: 699,
    current: true,
    features: ['3 аккаунта FunPay', 'Полная автоматизация', 'Telegram уведомления', 'Склад 10 000 товаров'],
  },
  {
    name: 'Бизнес',
    price: 1499,
    current: false,
    features: ['10 аккаунтов FunPay', 'API доступ', 'Расширенная аналитика', 'Персональный менеджер'],
  },
];

const sessions = [
  { date: '02.04.2026 14:33', ip: '95.173.116.42', device: 'Chrome / Windows 11', location: 'Москва, RU' },
  { date: '01.04.2026 09:12', ip: '95.173.116.42', device: 'Safari / iPhone', location: 'Москва, RU' },
  { date: '31.03.2026 22:47', ip: '79.139.50.11', device: 'Firefox / Ubuntu', location: 'Санкт-Петербург, RU' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 99,
        border: '1px solid var(--pf-border)',
        background: checked ? 'var(--pf-accent)' : 'rgba(15,23,42,0.8)',
        position: 'relative',
        cursor: 'pointer',
      }}
      aria-label="Переключатель"
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 21 : 2,
          width: 18,
          height: 18,
          borderRadius: 99,
          background: '#fff',
          transition: 'left 0.16s ease',
        }}
      />
    </button>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>('profile');
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    displayName: 'Kirill',
    email: 'kirill@funpay.cloud',
    timezone: 'Europe/Moscow',
    telegram: '@kirill',
  });
  const [passwords, setPasswords] = useState({ old: '', next: '', confirm: '' });
  const [security, setSecurity] = useState({ twoFactor: true, loginAlerts: true, trustedIps: false });
  const [notifications, setNotifications] = useState({
    telegram: true,
    newOrder: true,
    newMessage: true,
    lowStock: true,
    botError: true,
    weeklyReport: false,
  });

  function saveChanges() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} style={{ paddingTop: 18 }}>
      <section className="platform-card" style={{ marginBottom: 16 }}>
        <h1 className="platform-page-title">Настройки платформы</h1>
        <p className="platform-page-subtitle">Профиль, уведомления, тариф и безопасность в одном месте.</p>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={active ? 'platform-btn-primary' : 'platform-btn-secondary'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === 'profile' && (
        <section className="platform-card">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="platform-input"
              placeholder="Имя"
              value={profile.displayName}
              onChange={e => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
            />
            <input
              className="platform-input"
              placeholder="Email"
              value={profile.email}
              onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
            />
            <input
              className="platform-input"
              placeholder="Часовой пояс"
              value={profile.timezone}
              onChange={e => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
            />
            <input
              className="platform-input"
              placeholder="Telegram"
              value={profile.telegram}
              onChange={e => setProfile(prev => ({ ...prev, telegram: e.target.value }))}
            />
          </div>
          <div className="flex justify-end mt-4">
            <button className="platform-btn-primary" onClick={saveChanges}>Сохранить профиль</button>
          </div>
        </section>
      )}

      {activeTab === 'notifications' && (
        <section className="platform-card">
          <div className="grid gap-3">
            {[
              ['telegram', 'Уведомления в Telegram'],
              ['newOrder', 'Новый заказ'],
              ['newMessage', 'Новое сообщение'],
              ['lowStock', 'Низкий остаток на складе'],
              ['botError', 'Ошибки бота и автоматизации'],
              ['weeklyReport', 'Недельный отчёт'],
            ].map(([key, label]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(148,163,184,0.14)',
                }}
              >
                <span>{label}</span>
                <Toggle checked={Boolean(notifications[key as keyof typeof notifications])} onChange={v => setNotifications(prev => ({ ...prev, [key]: v }))} />
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'plan' && (
        <section className="grid gap-4 md:grid-cols-3">
          {plans.map(plan => (
            <article
              key={plan.name}
              className="platform-card"
              style={{ borderColor: plan.current ? 'rgba(96,165,250,0.45)' : 'var(--pf-border)' }}
            >
              <div className="flex items-center justify-between">
                <div style={{ fontWeight: 800, fontSize: 20 }}>{plan.name}</div>
                {plan.current && <span className="platform-chip">Текущий</span>}
              </div>
              <div style={{ marginTop: 6, fontSize: 32, fontWeight: 900 }}>
                {plan.price}
                <span style={{ fontSize: 15, color: 'var(--pf-text-muted)' }}> ₽/мес</span>
              </div>
              <ul style={{ marginTop: 12, paddingLeft: 18, color: 'var(--pf-text-muted)', fontSize: 14, lineHeight: 1.75 }}>
                {plan.features.map(feature => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button className={plan.current ? 'platform-btn-secondary' : 'platform-btn-primary'} style={{ width: '100%', marginTop: 10 }}>
                {plan.current ? 'Активен' : 'Переключить'}
              </button>
            </article>
          ))}
        </section>
      )}

      {activeTab === 'security' && (
        <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <article className="platform-card">
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Пароль и доступ</h2>
            <div className="grid gap-3 mt-3">
              <input
                className="platform-input"
                type="password"
                placeholder="Текущий пароль"
                value={passwords.old}
                onChange={e => setPasswords(prev => ({ ...prev, old: e.target.value }))}
              />
              <input
                className="platform-input"
                type="password"
                placeholder="Новый пароль"
                value={passwords.next}
                onChange={e => setPasswords(prev => ({ ...prev, next: e.target.value }))}
              />
              <input
                className="platform-input"
                type="password"
                placeholder="Подтверждение"
                value={passwords.confirm}
                onChange={e => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Shield size={15} /> Двухфакторная защита</span>
                <Toggle checked={security.twoFactor} onChange={v => setSecurity(prev => ({ ...prev, twoFactor: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Bell size={15} /> Уведомлять о новых входах</span>
                <Toggle checked={security.loginAlerts} onChange={v => setSecurity(prev => ({ ...prev, loginAlerts: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><KeyRound size={15} /> Разрешать только доверенные IP</span>
                <Toggle checked={security.trustedIps} onChange={v => setSecurity(prev => ({ ...prev, trustedIps: v }))} />
              </div>
            </div>
            <button className="platform-btn-primary mt-4" onClick={saveChanges}>Сохранить безопасность</button>
          </article>

          <article className="platform-card" style={{ overflow: 'auto' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Сессии входа</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, minWidth: 380 }}>
              <thead>
                <tr style={{ color: 'var(--pf-text-dim)', fontSize: 12, borderBottom: '1px solid var(--pf-border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Дата</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>IP</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Устройство</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={`${session.date}-${session.ip}`} style={{ borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                    <td style={{ padding: '10px 0', whiteSpace: 'nowrap' }}>{session.date}</td>
                    <td style={{ padding: '10px 0', color: 'var(--pf-text-muted)' }}>{session.ip}</td>
                    <td style={{ padding: '10px 0', color: 'var(--pf-text-muted)' }}>
                      {session.device}
                      <div style={{ fontSize: 12, color: 'var(--pf-text-dim)' }}>{session.location}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </section>
      )}

      {saved && (
        <div
          className="platform-card"
          style={{
            position: 'fixed',
            right: 20,
            bottom: 90,
            zIndex: 90,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            borderColor: 'rgba(74,222,128,0.45)',
          }}
        >
          <Check size={14} color="#4ade80" />
          <span style={{ fontSize: 13 }}>Изменения сохранены</span>
        </div>
      )}
    </motion.div>
  );
}
