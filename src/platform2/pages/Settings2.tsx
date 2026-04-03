'use client';

import type { ComponentType, SVGProps } from 'react';
import { useState } from 'react';
import {
  BellAlertIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Input } from '@/app/components/ui/input';
import { Switch } from '@/app/components/ui/switch';
import { P2PageHeader, P2Panel, P2PrimaryAction, P2SecondaryAction } from '@/platform2/components/primitives';

type Section = 'profile' | 'notifications' | 'plan' | 'security';

const sections: Array<{ key: Section; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }> = [
  { key: 'profile', label: 'Профиль', icon: UserCircleIcon },
  { key: 'notifications', label: 'Уведомления', icon: BellAlertIcon },
  { key: 'plan', label: 'Подписка', icon: CreditCardIcon },
  { key: 'security', label: 'Безопасность', icon: ShieldCheckIcon },
];

export default function Settings2() {
  const [section, setSection] = useState<Section>('profile');
  const [telegram, setTelegram] = useState(true);
  const [email, setEmail] = useState(false);
  const [night, setNight] = useState(true);

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader title="Настройки" description="Профиль, уведомления и безопасность в одном рабочем контуре." />

      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <P2Panel title="Разделы" subtitle="Навигация">
          <div className="space-y-1">
            {sections.map(item => {
              const Icon = item.icon;
              const active = section === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setSection(item.key)}
                  className={active ? 'p2-btn-primary w-full justify-start px-3' : 'p2-btn-soft w-full justify-start px-3'}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </P2Panel>

        <div className="space-y-4">
          {section === 'profile' ? (
            <P2Panel title="Профиль" subtitle="Базовые данные владельца платформы">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs text-[var(--p2-text-dim)]">Имя</span>
                  <Input className="p2-input" defaultValue="Kirill" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-[var(--p2-text-dim)]">Email</span>
                  <Input className="p2-input" defaultValue="kirill@example.com" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-[var(--p2-text-dim)]">Telegram</span>
                  <Input className="p2-input" defaultValue="@kirill" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-[var(--p2-text-dim)]">Часовой пояс</span>
                  <Input className="p2-input" defaultValue="Europe/Moscow" />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <P2PrimaryAction>Сохранить</P2PrimaryAction>
              </div>
            </P2Panel>
          ) : null}

          {section === 'notifications' ? (
            <P2Panel title="Уведомления" subtitle="Каналы и приоритеты событий">
              <div className="space-y-2.5">
                <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--p2-text)]">Telegram alerts</p>
                    <p className="text-xs text-[var(--p2-text-dim)]">Новые заказы, споры, критические события</p>
                  </div>
                  <Switch checked={telegram} onCheckedChange={setTelegram} />
                </div>

                <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--p2-text)]">Email digest</p>
                    <p className="text-xs text-[var(--p2-text-dim)]">Сводка за день и недельные отчеты</p>
                  </div>
                  <Switch checked={email} onCheckedChange={setEmail} />
                </div>

                <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--p2-text)]">Ночной режим</p>
                    <p className="text-xs text-[var(--p2-text-dim)]">Только high-priority push ночью</p>
                  </div>
                  <Switch checked={night} onCheckedChange={setNight} />
                </div>
              </div>
            </P2Panel>
          ) : null}

          {section === 'plan' ? (
            <div className="grid gap-4 xl:grid-cols-3">
              {[
                { name: 'Start', price: 299, text: 'Для старта и одного магазина', current: false },
                { name: 'Pro', price: 699, text: 'Для активных продавцов', current: true },
                { name: 'Scale', price: 1499, text: 'Для команд и мультиаккаунтов', current: false },
              ].map(plan => (
                <P2Panel key={plan.name} title={plan.name} subtitle={plan.text}>
                  <p className="text-3xl font-bold text-[var(--p2-text)]">{plan.price} ₽ / мес</p>
                  <ul className="mt-3 space-y-1 text-sm text-[var(--p2-text-soft)]">
                    <li>• Мультиаккаунты</li>
                    <li>• Автоматизация чатов и выдачи</li>
                    <li>• Расширенная аналитика</li>
                  </ul>
                  <div className="mt-4">
                    {plan.current ? (
                      <P2SecondaryAction className="w-full">Текущий план</P2SecondaryAction>
                    ) : (
                      <P2PrimaryAction className="w-full">Переключить</P2PrimaryAction>
                    )}
                  </div>
                </P2Panel>
              ))}
            </div>
          ) : null}

          {section === 'security' ? (
            <P2Panel title="Безопасность" subtitle="Сессии, вход и защита аккаунта">
              <div className="grid gap-2 sm:grid-cols-2">
                <P2PrimaryAction className="justify-center">Сменить пароль</P2PrimaryAction>
                <P2SecondaryAction className="justify-center">Включить 2FA</P2SecondaryAction>
              </div>

              <div className="mt-4 p2-table-wrap p2-scroll">
                <table className="p2-table min-w-0">
                  <thead>
                    <tr>
                      <th>Устройство</th>
                      <th>IP</th>
                      <th>Последняя активность</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Chrome / macOS', '95.173.116.42', '03.04.2026 13:31'],
                      ['Safari / iPhone', '95.173.116.42', '03.04.2026 10:18'],
                      ['Firefox / Windows', '79.139.50.11', '02.04.2026 22:44'],
                    ].map(row => (
                      <tr key={row.join('_')}>
                        <td>{row[0]}</td>
                        <td className="text-[var(--p2-text-dim)]">{row[1]}</td>
                        <td className="text-[var(--p2-text-dim)]">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </P2Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
