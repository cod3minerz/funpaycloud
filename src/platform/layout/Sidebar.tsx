import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, MessageSquare, ShoppingCart, Tag, Package,
  BarChart2, Zap, Puzzle, Wallet, Settings, ChevronDown,
  CheckCircle2, Circle, Plus, Crown,
} from 'lucide-react';
import { accounts } from '@/platform/data/demoData';

const navItems = [
  { icon: LayoutDashboard, label: 'Дашборд',       path: '/platform/dashboard' },
  { icon: MessageSquare,   label: 'Чаты',           path: '/platform/chats' },
  { icon: ShoppingCart,    label: 'Заказы',          path: '/platform/orders' },
  { icon: Tag,             label: 'Лоты',            path: '/platform/lots' },
  { icon: Package,         label: 'Склад',           path: '/platform/warehouse' },
  { icon: BarChart2,       label: 'Аналитика',       path: '/platform/analytics' },
  { icon: Zap,             label: 'Автоматизация',   path: '/platform/automation' },
  { icon: Puzzle,          label: 'Плагины',         path: '/platform/plugins' },
  { icon: Wallet,          label: 'Финансы',         path: '/platform/finances' },
  { icon: Settings,        label: 'Настройки',       path: '/platform/settings' },
];

export default function Sidebar() {
  const [activeAccount, setActiveAccount] = useState(accounts[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '240px',
        height: '100vh',
        background: '#0a1428',
        borderRight: '1px solid rgba(0,121,255,0.18)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(0,121,255,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #007BFF, #0052F4)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 800,
          }}>F</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>FunPay</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#0079FF', letterSpacing: '0.05em' }}>CLOUD</div>
          </div>
        </div>
      </div>

      {/* Account switcher */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,121,255,0.12)', position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            width: '100%',
            background: 'rgba(0,121,255,0.08)',
            border: '1px solid rgba(0,121,255,0.2)',
            borderRadius: '10px',
            padding: '10px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fff',
          }}
        >
          {/* Avatar */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0079FF, #0052F4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {activeAccount.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeAccount.username}
            </div>
            <div style={{ fontSize: '11px', color: '#7DC8FF' }}>
              {activeAccount.balance.toLocaleString('ru-RU')}₽
            </div>
          </div>
          {/* Online dot */}
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: activeAccount.online ? '#22c55e' : '#6b7280',
            flexShrink: 0,
          }} />
          <ChevronDown size={14} color="#7DC8FF" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% - 2px)',
            left: '14px',
            right: '14px',
            background: '#0d1e38',
            border: '1px solid rgba(0,121,255,0.25)',
            borderRadius: '10px',
            overflow: 'hidden',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => { setActiveAccount(acc); setDropdownOpen(false); }}
                style={{
                  width: '100%',
                  background: acc.id === activeAccount.id ? 'rgba(0,121,255,0.12)' : 'transparent',
                  border: 'none',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#fff',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0079FF, #0052F4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                }}>{acc.avatar}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{acc.username}</div>
                  <div style={{ fontSize: '11px', color: '#7DC8FF' }}>{acc.balance.toLocaleString('ru-RU')}₽</div>
                </div>
                {acc.id === activeAccount.id
                  ? <CheckCircle2 size={14} color="#0079FF" />
                  : <Circle size={14} color="#7DC8FF" />
                }
              </button>
            ))}
            <div style={{ borderTop: '1px solid rgba(0,121,255,0.12)', margin: '4px 0' }} />
            <button
              style={{
                width: '100%', background: 'transparent', border: 'none',
                padding: '10px 12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px',
                color: '#7DC8FF', fontSize: '13px', opacity: 0.7,
              }}
              onClick={() => setDropdownOpen(false)}
            >
              <Plus size={14} />
              Добавить аккаунт
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(125,200,255,0.4)', letterSpacing: '0.1em', padding: '8px 10px 4px', textTransform: 'uppercase' }}>Управление</div>
        {navItems.slice(0, 5).map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `platform-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}

        <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(125,200,255,0.4)', letterSpacing: '0.1em', padding: '12px 10px 4px', textTransform: 'uppercase' }}>Инструменты</div>
        {navItems.slice(5).map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `platform-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom — plan badge */}
      <div style={{ padding: '14px', borderTop: '1px solid rgba(0,121,255,0.12)' }}>
        <div style={{
          background: 'rgba(0,121,255,0.1)',
          border: '1px solid rgba(0,121,255,0.2)',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <Crown size={16} color="#eab308" />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Про план</div>
            <div style={{ fontSize: '11px', color: '#7DC8FF' }}>Активна до 01.05.2026</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
