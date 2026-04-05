import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Check, CreditCard, KeyRound, Shield, UserCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { readCurrentPlanId, subscriptionPlans, writeCurrentPlanId } from '@/shared/subscriptions';
import { Panel, PageHeader, PageShell, PageTitle, SectionCard } from '@/platform/components/primitives';

type SectionKey = 'profile' | 'notifications' | 'plan' | 'security';

const sections: Array<{ key: SectionKey; label: string; icon: LucideIcon }> = [
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
      className="relative h-6 w-11 cursor-pointer rounded-full border border-[var(--pf-border)]"
      style={{ background: checked ? '#2563eb' : 'var(--pf-surface-2)' }}
      aria-label="Переключатель"
    >
      <span
        className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white transition-all"
        style={{ left: checked ? 22 : 2 }}
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

  function showSavedToast() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Настройки платформы"
            subtitle="Единая навигация разделов: профиль, уведомления, подписка и безопасность."
          />
        </PageHeader>

        <div className="platform-settings-layout">
          <SectionCard>
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
          </SectionCard>

          <SectionCard>
            {activeSection === 'profile' && (
              <>
                <h2 className="m-0 text-[20px] font-extrabold">Профиль</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    className="platform-input"
                    placeholder="Имя"
                    value={profile.displayName}
                    onChange={event => setProfile(prev => ({ ...prev, displayName: event.target.value }))}
                  />
                  <input
                    className="platform-input"
                    placeholder="Email"
                    value={profile.email}
                    onChange={event => setProfile(prev => ({ ...prev, email: event.target.value }))}
                  />
                  <input
                    className="platform-input"
                    placeholder="Часовой пояс"
                    value={profile.timezone}
                    onChange={event => setProfile(prev => ({ ...prev, timezone: event.target.value }))}
                  />
                  <input
                    className="platform-input"
                    placeholder="Telegram"
                    value={profile.telegram}
                    onChange={event => setProfile(prev => ({ ...prev, telegram: event.target.value }))}
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="platform-btn-primary" onClick={showSavedToast}>
                    Сохранить профиль
                  </button>
                </div>
              </>
            )}

            {activeSection === 'notifications' && (
              <>
                <h2 className="m-0 text-[20px] font-extrabold">Уведомления</h2>
                <div className="mt-3">
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
                      className="flex items-center justify-between gap-3 border-b border-[rgba(148,163,184,0.14)] py-3"
                    >
                      <span>{label}</span>
                      <Toggle
                        checked={Boolean(notifications[key as keyof typeof notifications])}
                        onChange={value => setNotifications(prev => ({ ...prev, [key]: value }))}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeSection === 'plan' && (
              <>
                <h2 className="m-0 text-[20px] font-extrabold">Подписка</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {subscriptionPlans.map(plan => {
                    const isCurrent = plan.id === currentPlanId;
                    return (
                      <Panel
                        key={plan.id}
                        className="p-3"
                        style={{ borderColor: isCurrent ? 'rgba(96,165,250,0.54)' : 'var(--pf-border)' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[18px] font-extrabold">{plan.name}</div>
                          {isCurrent && <span className="platform-chip">Текущий</span>}
                        </div>
                        <div className="mt-1 text-[13px] text-[var(--pf-text-muted)]">{plan.tagline}</div>
                        <div className="mt-2 text-[30px] font-black">
                          {plan.priceMonthly}
                          <span className="text-[15px] font-semibold text-[var(--pf-text-muted)]"> ₽/мес</span>
                        </div>
                        <div className="text-[12px] text-[var(--pf-text-dim)]">
                          При оплате за год: {plan.priceYearly} ₽/мес
                        </div>
                        <ul className="mt-2 list-disc pl-4 text-[13px] leading-7">
                          {plan.features.map(feature => (
                            <li
                              key={feature.text}
                              style={{ color: feature.available ? 'var(--pf-text-muted)' : 'var(--pf-text-dim)' }}
                            >
                              {feature.text}
                            </li>
                          ))}
                        </ul>
                        <button
                          className={isCurrent ? 'platform-btn-secondary mt-2 w-full' : 'platform-btn-primary mt-2 w-full'}
                          onClick={() => {
                            setCurrentPlanId(plan.id);
                            writeCurrentPlanId(plan.id);
                          }}
                        >
                          {isCurrent ? 'Активен' : 'Переключить'}
                        </button>
                      </Panel>
                    );
                  })}
                </div>
              </>
            )}

            {activeSection === 'security' && (
              <>
                <h2 className="m-0 text-[20px] font-extrabold">Безопасность</h2>
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                  <Panel className="p-3">
                    <div className="grid gap-3">
                      <input
                        className="platform-input"
                        type="password"
                        placeholder="Текущий пароль"
                        value={passwords.old}
                        onChange={event => setPasswords(prev => ({ ...prev, old: event.target.value }))}
                      />
                      <input
                        className="platform-input"
                        type="password"
                        placeholder="Новый пароль"
                        value={passwords.next}
                        onChange={event => setPasswords(prev => ({ ...prev, next: event.target.value }))}
                      />
                      <input
                        className="platform-input"
                        type="password"
                        placeholder="Подтверждение"
                        value={passwords.confirm}
                        onChange={event => setPasswords(prev => ({ ...prev, confirm: event.target.value }))}
                      />
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2">
                          <Shield size={14} /> Двухфакторная защита
                        </span>
                        <Toggle checked={security.twoFactor} onChange={value => setSecurity(prev => ({ ...prev, twoFactor: value }))} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2">
                          <Bell size={14} /> Уведомлять о новых входах
                        </span>
                        <Toggle checked={security.loginAlerts} onChange={value => setSecurity(prev => ({ ...prev, loginAlerts: value }))} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2">
                          <KeyRound size={14} /> Разрешать только доверенные IP
                        </span>
                        <Toggle checked={security.trustedIps} onChange={value => setSecurity(prev => ({ ...prev, trustedIps: value }))} />
                      </div>
                    </div>

                    <button className="platform-btn-primary mt-4" onClick={showSavedToast}>
                      Сохранить безопасность
                    </button>
                  </Panel>

                  <Panel className="p-3">
                    <h3 className="m-0 text-[16px] font-bold">Сессии входа</h3>
                    <div className="platform-desktop-table mt-3">
                      <div className="platform-table-wrap">
                        <table className="platform-table" style={{ minWidth: 360 }}>
                          <thead>
                            <tr>
                              <th>Дата</th>
                              <th>IP</th>
                              <th>Устройство</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessions.map(session => (
                              <tr key={`${session.date}-${session.ip}`}>
                                <td className="whitespace-nowrap">{session.date}</td>
                                <td>{session.ip}</td>
                                <td>
                                  {session.device}
                                  <div className="text-[12px] text-[var(--pf-text-dim)]">{session.location}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="platform-mobile-cards mt-3 !p-0">
                      {sessions.map(session => (
                        <article key={`${session.date}-${session.ip}`} className="platform-mobile-card">
                          <div className="platform-mobile-card-head">
                            <strong>{session.date}</strong>
                            <span className="platform-chip !min-h-[22px]">{session.ip}</span>
                          </div>
                          <div className="platform-mobile-meta">
                            <span>{session.device}</span>
                            <span>{session.location}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </Panel>
                </div>
              </>
            )}
          </SectionCard>
        </div>
      </PageShell>

      {saved && (
        <SectionCard
          className="inline-flex items-center gap-2 border-[rgba(52,211,153,0.5)] px-3 py-2"
          style={{ position: 'fixed', right: 18, bottom: 88, zIndex: 80 }}
        >
          <Check size={14} color="#4ade80" />
          <span className="text-[13px]">Изменения сохранены</span>
        </SectionCard>
      )}
    </motion.div>
  );
}
