import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Check, CreditCard, KeyRound, Shield, UserCircle2 } from 'lucide-react';
import { readCurrentPlanId, subscriptionPlans, writeCurrentPlanId } from '@/shared/subscriptions';

type SectionKey = 'profile' | 'notifications' | 'plan' | 'security';

const sections: Array<{ key: SectionKey; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: 'profile', label: 'Профиль', icon: UserCircle2 },
  { key: 'notifications', label: 'Уведомления', icon: Bell },
  { key: 'plan', label: 'Подписка', icon: CreditCard },
  { key: 'security', label: 'Безопасность', icon: Shield },
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
        borderRadius: 999,
        border: '1px solid var(--pf-border)',
        background: checked ? '#2563eb' : 'var(--pf-surface-2)',
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
          borderRadius: 999,
          background: '#fff',
          transition: 'left 0.16s ease',
        }}
      />
    </button>
  );
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionKey>('profile');
  const [currentPlanId, setCurrentPlanId] = useState<'start' | 'pro' | 'team'>('pro');
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

  useEffect(() => {
    setCurrentPlanId(readCurrentPlanId());
  }, []);

  function saveChanges() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} style={{ paddingTop: 18 }}>
      <section className="platform-card" style={{ marginBottom: 14 }}>
        <h1 className="platform-page-title">Настройки платформы</h1>
        <p className="platform-page-subtitle">Отдельная навигация по разделам и аккуратная структура без tab-скролла.</p>
      </section>

      <div className="platform-settings-layout">
        <aside className="platform-card">
          <div className="platform-settings-nav">
            {sections.map(section => {
              const Icon = section.icon;
              const active = activeSection === section.key;
              return (
                <button
                  key={section.key}
                  type="button"
                  className={`platform-settings-nav-item${active ? ' active' : ''}`}
                  onClick={() => setActiveSection(section.key)}
                >
                  <Icon size={14} />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="platform-card">
          {activeSection === 'profile' && (
            <>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Профиль</h2>
              <div className="grid gap-3 md:grid-cols-2" style={{ marginTop: 14 }}>
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
              <div className="flex justify-end" style={{ marginTop: 14 }}>
                <button className="platform-btn-primary" onClick={saveChanges}>Сохранить профиль</button>
              </div>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Уведомления</h2>
              <div style={{ marginTop: 10 }}>
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
            </>
          )}

          {activeSection === 'plan' && (
            <>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Подписка</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" style={{ marginTop: 14 }}>
                {subscriptionPlans.map(plan => {
                  const isCurrent = plan.id === currentPlanId;
                  return (
                    <article
                      key={plan.id}
                      className="platform-panel"
                      style={{ padding: 14, borderColor: isCurrent ? 'rgba(96,165,250,0.5)' : 'var(--pf-border)' }}
                    >
                    <div className="flex items-center justify-between">
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{plan.name}</div>
                      {isCurrent && <span className="platform-chip">Текущий</span>}
                    </div>
                    <div style={{ marginTop: 4, color: 'var(--pf-text-muted)', fontSize: 13 }}>{plan.tagline}</div>
                    <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900 }}>
                      {plan.priceMonthly}
                      <span style={{ fontSize: 15, color: 'var(--pf-text-muted)' }}> ₽/мес</span>
                    </div>
                    <div style={{ color: 'var(--pf-text-dim)', fontSize: 12 }}>
                      При оплате за год: {plan.priceYearly} ₽/мес
                    </div>
                    <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
                      {plan.features.map(feature => (
                        <li key={feature.text} style={{ color: feature.available ? 'var(--pf-text-muted)' : 'var(--pf-text-dim)' }}>
                          {feature.text}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={isCurrent ? 'platform-btn-secondary' : 'platform-btn-primary'}
                      style={{ width: '100%', marginTop: 10 }}
                      onClick={() => {
                        setCurrentPlanId(plan.id);
                        writeCurrentPlanId(plan.id);
                      }}
                    >
                      {isCurrent ? 'Активен' : 'Переключить'}
                    </button>
                  </article>
                  );
                })}
              </div>
            </>
          )}

          {activeSection === 'security' && (
            <>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Безопасность</h2>
              <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]" style={{ marginTop: 14 }}>
                <article className="platform-panel" style={{ padding: 14 }}>
                  <div className="grid gap-3">
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

                  <div className="grid gap-3" style={{ marginTop: 14 }}>
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

                  <button className="platform-btn-primary" style={{ marginTop: 14 }} onClick={saveChanges}>Сохранить безопасность</button>
                </article>

                <article className="platform-panel" style={{ padding: 14, overflow: 'auto' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Сессии входа</h3>
                  <table className="platform-table" style={{ marginTop: 10, minWidth: 360 }}>
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 0 }}>Дата</th>
                        <th>IP</th>
                        <th style={{ paddingRight: 0 }}>Устройство</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(session => (
                        <tr key={`${session.date}-${session.ip}`}>
                          <td style={{ paddingLeft: 0, whiteSpace: 'nowrap' }}>{session.date}</td>
                          <td>{session.ip}</td>
                          <td style={{ paddingRight: 0 }}>
                            {session.device}
                            <div style={{ fontSize: 12, color: 'var(--pf-text-dim)' }}>{session.location}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </article>
              </div>
            </>
          )}
        </section>
      </div>

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
            borderColor: 'rgba(52,211,153,0.48)',
          }}
        >
          <Check size={14} color="#4ade80" />
          <span style={{ fontSize: 13 }}>Изменения сохранены</span>
        </div>
      )}
    </motion.div>
  );
}
