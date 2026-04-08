import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  BadgePercent,
  CheckCircle2,
  Copy,
  Gift,
  LineChart,
  LifeBuoy,
  Megaphone,
  Rocket,
  Share2,
  Users,
  Wallet,
} from 'lucide-react';
import {
  DataTableWrap,
  KpiCard,
  KpiGrid,
  PageHeader,
  PageShell,
  PageTitle,
  Panel,
  SectionCard,
} from '@/platform/components/primitives';

type ReferralLevel = 'starter' | 'partner';

type ReferralEvent = {
  id: string;
  user: string;
  plan: string;
  amount: number;
  reward: number;
  status: 'accrued' | 'pending';
  date: string;
};

const REF_CODE = 'FUNPAYCLOUD-KIRILL';
const REF_LINK = `https://funpay.cloud/r/${REF_CODE}`;
const PARTNER_THRESHOLD = 50;

const earningsTrend = [
  { month: 'Ноя', income: 9800, referrals: 11 },
  { month: 'Дек', income: 12600, referrals: 16 },
  { month: 'Янв', income: 17400, referrals: 22 },
  { month: 'Фев', income: 21300, referrals: 28 },
  { month: 'Мар', income: 26500, referrals: 33 },
  { month: 'Апр', income: 31800, referrals: 38 },
];

const latestEvents: ReferralEvent[] = [
  { id: 'RF-3891', user: 'andrey_stream', plan: 'Pro', amount: 6990, reward: 2097, status: 'accrued', date: '08.04 12:20' },
  { id: 'RF-3888', user: 'lena_game', plan: 'Start', amount: 2990, reward: 897, status: 'accrued', date: '08.04 10:06' },
  { id: 'RF-3879', user: 'grom_youtube', plan: 'Team', amount: 14990, reward: 2998, status: 'pending', date: '07.04 21:43' },
  { id: 'RF-3865', user: 'x_sniper_x', plan: 'Pro', amount: 6990, reward: 1398, status: 'pending', date: '07.04 18:57' },
  { id: 'RF-3850', user: 'farm_builder', plan: 'Start', amount: 2990, reward: 897, status: 'accrued', date: '07.04 14:12' },
];

function formatRub(value: number) {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export default function Referrals() {
  const [currentReferrals] = useState(38);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'done'>('idle');

  const currentLevel: ReferralLevel = currentReferrals >= PARTNER_THRESHOLD ? 'partner' : 'starter';
  const toPartner = Math.max(PARTNER_THRESHOLD - currentReferrals, 0);
  const levelProgress = Math.min((currentReferrals / PARTNER_THRESHOLD) * 100, 100);

  const stats = useMemo(
    () => ({
      clicks: 6432,
      registrations: 512,
      active: 173,
      purchases: 119,
      totalIncome: 286430,
      pendingIncome: 17340,
      periodPayout: 74210,
      forecast: 39100,
    }),
    [],
  );

  async function handleCopy(value: string, mode: 'link' | 'code') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(mode);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'FunPay Cloud',
          text: 'Подключайся к FunPay Cloud по моей ссылке и получай бонусы.',
          url: REF_LINK,
        });
      } else {
        await navigator.clipboard.writeText(REF_LINK);
      }
      setShareState('done');
      window.setTimeout(() => setShareState('idle'), 1800);
    } catch {
      setShareState('idle');
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Реферальная система"
            subtitle="Приглашайте пользователей в FunPay Cloud и масштабируйте доход: разовые выплаты на старте и ежемесячный партнерский поток."
          />
        </PageHeader>

        <SectionCard className="p-0 overflow-hidden">
          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)] lg:p-5">
            <div className="grid gap-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(110,139,255,0.35)] bg-[var(--pf-accent-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--pf-text-muted)]">
                <BadgePercent size={13} />
                До 30% вознаграждения • Без потолка дохода
              </div>

              <div>
                <h2 className="m-0 text-[clamp(26px,3.8vw,42px)] font-black leading-[1.05] tracking-[-0.025em]">
                  Зарабатывайте на рекомендациях платформы каждый месяц
                </h2>
                <p className="mt-3 max-w-[700px] text-[14px] leading-7 text-[var(--pf-text-muted)]">
                  Ваша ссылка превращает аудиторию в активный доход: приглашайте пользователей, получайте выплаты за
                  подписки и переходите в партнерский статус с пассивным ежемесячным потоком.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Panel className="p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-text-soft)]">
                    Реферальная ссылка
                  </div>
                  <div className="mt-2 truncate text-[13px] font-semibold">{REF_LINK}</div>
                  <div className="mt-3 flex gap-2">
                    <button className="platform-btn-secondary flex-1" onClick={() => handleCopy(REF_LINK, 'link')}>
                      <Copy size={14} /> {copied === 'link' ? 'Скопировано' : 'Копировать'}
                    </button>
                    <button className="platform-btn-secondary" onClick={handleShare}>
                      <Share2 size={14} /> {shareState === 'done' ? 'Готово' : 'Поделиться'}
                    </button>
                  </div>
                </Panel>

                <Panel className="p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-text-soft)]">
                    Промокод
                  </div>
                  <div className="mt-2 text-[18px] font-extrabold tracking-[0.02em]">{REF_CODE}</div>
                  <p className="mt-1 text-[12px] text-[var(--pf-text-dim)]">Для приглашенных: скидка 20% на пополнение.</p>
                  <button className="platform-btn-secondary mt-3 w-full" onClick={() => handleCopy(REF_CODE, 'code')}>
                    <Gift size={14} /> {copied === 'code' ? 'Промокод скопирован' : 'Копировать промокод'}
                  </button>
                </Panel>
              </div>
            </div>

            <Panel className="grid gap-4 p-4 lg:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-[11px] uppercase tracking-[0.08em] text-[var(--pf-text-soft)]">Текущий статус</p>
                  <h3 className="mt-1 mb-0 text-[24px] font-black">
                    {currentLevel === 'partner' ? 'Партнерский уровень' : 'Стартовый уровень'}
                  </h3>
                </div>
                <span className="platform-chip">
                  <Users size={13} /> {currentReferrals} рефералов
                </span>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-[12px] text-[var(--pf-text-muted)]">
                  <span>Прогресс до Partner</span>
                  <strong>{Math.round(levelProgress)}%</strong>
                </div>
                <div className="h-2 rounded-full bg-[var(--pf-surface-3)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(135deg,var(--pf-accent),var(--pf-accent-2))]"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-[12px] text-[var(--pf-text-muted)]">
                  {toPartner > 0
                    ? `Осталось ${toPartner} рефералов до партнерского уровня с ежемесячными выплатами.`
                    : 'Вы в партнерском статусе — получаете ежемесячный процент от подписок.'}
                </p>
              </div>

              <div className="grid gap-2">
                <div className="inline-flex items-center justify-between rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-2 text-[12px]">
                  <span className="text-[var(--pf-text-muted)]">Оценка дохода за следующий месяц</span>
                  <strong className="text-[var(--pf-success)]">{formatRub(stats.forecast)}</strong>
                </div>
                <div className="inline-flex items-center justify-between rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-2 text-[12px]">
                  <span className="text-[var(--pf-text-muted)]">Текущая модель</span>
                  <strong>{currentLevel === 'partner' ? 'Ежемесячные выплаты' : 'Разовые выплаты'}</strong>
                </div>
              </div>
            </Panel>
          </div>
        </SectionCard>

        <section className="grid gap-4 xl:grid-cols-2">
          <SectionCard>
            <div className="platform-section-head">
              <h3 className="m-0 text-[18px] font-extrabold">Уровни программы</h3>
            </div>
            <div className="grid gap-3">
              <Panel
                className="p-4"
                style={{
                  borderColor: currentLevel === 'starter' ? 'rgba(110, 139, 255, 0.42)' : 'var(--pf-border)',
                  background: currentLevel === 'starter' ? 'var(--pf-accent-soft)' : 'var(--pf-surface-2)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[15px]">Старт</strong>
                  <span className="platform-chip">Для всех пользователей</span>
                </div>
                <ul className="mt-3 mb-0 grid gap-2 pl-4 text-[13px] text-[var(--pf-text-muted)]">
                  <li>Собственный промокод с мгновенным запуском.</li>
                  <li>До 30% разово с каждой покупки подписки.</li>
                  <li>Приглашенный пользователь получает 20% скидку на пополнение.</li>
                </ul>
              </Panel>

              <Panel
                className="p-4"
                style={{
                  borderColor: currentLevel === 'partner' ? 'rgba(110, 139, 255, 0.42)' : 'var(--pf-border)',
                  background: currentLevel === 'partner' ? 'var(--pf-accent-soft)' : 'var(--pf-surface-2)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[15px]">Партнер (50+ рефералов)</strong>
                  <span className="platform-chip">Пассивный доход</span>
                </div>
                <ul className="mt-3 mb-0 grid gap-2 pl-4 text-[13px] text-[var(--pf-text-muted)]">
                  <li>До 30% с подписок ежемесячно, а не разово.</li>
                  <li>Потенциал дохода от 10 000 ₽/мес и выше без потолка.</li>
                  <li>Ранний вход дает повышенный процент и преимущество в росте.</li>
                </ul>
              </Panel>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="platform-section-head">
              <h3 className="m-0 text-[18px] font-extrabold">Как масштабировать доход</h3>
            </div>
            <div className="grid gap-2">
              {[
                'Записывайте короткие обзоры платформы и добавляйте ссылку в описании.',
                'Публикуйте кейсы в Telegram и профильных сообществах.',
                'Запускайте связки YouTube / TikTok / Shorts с промокодом.',
                'Ведите живую воронку: контент -> ссылка -> регистрация -> подписка.',
              ].map(item => (
                <div
                  key={item}
                  className="inline-flex items-start gap-2 rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-2"
                >
                  <CheckCircle2 size={14} className="mt-[2px] shrink-0 text-[var(--pf-accent)]" />
                  <span className="text-[13px] text-[var(--pf-text-muted)]">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[12px] border border-[rgba(110,139,255,0.34)] bg-[var(--pf-accent-soft)] p-3">
              <div className="inline-flex items-center gap-2 text-[15px] font-bold">
                <Megaphone size={15} />
                Нужны индивидуальные условия?
              </div>
              <p className="mt-1 mb-0 text-[13px] text-[var(--pf-text-muted)]">
                Для крупных партнеров и авторов контента согласуем персональные проценты и формат сотрудничества.
              </p>
              <Link href="/platform/chats" className="platform-btn-primary mt-3 w-full sm:w-auto">
                <LifeBuoy size={14} /> Написать в поддержку
              </Link>
            </div>
          </SectionCard>
        </section>

        <KpiGrid>
          <KpiCard>
            <div className="flex items-center justify-between gap-2">
              <span className="platform-kpi-meta">Переходы по ссылке</span>
              <Users size={15} color="var(--pf-accent)" />
            </div>
            <strong className="text-[24px] font-black">{stats.clicks.toLocaleString('ru-RU')}</strong>
            <span className="platform-kpi-meta">Конверсия в регистрацию: 7.9%</span>
          </KpiCard>

          <KpiCard>
            <div className="flex items-center justify-between gap-2">
              <span className="platform-kpi-meta">Регистрации</span>
              <Rocket size={15} color="var(--pf-accent)" />
            </div>
            <strong className="text-[24px] font-black">{stats.registrations.toLocaleString('ru-RU')}</strong>
            <span className="platform-kpi-meta">{stats.active} активных рефералов</span>
          </KpiCard>

          <KpiCard>
            <div className="flex items-center justify-between gap-2">
              <span className="platform-kpi-meta">Покупки подписок</span>
              <BadgePercent size={15} color="var(--pf-accent)" />
            </div>
            <strong className="text-[24px] font-black">{stats.purchases}</strong>
            <span className="platform-kpi-meta">CR из регистрации: 23.2%</span>
          </KpiCard>

          <KpiCard>
            <div className="flex items-center justify-between gap-2">
              <span className="platform-kpi-meta">Общий заработок</span>
              <Wallet size={15} color="var(--pf-success)" />
            </div>
            <strong className="text-[24px] font-black">{formatRub(stats.totalIncome)}</strong>
            <span className="platform-kpi-meta">С запуска программы</span>
          </KpiCard>
        </KpiGrid>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <SectionCard>
            <div className="platform-section-head">
              <div className="inline-flex items-center gap-2 text-[16px] font-bold">
                <LineChart size={16} color="var(--pf-accent)" />
                Динамика дохода
              </div>
              <span className="platform-chip">Последние 6 месяцев</span>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={earningsTrend} margin={{ top: 8, right: 10, left: -6, bottom: 4 }}>
                <defs>
                  <linearGradient id="pfReferralIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(110,139,255,0.48)" />
                    <stop offset="100%" stopColor="rgba(110,139,255,0.03)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--pf-text-dim)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--pf-text-dim)', fontSize: 11 }} width={48} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--pf-surface-2)',
                    border: '1px solid var(--pf-border-strong)',
                    borderRadius: 10,
                    color: '#fff',
                  }}
                  formatter={(value: number) => [formatRub(value), 'Доход']}
                />
                <Area type="monotone" dataKey="income" stroke="var(--pf-accent)" strokeWidth={2} fill="url(#pfReferralIncome)" />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard className="grid content-start gap-3">
            <h3 className="m-0 text-[16px] font-bold">Финансовый итог периода</h3>
            <div className="rounded-[12px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
              <div className="text-[12px] text-[var(--pf-text-muted)]">Начисления за период</div>
              <div className="mt-1 text-[28px] font-black">{formatRub(stats.periodPayout)}</div>
            </div>
            <div className="rounded-[12px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
              <div className="text-[12px] text-[var(--pf-text-muted)]">Ожидают подтверждения</div>
              <div className="mt-1 text-[22px] font-extrabold text-[var(--pf-warning)]">{formatRub(stats.pendingIncome)}</div>
            </div>
            <div className="rounded-[12px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
              <div className="text-[12px] text-[var(--pf-text-muted)]">Прогноз следующего месяца</div>
              <div className="mt-1 text-[22px] font-extrabold text-[var(--pf-success)]">{formatRub(stats.forecast)}</div>
            </div>
          </SectionCard>
        </section>

        <SectionCard className="p-0 overflow-hidden">
          <div className="platform-section-head px-4 pt-4">
            <div className="inline-flex items-center gap-2 text-[16px] font-bold">
              <Wallet size={16} color="var(--pf-accent)" />
              Последние начисления
            </div>
            <span className="platform-kpi-meta">Показываем реальные конверсии и статус выплат</span>
          </div>

          <div className="platform-desktop-table">
            <DataTableWrap className="tablet-dense-scroll">
              <table className="platform-table" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Реферал</th>
                    <th>Тариф</th>
                    <th style={{ textAlign: 'right' }}>Покупка</th>
                    <th style={{ textAlign: 'right' }}>Вознаграждение</th>
                    <th>Статус</th>
                    <th style={{ textAlign: 'right' }}>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {latestEvents.map(event => (
                    <tr key={event.id}>
                      <td>{event.id}</td>
                      <td>{event.user}</td>
                      <td>{event.plan}</td>
                      <td style={{ textAlign: 'right' }}>{formatRub(event.amount)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--pf-success)' }}>
                        {formatRub(event.reward)}
                      </td>
                      <td>
                        <span className={event.status === 'accrued' ? 'badge-active' : 'badge-dispute'}>
                          {event.status === 'accrued' ? 'Начислено' : 'Ожидает'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--pf-text-dim)' }}>{event.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableWrap>
          </div>

          <div className="platform-mobile-cards">
            {latestEvents.map(event => (
              <article key={event.id} className="platform-mobile-card">
                <div className="platform-mobile-card-head">
                  <strong>{event.user}</strong>
                  <span className={event.status === 'accrued' ? 'badge-active' : 'badge-dispute'}>
                    {event.status === 'accrued' ? 'Начислено' : 'Ожидает'}
                  </span>
                </div>
                <div className="platform-mobile-meta">
                  <span>ID: {event.id}</span>
                  <span>Тариф: {event.plan}</span>
                  <span>Покупка: {formatRub(event.amount)}</span>
                  <span>Вознаграждение: {formatRub(event.reward)}</span>
                  <span>Дата: {event.date}</span>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </PageShell>
    </motion.div>
  );
}
