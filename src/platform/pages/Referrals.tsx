import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { settingsApi } from '@/lib/api';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  BadgePercent,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  LifeBuoy,
  LineChart,
  Loader2,
  Megaphone,
  Rocket,
  Share2,
  TrendingUp,
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
  source: string;
  plan: string;
  amount: number;
  reward: number;
  status: 'accrued' | 'pending';
  date: string;
};

const PARTNER_THRESHOLD = 50;

const earningsTrend = [
  { month: 'Ноя', income: 9800, referrals: 11 },
  { month: 'Дек', income: 12600, referrals: 16 },
  { month: 'Янв', income: 17400, referrals: 22 },
  { month: 'Фев', income: 21300, referrals: 28 },
  { month: 'Мар', income: 26500, referrals: 33 },
  { month: 'Апр', income: 31800, referrals: 38 },
];

const growthScenarios = [
  'Показывайте в видео, как используете автоматизацию в своей рутине.',
  'Делайте короткие разборы кейсов и оставляйте ссылку в описании.',
  'Публикуйте промокод в Telegram и профильных сообществах.',
  'Добавляйте ссылку в закрепы, шапки каналов и FAQ для аудитории.',
];

const latestEvents: ReferralEvent[] = [
  {
    id: 'RF-3891',
    user: 'andrey_stream',
    source: 'YouTube',
    plan: 'Pro',
    amount: 6990,
    reward: 2097,
    status: 'accrued',
    date: '08.04 12:20',
  },
  {
    id: 'RF-3888',
    user: 'lena_game',
    source: 'Telegram',
    plan: 'Start',
    amount: 2990,
    reward: 897,
    status: 'accrued',
    date: '08.04 10:06',
  },
  {
    id: 'RF-3879',
    user: 'grom_youtube',
    source: 'YouTube',
    plan: 'Team',
    amount: 14990,
    reward: 2998,
    status: 'pending',
    date: '07.04 21:43',
  },
  {
    id: 'RF-3865',
    user: 'x_sniper_x',
    source: 'TikTok',
    plan: 'Pro',
    amount: 6990,
    reward: 1398,
    status: 'pending',
    date: '07.04 18:57',
  },
  {
    id: 'RF-3850',
    user: 'farm_builder',
    source: 'VK',
    plan: 'Start',
    amount: 2990,
    reward: 897,
    status: 'accrued',
    date: '07.04 14:12',
  },
];

function formatRub(value: number) {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export default function Referrals() {
  const [loading, setLoading] = useState(true);
  const [refCode, setRefCode] = useState('');
  const [currentReferrals, setCurrentReferrals] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [copied, setCopied] = useState<'link' | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'done'>('idle');

  useEffect(() => {
    settingsApi
      .getReferral()
      .then(data => {
        setRefCode(data.referral_code);
        setCurrentReferrals(data.referrals);
        setTotalEarned(data.total_earned);
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Ошибка загрузки реферальных данных'))
      .finally(() => setLoading(false));
  }, []);

  const refLink = refCode ? `https://funpay.cloud/r/${refCode}` : '';

  const currentLevel: ReferralLevel = currentReferrals >= PARTNER_THRESHOLD ? 'partner' : 'starter';
  const toPartner = Math.max(PARTNER_THRESHOLD - currentReferrals, 0);
  const levelProgress = Math.min((currentReferrals / PARTNER_THRESHOLD) * 100, 100);

  const stats = useMemo(
    () => ({
      clicks: 6432,
      registrations: 512,
      active: 173,
      purchases: 119,
      totalIncome: totalEarned,
      pendingIncome: 17340,
      periodPayout: 74210,
      forecast: 39100,
      conversion: 7.9,
    }),
    [totalEarned],
  );

  async function handleCopyLink() {
    if (!refLink) return;
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied('link');
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  }

  async function handleShare() {
    if (!refLink) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'FunPay Cloud',
          text: 'Подключайтесь к FunPay Cloud по моей ссылке.',
          url: refLink,
        });
      } else {
        await navigator.clipboard.writeText(refLink);
      }
      setShareState('done');
      window.setTimeout(() => setShareState('idle'), 1700);
    } catch {
      setShareState('idle');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Реферальная система"
            subtitle="Отдельный growth-раздел: подключайте аудиторию к платформе и отслеживайте доход в одном месте."
          />
        </PageHeader>

        <SectionCard className="platform-referral-hero p-0 overflow-hidden">
          <div className="platform-referral-hero-grid grid gap-4 p-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,1fr)] lg:p-5">
            <div className="platform-referral-hero-main grid gap-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(110,139,255,0.35)] bg-[var(--pf-accent-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--pf-text-muted)]">
                <CircleDollarSign size={13} />
                До 30% вознаграждения • без потолка по заработку
              </div>

              <div>
                <h2 className="m-0 text-[clamp(26px,3.8vw,40px)] font-black leading-[1.06] tracking-[-0.025em]">
                  Реферальная система как канал стабильного дохода
                </h2>
                <p className="mt-3 max-w-[760px] text-[14px] leading-7 text-[var(--pf-text-muted)]">
                  Механика простая: делитесь ссылкой, приглашайте пользователей и фиксируйте доход с подписок. Это
                  удобно для тех, кто показывает платформу в видео, постах и комьюнити.
                </p>
              </div>

              <Panel className="p-3 sm:p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-text-soft)]">
                  Ваша реферальная ссылка
                </div>
                <div className="mt-2 rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-2 text-[13px] font-semibold">
                  <span className="block truncate">{refLink || '—'}</span>
                </div>
                <div className="platform-referral-actions mt-3">
                  <button className="platform-btn-primary w-full" onClick={handleCopyLink}>
                    <Copy size={14} /> {copied === 'link' ? 'Ссылка скопирована' : 'Скопировать ссылку'}
                  </button>
                  <button className="platform-btn-secondary w-full" onClick={handleShare}>
                    <Share2 size={14} /> {shareState === 'done' ? 'Готово' : 'Поделиться'}
                  </button>
                </div>
              </Panel>

              <Panel className="platform-referral-influencer p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <span className="platform-referral-influencer-badge">Creator / Media Program</span>
                    <div className="platform-youtube-lockup">
                      <span className="platform-youtube-mark" aria-hidden="true">
                        <span className="platform-youtube-mark-play" />
                      </span>
                      <span className="platform-youtube-wordmark">YouTube</span>
                    </div>
                    <p className="m-0 text-[13px] leading-6 text-[var(--pf-text-muted)]">
                      Если у вас канал или активное сообщество, подключим персональные условия, отдельный промокод для
                      аудитории и расширенные выплаты.
                    </p>
                  </div>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 text-[12px] text-[#ffd7dd]">
                  <BadgePercent size={13} />
                  Индивидуальный creator-промокод под вашу аудиторию
                </div>
                <div className="mt-3">
                  <Link href="/platform/chats" className="platform-btn-primary platform-referral-influencer-btn">
                    <LifeBuoy size={14} /> Обсудить сотрудничество
                  </Link>
                </div>
              </Panel>
            </div>

            <Panel className="platform-referral-status-card grid gap-4 p-4 lg:p-5">
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

              <div className="rounded-[10px] border border-[rgba(110,139,255,0.28)] bg-[rgba(110,139,255,0.12)] px-3 py-2 text-[12px] text-[var(--pf-text-muted)]">
                Переход в <strong className="text-[var(--pf-text)]">Partner</strong> открывает ежемесячные выплаты и более
                высокий доход с подписок.
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-[12px] text-[var(--pf-text-muted)]">
                  <span>Прогресс до Partner</span>
                  <strong>{Math.round(levelProgress)}%</strong>
                </div>
                <div className="h-2.5 rounded-full bg-[var(--pf-surface-3)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(135deg,var(--pf-accent),var(--pf-accent-2))]"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <p className="mt-2 mb-0 text-[12px] leading-6 text-[var(--pf-text-muted)]">
                  {toPartner > 0
                    ? `Осталось ${toPartner} приглашений до перехода на ежемесячные партнерские выплаты.`
                    : 'Порог выполнен: вы уже получаете ежемесячный процент с подписок.'}
                </p>
              </div>

              <div className="grid gap-2">
                <div className="inline-flex items-center justify-between rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-2 text-[12px]">
                  <span className="text-[var(--pf-text-muted)]">Доход за текущий период</span>
                  <strong className="text-[var(--pf-success)]">{formatRub(stats.periodPayout)}</strong>
                </div>
                <div className="inline-flex items-center justify-between rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-2 text-[12px]">
                  <span className="text-[var(--pf-text-muted)]">Потенциал следующего месяца</span>
                  <strong>{formatRub(stats.forecast)}</strong>
                </div>
                <div className="inline-flex items-center justify-between rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-2 text-[12px]">
                  <span className="text-[var(--pf-text-muted)]">Логика выплат</span>
                  <strong>{currentLevel === 'partner' ? 'Ежемесячно' : 'Разово за первую покупку'}</strong>
                </div>
              </div>
            </Panel>
          </div>
        </SectionCard>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <SectionCard>
            <div className="platform-section-head">
              <h3 className="m-0 text-[18px] font-extrabold">Условия и уровни</h3>
              <span className="platform-chip">Порог Partner: 50+ рефералов</span>
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
                  <strong className="text-[15px]">Стартовый уровень</strong>
                  <span className="platform-chip">Легкий вход</span>
                </div>
                <ul className="mt-3 mb-0 grid gap-2 pl-4 text-[13px] text-[var(--pf-text-muted)]">
                  <li>Собственный промокод и мгновенный запуск без модерации.</li>
                  <li>До 30% разово с каждой покупки подписки приглашенного пользователя.</li>
                  <li>Для приглашенных действует скидка 20% на пополнение.</li>
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
                  <strong className="text-[15px]">Партнерский уровень</strong>
                  <span className="platform-chip">Доход от подписок ежемесячно</span>
                </div>
                <ul className="mt-3 mb-0 grid gap-2 pl-4 text-[13px] text-[var(--pf-text-muted)]">
                  <li>Открывается от 50+ рефералов.</li>
                  <li>До 30% с каждой подписки ежемесячно, а не единоразово.</li>
                  <li>Доход от 10 000 ₽/мес и выше, без ограничения потолка.</li>
                  <li>Ранний вход дает более высокий персональный процент.</li>
                </ul>
              </Panel>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="platform-section-head">
              <h3 className="m-0 text-[18px] font-extrabold">Как увеличить результат</h3>
            </div>
            <div className="grid gap-2">
              {growthScenarios.map(item => (
                <div
                  key={item}
                  className="inline-flex items-start gap-2 rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-2"
                >
                  <CheckCircle2 size={14} className="mt-[2px] shrink-0 text-[var(--pf-accent)]" />
                  <span className="text-[13px] leading-6 text-[var(--pf-text-muted)]">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[12px] border border-[rgba(110,139,255,0.34)] bg-[var(--pf-accent-soft)] p-3">
              <div className="inline-flex items-center gap-2 text-[15px] font-bold">
                <Megaphone size={15} />
                Нужны индивидуальные условия?
              </div>
              <p className="mt-1 mb-0 text-[13px] leading-6 text-[var(--pf-text-muted)]">
                Для сильных партнеров и создателей контента доступны персональные условия сотрудничества.
              </p>
              <Link href="/platform/chats" className="platform-btn-primary mt-3 w-full sm:w-auto">
                <LifeBuoy size={14} /> Написать в поддержку
              </Link>
            </div>
          </SectionCard>
        </section>

        <SectionCard className="p-0 overflow-hidden">
          <div className="px-4 pt-4">
            <h3 className="m-0 text-[18px] font-extrabold">Статистика</h3>
            <p className="mt-1 mb-0 text-[13px] text-[var(--pf-text-muted)]">
              Отслеживайте конверсию, доход и выплаты, чтобы понимать, какие каналы работают лучше.
            </p>
          </div>

          <div className="p-4">
            <KpiGrid>
              <KpiCard>
                <div className="flex items-center justify-between gap-2">
                  <span className="platform-kpi-meta">Переходы по ссылке</span>
                  <Users size={15} color="var(--pf-accent)" />
                </div>
                <strong className="text-[24px] font-black">{stats.clicks.toLocaleString('ru-RU')}</strong>
                <span className="platform-kpi-meta">Конверсия в регистрацию: {stats.conversion}%</span>
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
                <span className="platform-kpi-meta">Рост к прошлому месяцу +13%</span>
              </KpiCard>

              <KpiCard>
                <div className="flex items-center justify-between gap-2">
                  <span className="platform-kpi-meta">Общий заработок</span>
                  <Wallet size={15} color="var(--pf-success)" />
                </div>
                <strong className="text-[24px] font-black">{formatRub(stats.totalIncome)}</strong>
                <span className="platform-kpi-meta">За всё время</span>
              </KpiCard>
            </KpiGrid>
          </div>
        </SectionCard>

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
            <h3 className="m-0 text-[16px] font-bold">Сводка периода</h3>
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
            <div className="rounded-[12px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] p-3 text-[12px] text-[var(--pf-text-muted)]">
              <div className="inline-flex items-center gap-2 font-semibold text-[var(--pf-text)]">
                <TrendingUp size={14} />
                Что влияет на рост
              </div>
              <p className="mt-1 mb-0 leading-6">
                Лучше всего себя показывают источники с регулярным контентом и повторным касанием аудитории.
              </p>
            </div>
          </SectionCard>
        </section>

        <SectionCard className="p-0 overflow-hidden">
          <div className="platform-section-head px-4 pt-4">
            <div className="inline-flex items-center gap-2 text-[16px] font-bold">
              <Wallet size={16} color="var(--pf-accent)" />
              Последние начисления
            </div>
            <span className="platform-kpi-meta">Конверсии и выплаты по реферальной ссылке</span>
          </div>

          <div className="platform-desktop-table">
            <DataTableWrap className="tablet-dense-scroll">
              <table className="platform-table" style={{ minWidth: 830 }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Реферал</th>
                    <th>Источник</th>
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
                      <td>{event.source}</td>
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
                  <span>Источник: {event.source}</span>
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
