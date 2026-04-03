'use client';

import { useState } from 'react';
import {
  BellAlertIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Switch } from '@/app/components/ui/switch';

type SettingsSection = 'profile' | 'notifications' | 'plan' | 'security';

const sections: Array<{ key: SettingsSection; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = [
  { key: 'profile', label: 'Профиль', icon: UserCircleIcon },
  { key: 'notifications', label: 'Уведомления', icon: BellAlertIcon },
  { key: 'plan', label: 'Подписка', icon: CreditCardIcon },
  { key: 'security', label: 'Безопасность', icon: ShieldCheckIcon },
];

export default function Settings2() {
  const [section, setSection] = useState<SettingsSection>('profile');
  const [telegramAlerts, setTelegramAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [nightAlerts, setNightAlerts] = useState(true);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
        <p className="text-sm text-[var(--p2-text-muted)]">Единый control-center аккаунта, безопасности и уведомлений.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[230px_minmax(0,1fr)]">
        <Card className="p2-surface border-[var(--p2-border)] h-fit">
          <CardHeader>
            <CardTitle className="text-base">Разделы</CardTitle>
            <CardDescription className="text-[var(--p2-text-dim)]">Внутренняя навигация</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {sections.map(item => {
              const Icon = item.icon;
              const active = section === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSection(item.key)}
                  className={`w-full h-10 rounded-md border px-3 inline-flex items-center gap-2 text-sm font-semibold transition ${
                    active
                      ? 'border-blue-500/55 bg-blue-500/10 text-blue-100'
                      : 'border-[var(--p2-border)] bg-[var(--p2-surface-2)] text-[var(--p2-text-muted)] hover:text-white'
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {section === 'profile' && (
            <Card className="p2-surface border-[var(--p2-border)]">
              <CardHeader>
                <CardTitle className="text-base">Профиль продавца</CardTitle>
                <CardDescription className="text-[var(--p2-text-dim)]">Данные аккаунта, отображаемые в панели управления.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--p2-text-dim)]">Имя</label>
                  <Input className="p2-input" defaultValue="Kirill" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--p2-text-dim)]">Email</label>
                  <Input className="p2-input" defaultValue="kirill@example.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--p2-text-dim)]">Telegram</label>
                  <Input className="p2-input" defaultValue="@kirill" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--p2-text-dim)]">Часовой пояс</label>
                  <Input className="p2-input" defaultValue="Europe/Moscow" />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button className="p2-primary-btn">Сохранить изменения</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {section === 'notifications' && (
            <Card className="p2-surface border-[var(--p2-border)]">
              <CardHeader>
                <CardTitle className="text-base">Уведомления</CardTitle>
                <CardDescription className="text-[var(--p2-text-dim)]">Выберите каналы и правила оповещений по заказам и чатам.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p2-surface-2 rounded-md p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">Telegram уведомления</p>
                    <p className="text-xs text-[var(--p2-text-dim)]">Срочные события, споры, ошибки выдачи</p>
                  </div>
                  <Switch checked={telegramAlerts} onCheckedChange={setTelegramAlerts} />
                </div>

                <div className="p2-surface-2 rounded-md p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">Email отчёты</p>
                    <p className="text-xs text-[var(--p2-text-dim)]">Ежедневная сводка по продажам и конверсии</p>
                  </div>
                  <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                </div>

                <div className="p2-surface-2 rounded-md p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">Ночные push-уведомления</p>
                    <p className="text-xs text-[var(--p2-text-dim)]">Только критические инциденты и споры</p>
                  </div>
                  <Switch checked={nightAlerts} onCheckedChange={setNightAlerts} />
                </div>
              </CardContent>
            </Card>
          )}

          {section === 'plan' && (
            <div className="grid gap-4 xl:grid-cols-3">
              {[
                { name: 'Старт', price: 299, features: ['1 аккаунт', 'Базовая автоматизация'], current: false },
                { name: 'Про', price: 699, features: ['3 аккаунта', 'Чаты + аналитика', 'Склад и автоответ'], current: true },
                { name: 'Бизнес', price: 1499, features: ['10 аккаунтов', 'API и плагины', 'Приоритетная поддержка'], current: false },
              ].map(plan => (
                <Card key={plan.name} className="p2-surface border-[var(--p2-border)]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      {plan.current && <Badge className="bg-blue-600 hover:bg-blue-600">Текущий</Badge>}
                    </div>
                    <CardDescription className="text-2xl font-bold text-white">{plan.price} ₽/мес</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-1.5 text-sm text-[var(--p2-text-muted)]">
                      {plan.features.map(item => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                    <Button className={plan.current ? 'w-full p2-surface-2' : 'w-full p2-primary-btn'} variant={plan.current ? 'outline' : 'default'}>
                      {plan.current ? 'Уже подключен' : 'Выбрать тариф'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {section === 'security' && (
            <Card className="p2-surface border-[var(--p2-border)]">
              <CardHeader>
                <CardTitle className="text-base">Безопасность</CardTitle>
                <CardDescription className="text-[var(--p2-text-dim)]">Контроль доступа и сессий.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button className="p2-primary-btn justify-center">Сменить пароль</Button>
                  <Button variant="outline" className="p2-surface-2 justify-center">Включить 2FA</Button>
                </div>

                <div className="rounded-md border border-[var(--p2-border)] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--p2-surface-2)] text-[var(--p2-text-dim)]">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Устройство</th>
                        <th className="text-left px-3 py-2 font-medium">IP</th>
                        <th className="text-left px-3 py-2 font-medium">Последняя активность</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Chrome / macOS', '95.173.116.42', '03.04.2026 13:31'],
                        ['Safari / iPhone', '95.173.116.42', '03.04.2026 10:18'],
                        ['Firefox / Windows', '79.139.50.11', '02.04.2026 22:44'],
                      ].map(row => (
                        <tr key={row.join('-')} className="border-t border-[var(--p2-border)]">
                          <td className="px-3 py-2">{row[0]}</td>
                          <td className="px-3 py-2 text-[var(--p2-text-dim)]">{row[1]}</td>
                          <td className="px-3 py-2 text-[var(--p2-text-dim)]">{row[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
