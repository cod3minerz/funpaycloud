'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  FileText,
  Loader2,
  MessageCircle,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { ApiChat, ApiOrder, dashboardApi, DashboardData } from '@/lib/api';
import { PageHeader, PageShell, PageTitle, RequestErrorState } from '@/platform/components/primitives';

type Banner = {
  tag: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  external?: boolean;
  gradientClass: string;
  tagClass: string;
  textClass: string;
  mutedClass: string;
  ctaClass: string;
  decorationClass: string;
  decorationSecondaryClass: string;
};

type Feature = {
  title: string;
  desc: string;
};

const BANNERS: Banner[] = [
  {
    tag: 'БЛОГ',
    title: 'Как автоматически поднимать лоты на FunPay',
    description: 'Пошаговый разбор настроек автоподнятия и ошибок, которые режут выдачу.',
    href: '/blog/avtopodnyatie-lotov-funpay',
    cta: 'Читать статью',
    gradientClass: 'bg-[linear-gradient(135deg,#0f2744_0%,#1e40af_60%,#2563eb_100%)]',
    tagClass: 'text-blue-300',
    textClass: 'text-white',
    mutedClass: 'text-blue-200/80',
    ctaClass: 'bg-white/20 hover:bg-white/30 text-white',
    decorationClass: 'bg-blue-400/10',
    decorationSecondaryClass: 'bg-blue-300/10',
  },
  {
    tag: 'ОБНОВЛЕНИЕ',
    title: 'Стабильный realtime чатов в проде',
    description: 'Ускорили подтверждение исходящих и усилили обработку reconnect в веб-сокетах.',
    href: '/platform/chats',
    cta: 'Подробнее',
    gradientClass: 'bg-[linear-gradient(135deg,#2d1b69_0%,#5b21b6_50%,#7c3aed_100%)]',
    tagClass: 'text-violet-200',
    textClass: 'text-white',
    mutedClass: 'text-violet-200/80',
    ctaClass: 'bg-white/20 hover:bg-white/30 text-white',
    decorationClass: 'bg-violet-300/10',
    decorationSecondaryClass: 'bg-fuchsia-300/10',
  },
  {
    tag: 'СОВЕТ',
    title: 'Соберите 3 быстрых шаблона ответа',
    description: 'Сократите время первой реакции в чате и удерживайте покупателя в диалоге.',
    href: '/platform/automation',
    cta: 'Открыть раздел',
    gradientClass: 'bg-[linear-gradient(135deg,#064e3b_0%,#065f46_50%,#047857_100%)]',
    tagClass: 'text-emerald-200',
    textClass: 'text-white',
    mutedClass: 'text-emerald-200/80',
    ctaClass: 'bg-white/20 hover:bg-white/30 text-white',
    decorationClass: 'bg-emerald-300/10',
    decorationSecondaryClass: 'bg-teal-300/10',
  },
];

const FEATURES: Feature[] = [
  { title: 'Автоподнятие лотов', desc: 'По расписанию или вручную' },
  { title: 'AI автоответы', desc: 'Нейронка отвечает 24/7' },
  { title: 'Автовыдача товаров', desc: 'Мгновенно после оплаты' },
];

function parseISO(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getLatestEventDate(chats: ApiChat[], orders: ApiOrder[]): Date | null {
  const timestamps: Date[] = [];
  chats.forEach(chat => {
    const d = parseISO(chat.updated_at);
    if (d) timestamps.push(d);
  });
  orders.forEach(order => {
    const d = parseISO(order.created_at);
    if (d) timestamps.push(d);
  });
  if (timestamps.length === 0) return null;
  return timestamps.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest,
  );
}

function formatAgo(date: Date | null, nowMs: number): string {
  if (!date) return '—';
  const diffMs = Math.max(0, nowMs - date.getTime());
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'только что';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}м назад`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}ч назад`;
  const days = Math.floor(hours / 24);
  return `${days}д назад`;
}

function WorkerDot({ active, color }: { active: boolean; color: 'emerald' | 'blue' | 'amber' }) {
  const colors = {
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
  } as const;

  const inactiveClass = 'bg-slate-600';

  return (
    <span className="relative inline-flex h-2 w-2">
      <span className={`h-2 w-2 rounded-full ${active ? colors[color] : inactiveClass}`} />
      {active ? (
        <span
          className={`absolute inset-0 h-2 w-2 rounded-full ${colors[color]} animate-ping opacity-40`}
          aria-hidden
        />
      ) : null}
    </span>
  );
}

function BannerAction({ href, external, cta, className }: { href: string; external?: boolean; cta: string; className: string }) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${className}`}
      >
        {cta}
        <ArrowRight size={14} />
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${className}`}
    >
      {cta}
      <ArrowRight size={14} />
    </Link>
  );
}

export default function Dashboard() {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    dashboardApi
      .get()
      .then(data => {
        if (cancelled) return;
        setDashData(data);
      })
      .catch(err => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Ошибка загрузки дашборда';
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    const carouselTimer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % BANNERS.length);
    }, 5000);

    return () => {
      clearInterval(carouselTimer);
    };
  }, []);

  useEffect(() => {
    const relativeTimer = setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);

    return () => {
      clearInterval(relativeTimer);
    };
  }, []);

  const status = useMemo(() => {
    const total = Number(dashData?.accounts_count ?? 0);
    return {
      total,
      runner: {
        active: Boolean(dashData?.runner_active),
        count: Number(dashData?.runner_active_count ?? 0),
      },
      keeper: {
        active: Boolean(dashData?.keeper_active),
        count: Number(dashData?.keeper_active_count ?? 0),
      },
      raiser: {
        active: Boolean(dashData?.raiser_active),
        count: Number(dashData?.raiser_active_count ?? 0),
      },
      lastEvent: getLatestEventDate(dashData?.recent_chats ?? [], dashData?.recent_orders ?? []),
    };
  }, [dashData]);

  return (
    <PageShell>
      <PageHeader>
        <PageTitle
          title="Медиахаб платформы"
          subtitle="Важные обновления, сообщество и быстрый доступ к ключевым разделам FunPay Cloud."
        />
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <RequestErrorState message={loadError} onRetry={() => setReloadKey(prev => prev + 1)} />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          <section className="mb-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-sm sm:px-5">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
              <div className="inline-flex items-center gap-2">
                <WorkerDot active={status.runner.active} color="emerald" />
                <span className="text-xs text-slate-400">Runner</span>
                <span className="text-xs font-medium text-emerald-400">
                  {status.runner.active ? `активен (${status.runner.count}/${status.total})` : 'остановлен'}
                </span>
              </div>

              <div className="hidden h-3 w-px bg-white/10 sm:block" />

              <div className="inline-flex items-center gap-2">
                <WorkerDot active={status.keeper.active} color="blue" />
                <span className="text-xs text-slate-400">Keeper</span>
                <span className="text-xs font-medium text-blue-400">
                  {status.keeper.active ? `онлайн (${status.keeper.count}/${status.total})` : 'оффлайн'}
                </span>
              </div>

              <div className="hidden h-3 w-px bg-white/10 sm:block" />

              <div className="inline-flex items-center gap-2">
                <WorkerDot active={status.raiser.active} color="amber" />
                <span className="text-xs text-slate-400">Raiser</span>
                <span className="text-xs font-medium text-amber-400">
                  {status.raiser.active ? `запущен (${status.raiser.count}/${status.total})` : 'пауза'}
                </span>
              </div>

              <div className="text-xs text-slate-500 sm:ml-auto">
                Последнее событие: <span className="text-slate-400">{formatAgo(status.lastEvent, nowMs)}</span>
              </div>
            </div>
          </section>

          <section>
            <div className="relative h-40 overflow-hidden rounded-2xl sm:h-48" aria-label="Карусель баннеров">
              {BANNERS.map((banner, idx) => {
                const isActive = idx === activeSlide;
                return (
                  <article
                    key={banner.title}
                    className={`absolute inset-0 ${banner.gradientClass} transition-all duration-500 ease-out ${
                      isActive ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 pointer-events-none'
                    }`}
                    aria-hidden={!isActive}
                  >
                    <div className={`absolute -right-6 -top-12 h-52 w-52 rounded-full ${banner.decorationClass}`} />
                    <div className={`absolute bottom-0 right-12 h-32 w-32 translate-y-8 rounded-full ${banner.decorationSecondaryClass}`} />

                    <div className="relative flex h-full max-w-[620px] flex-col justify-center px-5 sm:px-8">
                      <span className={`mb-2 text-[10px] font-semibold tracking-[0.2em] ${banner.tagClass}`}>
                        {banner.tag}
                      </span>
                      <h2 className={`mb-2 text-base font-bold leading-tight sm:text-xl ${banner.textClass}`}>
                        {banner.title}
                      </h2>
                      <p className={`mb-4 text-xs sm:text-sm ${banner.mutedClass}`}>{banner.description}</p>
                      <BannerAction href={banner.href} external={banner.external} cta={banner.cta} className={banner.ctaClass} />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-3 flex justify-center gap-1.5">
              {BANNERS.map((banner, idx) => (
                <button
                  key={banner.title}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Показать баннер ${idx + 1}`}
                  className={`h-0.5 rounded-full transition-all duration-300 ${
                    idx === activeSlide ? 'w-6 bg-blue-400' : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article className="group relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-950/50 to-blue-900/20 p-5 transition-all hover:border-blue-500/40">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-500/10" />

              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
                  <Send size={18} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Telegram канал</div>
                  <div className="mt-0.5 text-xs text-slate-400">2 400 подписчиков</div>
                </div>
              </div>

              <p className="mb-4 text-xs text-slate-400">Новости платформы, обновления и эксклюзивные советы</p>
              <a
                href="https://t.me/funpaycloud"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 transition-colors group-hover:text-blue-300"
              >
                Подписаться
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </article>

            <article className="group rounded-xl border border-[#4C75A3]/20 bg-gradient-to-br from-[#4C75A3]/10 to-transparent p-5 transition-colors hover:border-[#4C75A3]/45">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4C75A3]/20 text-sm font-bold text-[#8fb4de]">
                  VK
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Группа ВКонтакте</div>
                  <div className="mt-0.5 text-xs text-slate-400">Кейсы и обсуждения продавцов</div>
                </div>
              </div>

              <p className="mb-4 text-xs text-slate-400">Разборы ниш, связки и реальные результаты участников сообщества</p>
              <a
                href="https://vk.com/funpaycloud"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8fb4de] transition-colors group-hover:text-[#b3d2f4]"
              >
                Вступить
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </article>

            <article className="group rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-transparent p-5 transition-colors hover:border-emerald-500/45 sm:col-span-2 xl:col-span-1">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                    <MessageCircle size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Поддержка</div>
                    <div className="mt-0.5 text-xs text-slate-400">Поможем с настройкой и ошибками</div>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  ~ 30 мин
                </span>
              </div>

              <p className="mb-4 text-xs text-slate-400">Если что-то сломалось — команда на связи и помогает восстановить поток продаж.</p>
              <a
                href="https://t.me/funpaycloud_support"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 transition-colors group-hover:text-emerald-200"
              >
                Написать
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </article>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="grid grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <Link
                href="/docs"
                className="group flex items-center gap-4 p-5 transition-colors hover:bg-white/[0.03] sm:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10">
                  <BookOpen size={20} className="text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 text-sm font-semibold text-white">Документация</div>
                  <div className="text-xs text-slate-500">Подробные инструкции по всем функциям</div>
                </div>
                <ArrowRight size={16} className="text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-slate-400" />
              </Link>

              <Link
                href="/blog"
                className="group flex items-center gap-4 p-5 transition-colors hover:bg-white/[0.03] sm:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10">
                  <FileText size={20} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 text-sm font-semibold text-white">Блог</div>
                  <div className="text-xs text-slate-500">Кейсы и советы для продавцов</div>
                </div>
                <ArrowRight size={16} className="text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-slate-400" />
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.06] p-5 sm:p-6">
            <div className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Возможности платформы</div>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-white/[0.04] sm:grid-cols-2 xl:grid-cols-3">
              {FEATURES.map((feature, idx) => (
                <article key={feature.title} className="group bg-[var(--bg)] p-5 transition-colors hover:bg-white/[0.02]">
                  <div className="mb-3 text-2xl font-bold text-white/10 transition-colors group-hover:text-white/20">
                    {`0${idx + 1}`}
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-white">{feature.title}</h3>
                  <p className="text-xs text-slate-500">{feature.desc}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
