import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield, Bell, CreditCard, Users, Eye, EyeOff, Check, Plus,
  Trash2, Settings as SettingsIcon, Key, Star,
} from 'lucide-react';
import { accounts } from '@/platform/data/demoData';

const CARD: React.CSSProperties = {
  background: '#0a1428',
  border: '1px solid rgba(0,121,255,0.18)',
  borderRadius: '12px',
  padding: '20px',
};

const INPUT: React.CSSProperties = {
  background: '#0d1e38',
  border: '1px solid rgba(0,121,255,0.25)',
  borderRadius: '8px',
  padding: '9px 14px',
  color: '#fff',
  fontSize: '14px',
  fontFamily: 'Syne, sans-serif',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
};

const BTN_PRIMARY: React.CSSProperties = {
  background: 'linear-gradient(135deg, #007BFF, #0052F4)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '9px 18px',
  cursor: 'pointer',
  fontFamily: 'Syne, sans-serif',
  fontWeight: 600,
  fontSize: '14px',
};

const BTN_SECONDARY: React.CSSProperties = {
  background: 'rgba(0,121,255,0.12)',
  color: '#7DC8FF',
  border: '1px solid rgba(0,121,255,0.25)',
  borderRadius: '8px',
  padding: '9px 18px',
  cursor: 'pointer',
  fontFamily: 'Syne, sans-serif',
  fontWeight: 500,
  fontSize: '14px',
};

const TABS = ['Аккаунты', 'Уведомления', 'Подписка', 'Безопасность'];

const plans = [
  {
    name: 'Старт', price: 299, current: false,
    features: ['1 аккаунт FunPay', 'Базовая автоматизация', '5 активных правил', 'Email поддержка'],
  },
  {
    name: 'Про', price: 699, current: true,
    features: ['3 аккаунта FunPay', 'Полная автоматизация', 'Неограниченные правила', 'Склад 10 000 товаров', 'Telegram уведомления', 'Приоритетная поддержка'],
  },
  {
    name: 'Бизнес', price: 1499, current: false,
    features: ['10 аккаунтов FunPay', 'Всё из Про', 'API доступ', 'Выделенный сервер', 'Аналитика Pro', 'Персональный менеджер'],
  },
];

const loginHistory = [
  { date: '02.04.2026 14:33', ip: '95.173.116.42', device: 'Chrome / Windows 11', location: 'Москва, RU' },
  { date: '01.04.2026 09:12', ip: '95.173.116.42', device: 'Chrome / Windows 11', location: 'Москва, RU' },
  { date: '31.03.2026 22:47', ip: '79.139.50.11', device: 'Safari / iOS 17', location: 'Санкт-Петербург, RU' },
  { date: '29.03.2026 17:05', ip: '95.173.116.42', device: 'Chrome / Windows 11', location: 'Москва, RU' },
  { date: '27.03.2026 08:30', ip: '188.234.40.7', device: 'Firefox / Ubuntu', location: 'Казань, RU' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '42px', height: '24px', borderRadius: '12px', cursor: 'pointer',
        background: checked ? '#0079FF' : 'rgba(107,114,128,0.4)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
        position: 'absolute', top: '3px',
        left: checked ? '21px' : '3px',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '13px', fontWeight: 600, color: '#7DC8FF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '12px', marginTop: '4px' }}>{children}</div>;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const [proxyValues, setProxyValues] = useState<Record<string, string>>({
    tonminerz: '',
    shop_pro: '',
  });
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [goldenKey, setGoldenKey] = useState('');
  const [notifications, setNotifications] = useState({
    telegram: true,
    telegramUsername: '@my_telegram',
    newOrder: true,
    newMessage: true,
    lowStock: true,
    botError: true,
    orderComplete: false,
    pushBrowser: false,
  });
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '24px', minHeight: '100vh', background: '#050C1C', color: '#fff', fontFamily: 'Syne, sans-serif' }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Настройки</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid rgba(0,121,255,0.15)', paddingBottom: '0' }}>
        {TABS.map((tab, i) => {
          const icons = [Users, Bell, CreditCard, Shield];
          const Icon = icons[i];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                background: activeTab === i ? 'rgba(0,121,255,0.15)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === i ? '2px solid #0079FF' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                padding: '10px 18px',
                color: activeTab === i ? '#fff' : '#7DC8FF',
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'color 0.15s, background 0.15s',
              }}
            >
              <Icon size={15} />
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab 0: Accounts */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {accounts.map(acc => (
              <div key={acc.id} style={CARD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #007BFF, #0052F4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700 }}>
                      {acc.avatar}
                    </div>
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: '14px', height: '14px', borderRadius: '50%', background: acc.online ? '#22c55e' : '#6b7280', border: '2px solid #0a1428' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '17px', fontWeight: 700 }}>{acc.username}</span>
                      {acc.verified && (
                        <span style={{ background: 'rgba(0,121,255,0.15)', color: '#0079FF', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={11} /> Верифицирован
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#7DC8FF', fontSize: '13px', marginTop: '4px' }}>
                      {acc.balance.toLocaleString('ru-RU')}₽ · {acc.lotsCount} лотов · ⭐ {acc.rating}
                    </div>
                  </div>
                  <button style={{ ...BTN_SECONDARY, fontSize: '13px', padding: '7px 14px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Trash2 size={13} />Отключить</span>
                  </button>
                </div>
                <div>
                  <label style={{ color: '#7DC8FF', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                    Прокси (ip:port:login:pass)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={proxyValues[acc.id] || ''}
                      onChange={e => setProxyValues(prev => ({ ...prev, [acc.id]: e.target.value }))}
                      placeholder="95.173.116.42:8080:user:pass"
                      style={INPUT}
                    />
                    <button style={{ ...BTN_PRIMARY, whiteSpace: 'nowrap' as const }}>Сохранить</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAddAccount(true)}
            style={{ ...BTN_PRIMARY, marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Добавить аккаунт
          </button>

          {/* Add account modal */}
          {showAddAccount && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
              onClick={e => e.target === e.currentTarget && setShowAddAccount(false)}
            >
              <div style={{ background: '#0a1428', border: '1px solid rgba(0,121,255,0.25)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Добавить аккаунт FunPay</h3>
                <div style={{ background: 'rgba(0,121,255,0.08)', border: '1px solid rgba(0,121,255,0.15)', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '13px', color: '#7DC8FF', lineHeight: 1.6 }}>
                  <strong style={{ color: '#fff' }}>Как получить golden_key:</strong><br />
                  1. Войдите на funpay.com<br />
                  2. Откройте Инструменты разработчика (F12)<br />
                  3. Перейдите в Application → Cookies → funpay.com<br />
                  4. Скопируйте значение cookie <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>golden_key</code>
                </div>
                <label style={{ color: '#7DC8FF', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>golden_key</label>
                <textarea
                  value={goldenKey}
                  onChange={e => setGoldenKey(e.target.value)}
                  placeholder="Вставьте ваш golden_key сюда..."
                  rows={3}
                  style={{ ...INPUT, resize: 'vertical' as const }}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button style={BTN_PRIMARY} onClick={() => setShowAddAccount(false)}>Добавить</button>
                  <button style={BTN_SECONDARY} onClick={() => setShowAddAccount(false)}>Отмена</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Notifications */}
      {activeTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
          <div style={CARD}>
            <SectionTitle>Telegram уведомления</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Уведомления в Telegram</div>
                <div style={{ color: '#7DC8FF', fontSize: '13px' }}>Получайте важные события в Telegram</div>
              </div>
              <Toggle checked={notifications.telegram} onChange={v => setNotifications(p => ({ ...p, telegram: v }))} />
            </div>
            {notifications.telegram && (
              <div>
                <label style={{ color: '#7DC8FF', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Telegram username</label>
                <input
                  value={notifications.telegramUsername}
                  onChange={e => setNotifications(p => ({ ...p, telegramUsername: e.target.value }))}
                  placeholder="@username"
                  style={INPUT}
                />
              </div>
            )}
          </div>

          <div style={CARD}>
            <SectionTitle>Что уведомлять</SectionTitle>
            {[
              { key: 'newOrder', label: 'Новый заказ' },
              { key: 'newMessage', label: 'Новое сообщение' },
              { key: 'lowStock', label: 'Товары заканчиваются' },
              { key: 'botError', label: 'Ошибка бота' },
              { key: 'orderComplete', label: 'Заказ выполнен' },
            ].map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,121,255,0.08)' }}>
                <span style={{ fontSize: '14px' }}>{label}</span>
                <Toggle
                  checked={notifications[key as keyof typeof notifications] as boolean}
                  onChange={v => setNotifications(p => ({ ...p, [key]: v }))}
                />
              </div>
            ))}
          </div>

          <div style={CARD}>
            <SectionTitle>Push-уведомления</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Уведомления в браузере</div>
                <div style={{ color: '#7DC8FF', fontSize: '13px' }}>Всплывающие уведомления на рабочем столе</div>
              </div>
              <Toggle checked={notifications.pushBrowser} onChange={v => setNotifications(p => ({ ...p, pushBrowser: v }))} />
            </div>
          </div>

          <button style={BTN_PRIMARY} onClick={handleSave}>
            {saved ? '✓ Сохранено' : 'Сохранить настройки'}
          </button>
        </div>
      )}

      {/* Tab 2: Subscription */}
      {activeTab === 2 && (
        <div>
          <div style={{ ...CARD, marginBottom: '24px', maxWidth: '500px', background: 'linear-gradient(135deg, rgba(0,79,255,0.2), rgba(0,52,244,0.1))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Star size={18} color="#eab308" fill="#eab308" />
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Текущий план: Про</span>
            </div>
            <div style={{ color: '#7DC8FF', fontSize: '14px' }}>699₽/месяц · Следующий платёж: 01.05.2026</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', maxWidth: '860px' }}>
            {plans.map(plan => (
              <div key={plan.name} style={{
                ...CARD,
                border: plan.current ? '2px solid #0079FF' : '1px solid rgba(0,121,255,0.18)',
                position: 'relative',
              }}>
                {plan.current && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #007BFF, #0052F4)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                    Текущий план
                  </div>
                )}
                <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{plan.name}</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0079FF', marginBottom: '16px' }}>
                  {plan.price}₽<span style={{ fontSize: '14px', color: '#7DC8FF', fontWeight: 400 }}>/мес</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#7DC8FF' }}>
                      <Check size={14} color="#22c55e" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button style={{
                  ...BTN_PRIMARY,
                  width: '100%',
                  ...(plan.current ? { background: 'rgba(0,121,255,0.1)', color: '#7DC8FF', border: '1px solid rgba(0,121,255,0.2)' } : {}),
                }}>
                  {plan.current ? 'Активен' : 'Выбрать план'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Security */}
      {activeTab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
          <div style={CARD}>
            <SectionTitle>Смена пароля</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ color: '#7DC8FF', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Текущий пароль</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={passwords.old}
                    onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))}
                    placeholder="••••••••"
                    style={{ ...INPUT, paddingRight: '40px' }}
                  />
                  <button
                    onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7DC8FF' }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ color: '#7DC8FF', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Новый пароль</label>
                <input type="password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} placeholder="••••••••" style={INPUT} />
              </div>
              <div>
                <label style={{ color: '#7DC8FF', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Подтверждение пароля</label>
                <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" style={INPUT} />
              </div>
              <button style={{ ...BTN_PRIMARY, display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }} onClick={handleSave}>
                <Key size={15} />
                {saved ? '✓ Сохранено' : 'Изменить пароль'}
              </button>
            </div>
          </div>

          <div style={CARD}>
            <SectionTitle>История входов</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: '#7DC8FF', borderBottom: '1px solid rgba(0,121,255,0.15)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 8px', fontWeight: 500 }}>Дата</th>
                    <th style={{ textAlign: 'left', padding: '8px 8px', fontWeight: 500 }}>IP</th>
                    <th style={{ textAlign: 'left', padding: '8px 8px', fontWeight: 500 }}>Устройство</th>
                    <th style={{ textAlign: 'left', padding: '8px 8px', fontWeight: 500 }}>Город</th>
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.map((entry, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(0,121,255,0.07)' }}>
                      <td style={{ padding: '10px 8px', color: i === 0 ? '#22c55e' : '#7DC8FF', whiteSpace: 'nowrap' }}>{entry.date}</td>
                      <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: '12px' }}>{entry.ip}</td>
                      <td style={{ padding: '10px 8px', color: '#7DC8FF' }}>{entry.device}</td>
                      <td style={{ padding: '10px 8px', color: '#7DC8FF' }}>{entry.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
