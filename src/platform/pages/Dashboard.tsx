'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { BookOpen, Bot, FileText, Loader2, MessageCircle, Package, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { dashboardApi, DashboardData } from '@/lib/api';
import { PageHeader, PageShell, PageTitle, RequestErrorState, SectionCard } from '@/platform/components/primitives';

const WHATS_NEW = [
  {
    tag: 'Блог',
    title: 'Как автоматически поднимать лоты на FunPay',
    description: 'Пошаговый разбор настроек автоподнятия и типовые ошибки, которые режут выдачу.',
    href: '/blog/avtopodnyatie-lotov-funpay',
    external: false,
    action: 'Читать →',
  },
  {
    tag: 'Обновление',
    title: 'Новый realtime pipeline чатов',
    description: 'Улучшили подтверждение сообщений и надёжность доставки при переподключениях.',
    href: '/platform/chats',
    external: false,
    action: 'Подробнее →',
  },
  {
    tag: 'Совет',
    title: 'Соберите быстрый шаблон ответов',
    description: 'Добавьте 3 коротких шаблона под частые запросы и ускорьте первую реакцию в диалоге.',
    href: '/platform/automation',
    external: false,
    action: 'Открыть →',
  },
];

function workerStatusText(active: boolean, count: number, total: number): string {
  if (total <= 0) return 'Нет активных аккаунтов';
  return active ? `Активен (${count}/${total})` : `Остановлен (0/${total})`;
}

function WorkerStatusDot({ active, color }: { active: boolean; color: string }) {
  return (
    <span
      className="h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: active ? color : 'var(--pf-text-soft)' }}
      aria-hidden
    />
  );
}

export default function Dashboard() {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

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
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % WHATS_NEW.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const node = track.children.item(activeSlide) as HTMLElement | null;
    if (!node) return;
    track.scrollTo({ left: node.offsetLeft, behavior: 'smooth' });
  }, [activeSlide]);

  const workerSummary = useMemo(() => {
    const total = Number(dashData?.accounts_count || 0);
    const runnerCount = Number(dashData?.runner_active_count || 0);
    const keeperCount = Number(dashData?.keeper_active_count || 0);
    const raiserCount = Number(dashData?.raiser_active_count || 0);

    return {
      total,
      runner: {
        active: Boolean(dashData?.runner_active),
        count: runnerCount,
      },
      keeper: {
        active: Boolean(dashData?.keeper_active),
        count: keeperCount,
      },
      raiser: {
        active: Boolean(dashData?.raiser_active),
        count: raiserCount,
      },
    };
  }, [dashData]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Медиахаб платформы"
            subtitle="Новости, полезные материалы и быстрые входы в ключевые разделы FunPay Cloud."
          />
        </PageHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
          </div>
        ) : loadError ? (
          <SectionCard>
            <RequestErrorState message={loadError} onRetry={() => setReloadKey(prev => prev + 1)} />
          </SectionCard>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <SectionCard className="px-3 py-0 sm:px-4">
              <div className="scrollbar-hide flex h-10 items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
                <div className="inline-flex items-center gap-2 text-xs sm:text-sm">
                  <WorkerStatusDot active={workerSummary.runner.active} color="var(--pf-accent)" />
                  <span className="font-semibold">Runner</span>
                  <span className="text-[var(--pf-text-dim)]">
                    {workerStatusText(workerSummary.runner.active, workerSummary.runner.count, workerSummary.total)}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 text-xs sm:text-sm">
                  <WorkerStatusDot active={workerSummary.keeper.active} color="var(--pf-success)" />
                  <span className="font-semibold">Keeper</span>
                  <span className="text-[var(--pf-text-dim)]">
                    {workerStatusText(workerSummary.keeper.active, workerSummary.keeper.count, workerSummary.total)}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 text-xs sm:text-sm">
                  <WorkerStatusDot active={workerSummary.raiser.active} color="var(--pf-warning)" />
                  <span className="font-semibold">Raiser</span>
                  <span className="text-[var(--pf-text-dim)]">
                    {workerStatusText(workerSummary.raiser.active, workerSummary.raiser.count, workerSummary.total)}
                  </span>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="m-0 text-[15px] font-bold">Что нового</h2>
                <span className="text-xs text-[var(--pf-text-dim)]">Автопрокрутка каждые 5 секунд</span>
              </div>

              <div
                ref={trackRef}
                className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
                aria-label="Карусель обновлений"
              >
                {WHATS_NEW.map(item => (
                  <article
                    key={item.title}
                    className="group flex min-h-[188px] w-full min-w-full shrink-0 snap-start flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--accent)] sm:min-h-[196px] sm:min-w-[280px] sm:max-w-[280px]"
                  >
                    <span
                      className="mb-3 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        background: 'color-mix(in srgb, var(--accent, var(--pf-accent)) 14%, transparent)',
                        color: 'var(--accent, var(--pf-accent))',
                      }}
                    >
                      {item.tag}
                    </span>
                    <h3 className="mb-2 text-sm font-semibold text-[var(--pf-text)]">{item.title}</h3>
                    <p className="mb-4 text-xs leading-relaxed text-[var(--pf-text-muted)]">{item.description}</p>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-auto inline-flex text-xs font-semibold"
                        style={{ color: 'var(--accent, var(--pf-accent))' }}
                      >
                        {item.action}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="mt-auto inline-flex text-xs font-semibold"
                        style={{ color: 'var(--accent, var(--pf-accent))' }}
                      >
                        {item.action}
                      </Link>
                    )}
                  </article>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5">
                {WHATS_NEW.map((item, idx) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className="h-2 w-2 rounded-full transition-opacity"
                    style={{
                      background: idx === activeSlide ? 'var(--accent, var(--pf-accent))' : 'var(--pf-text-soft)',
                      opacity: idx === activeSlide ? 1 : 0.65,
                    }}
                    aria-label={`Перейти к карточке ${idx + 1}`}
                  />
                ))}
              </div>
            </SectionCard>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <article
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--accent)]"
              >
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pf-accent-soft)] text-[var(--pf-accent)]">
                  <Send size={17} />
                </span>
                <h3 className="text-sm font-semibold text-[var(--pf-text)]">Telegram канал</h3>
                <p className="mt-2 text-xs text-[var(--pf-text-muted)]">Новости, обновления и советы</p>
                <a
                  href="https://t.me/funpaycloud"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-xs font-semibold"
                  style={{ color: 'var(--accent, var(--pf-accent))' }}
                >
                  Подписаться →
                </a>
              </article>

              <article
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--accent)]"
              >
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pf-accent-soft)] text-[var(--pf-accent)] text-sm font-bold">
                  VK
                </span>
                <h3 className="text-sm font-semibold text-[var(--pf-text)]">Группа ВКонтакте</h3>
                <p className="mt-2 text-xs text-[var(--pf-text-muted)]">Обсуждения и кейсы продавцов</p>
                <a
                  href="https://vk.com/funpaycloud"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-xs font-semibold"
                  style={{ color: 'var(--accent, var(--pf-accent))' }}
                >
                  Вступить →
                </a>
              </article>

              <article
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--accent)]"
              >
                <span
                  className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--pf-success)]"
                  style={{ background: 'color-mix(in srgb, var(--pf-success) 20%, transparent)' }}
                >
                  <MessageCircle size={17} />
                </span>
                <h3 className="text-sm font-semibold text-[var(--pf-text)]">Поддержка</h3>
                <p className="mt-2 text-xs text-[var(--pf-text-muted)]">Ответим в течение 30 минут</p>
                <a
                  href="https://t.me/funpaycloud_support"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-xs font-semibold"
                  style={{ color: 'var(--accent, var(--pf-accent))' }}
                >
                  Написать →
                </a>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <article
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--accent)]"
              >
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pf-accent-soft)] text-[var(--pf-accent)]">
                  <BookOpen size={17} />
                </span>
                <h3 className="text-sm font-semibold text-[var(--pf-text)]">Документация</h3>
                <p className="mt-2 text-xs text-[var(--pf-text-muted)]">
                  Подробные инструкции по настройке аккаунтов, чатов, лотов и автоматизации.
                </p>
                <Link href="/docs" className="mt-4 inline-flex text-xs font-semibold" style={{ color: 'var(--accent, var(--pf-accent))' }}>
                  Открыть документацию →
                </Link>
              </article>

              <article
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--accent)]"
              >
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pf-accent-soft)] text-[var(--pf-accent)]">
                  <FileText size={17} />
                </span>
                <h3 className="text-sm font-semibold text-[var(--pf-text)]">Блог</h3>
                <p className="mt-2 text-xs text-[var(--pf-text-muted)]">
                  Практические материалы и кейсы, которые помогают продавцам расти быстрее.
                </p>
                <Link href="/blog" className="mt-4 inline-flex text-xs font-semibold" style={{ color: 'var(--accent, var(--pf-accent))' }}>
                  Читать статьи →
                </Link>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <article
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--accent)]"
              >
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pf-accent-soft)] text-[var(--pf-accent)]">
                  <Sparkles size={17} />
                </span>
                <h3 className="text-sm font-semibold text-[var(--pf-text)]">Автоподнятие лотов</h3>
                <p className="mt-2 text-xs text-[var(--pf-text-muted)]">Лоты поднимаются автоматически по расписанию</p>
              </article>

              <article
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--accent)]"
              >
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pf-accent-soft)] text-[var(--pf-accent)]">
                  <Bot size={17} />
                </span>
                <h3 className="text-sm font-semibold text-[var(--pf-text)]">AI автоответы</h3>
                <p className="mt-2 text-xs text-[var(--pf-text-muted)]">Нейронка отвечает покупателям 24/7</p>
              </article>

              <article
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--accent)]"
              >
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pf-accent-soft)] text-[var(--pf-accent)]">
                  <Package size={17} />
                </span>
                <h3 className="text-sm font-semibold text-[var(--pf-text)]">Автовыдача товаров</h3>
                <p className="mt-2 text-xs text-[var(--pf-text-muted)]">Товары выдаются мгновенно после оплаты</p>
              </article>
            </section>
          </div>
        )}
      </PageShell>
    </motion.div>
  );
}
