'use client';

import { useState } from 'react';
import {
  BellAlertIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Input } from '@/app/components/ui/input';
import { Switch } from '@/app/components/ui/switch';
import { P2Card, P2PageHeader, P2PrimaryAction, P2SecondaryAction } from '@/platform2/components/primitives';

type SectionKey = 'profile' | 'notifications' | 'plan' | 'security';

const sections: Array<{ key: SectionKey; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = [
  { key: 'profile', label: 'Profile', icon: UserCircleIcon },
  { key: 'notifications', label: 'Notifications', icon: BellAlertIcon },
  { key: 'plan', label: 'Subscription', icon: CreditCardIcon },
  { key: 'security', label: 'Security', icon: ShieldCheckIcon },
];

export default function Settings2() {
  const [section, setSection] = useState<SectionKey>('profile');
  const [telegram, setTelegram] = useState(true);
  const [email, setEmail] = useState(false);
  const [night, setNight] = useState(true);

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader title="Settings" description="Manage profile, billing and security from one control center." />

      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <P2Card title="Sections" subtitle="Navigation">
          <div className="space-y-1.5">
            {sections.map(item => {
              const Icon = item.icon;
              const active = section === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={active ? 'p2-primary-btn w-full justify-start px-3' : 'p2-secondary-btn w-full justify-start px-3'}
                  onClick={() => setSection(item.key)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </P2Card>

        <div className="space-y-4">
          {section === 'profile' ? (
            <P2Card title="Profile" subtitle="Update account data used in the platform.">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs text-[var(--p2-text-dim)]">Display name</span>
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
                  <span className="text-xs text-[var(--p2-text-dim)]">Timezone</span>
                  <Input className="p2-input" defaultValue="Europe/Moscow" />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <P2PrimaryAction>Save changes</P2PrimaryAction>
              </div>
            </P2Card>
          ) : null}

          {section === 'notifications' ? (
            <P2Card title="Notifications" subtitle="Tune channel-specific alert preferences.">
              <div className="space-y-2.5">
                <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Telegram alerts</p>
                    <p className="text-xs text-[var(--p2-text-dim)]">Disputes and critical order events</p>
                  </div>
                  <Switch checked={telegram} onCheckedChange={setTelegram} />
                </div>

                <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Email digest</p>
                    <p className="text-xs text-[var(--p2-text-dim)]">Daily metrics and conversion summary</p>
                  </div>
                  <Switch checked={email} onCheckedChange={setEmail} />
                </div>

                <div className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Night push alerts</p>
                    <p className="text-xs text-[var(--p2-text-dim)]">Only high-priority incidents at night</p>
                  </div>
                  <Switch checked={night} onCheckedChange={setNight} />
                </div>
              </div>
            </P2Card>
          ) : null}

          {section === 'plan' ? (
            <div className="grid gap-4 xl:grid-cols-3">
              {[
                { name: 'Start', price: 299, description: 'For solo sellers', current: false },
                { name: 'Pro', price: 699, description: 'For active stores', current: true },
                { name: 'Business', price: 1499, description: 'For scale teams', current: false },
              ].map(plan => (
                <P2Card key={plan.name} title={plan.name} subtitle={plan.description}>
                  <p className="text-3xl font-bold text-white">{plan.price} ₽/mo</p>
                  <ul className="mt-3 space-y-1 text-sm text-[var(--p2-text-muted)]">
                    <li>• Multi account operations</li>
                    <li>• Full chat automation</li>
                    <li>• Growth analytics</li>
                  </ul>

                  <div className="mt-4">
                    {plan.current ? (
                      <P2SecondaryAction className="w-full">Current plan</P2SecondaryAction>
                    ) : (
                      <P2PrimaryAction className="w-full">Switch plan</P2PrimaryAction>
                    )}
                  </div>
                </P2Card>
              ))}
            </div>
          ) : null}

          {section === 'security' ? (
            <P2Card title="Security" subtitle="Credentials, sessions and access control.">
              <div className="grid gap-2 sm:grid-cols-2">
                <P2PrimaryAction className="justify-center">Change password</P2PrimaryAction>
                <P2SecondaryAction className="justify-center">Enable 2FA</P2SecondaryAction>
              </div>

              <div className="mt-4 p2-table-wrap p2-scroll">
                <table className="p2-table min-w-0">
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>IP</th>
                      <th>Last activity</th>
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
            </P2Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
