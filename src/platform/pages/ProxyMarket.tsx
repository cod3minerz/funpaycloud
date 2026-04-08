import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpDown,
  BadgeCheck,
  Globe2,
  LayoutGrid,
  List,
  Search,
  Server,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import {
  DataTableWrap,
  EmptyState,
  PageHeader,
  PageShell,
  PageTitle,
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

type ProxyType = 'residential' | 'mobile' | 'datacenter';
type ProxyStatus = 'available' | 'leased';
type ViewMode = 'grid' | 'list';
type SortMode = 'availability' | 'ip';

type ProxyOffer = {
  id: string;
  ip: string;
  country: string;
  city: string;
  type: ProxyType;
  protocol: 'SOCKS5' | 'HTTP';
  status: ProxyStatus;
  speedMs: number;
  priceMonth: number;
};

const GEO_POOL = [
  { country: 'Россия', city: 'Москва' },
  { country: 'Россия', city: 'Санкт-Петербург' },
  { country: 'Германия', city: 'Франкфурт' },
  { country: 'Франция', city: 'Париж' },
  { country: 'Нидерланды', city: 'Амстердам' },
  { country: 'Финляндия', city: 'Хельсинки' },
  { country: 'Польша', city: 'Варшава' },
  { country: 'Турция', city: 'Стамбул' },
  { country: 'Казахстан', city: 'Алматы' },
  { country: 'США', city: 'Нью-Йорк' },
] as const;

const TYPE_LABEL: Record<ProxyType, string> = {
  residential: 'Резидентский',
  mobile: 'Мобильный',
  datacenter: 'Дата-центр',
};

const STATUS_LABEL: Record<ProxyStatus, string> = {
  available: 'Свободен',
  leased: 'Занят',
};

const COUNTRY_CODE: Record<string, string> = {
  Россия: 'RU',
  Германия: 'DE',
  Франция: 'FR',
  Нидерланды: 'NL',
  Финляндия: 'FI',
  Польша: 'PL',
  Турция: 'TR',
  Казахстан: 'KZ',
  США: 'US',
};

function seeded(seed: number) {
  const value = Math.sin(seed * 934.231 + 17.91) * 10000;
  return value - Math.floor(value);
}

function buildProxyPool(count: number) {
  const items: ProxyOffer[] = [];
  for (let i = 1; i <= count; i += 1) {
    const seed = i * 31;
    const geo = GEO_POOL[Math.floor(seeded(seed) * GEO_POOL.length) % GEO_POOL.length];
    const typeValue = seeded(seed + 2);
    const type: ProxyType = typeValue > 0.66 ? 'residential' : typeValue > 0.33 ? 'mobile' : 'datacenter';
    const protocol = seeded(seed + 3) > 0.56 ? 'SOCKS5' : 'HTTP';
    const status: ProxyStatus = seeded(seed + 4) > 0.23 ? 'available' : 'leased';
    const ip = [
      11 + Math.floor(seeded(seed + 5) * 210),
      1 + Math.floor(seeded(seed + 6) * 254),
      1 + Math.floor(seeded(seed + 7) * 254),
      1 + Math.floor(seeded(seed + 8) * 254),
    ].join('.');

    items.push({
      id: `PX-${String(i).padStart(4, '0')}`,
      ip,
      country: geo.country,
      city: geo.city,
      type,
      protocol,
      status,
      speedMs: 70 + Math.floor(seeded(seed + 9) * 140),
      priceMonth: 99,
    });
  }
  return items;
}

const PROXY_POOL = buildProxyPool(180);

function CountryFlag({ country }: { country: string }) {
  const code = (COUNTRY_CODE[country] ?? 'US').toLowerCase();
  return (
    <span className="platform-country-flag" aria-label={country}>
      <img src={`https://flagcdn.com/${code}.svg`} alt="" loading="lazy" decoding="async" />
    </span>
  );
}

export default function ProxyMarket() {
  const [isMobile, setIsMobile] = useState(false);
  const [offers, setOffers] = useState<ProxyOffer[]>(PROXY_POOL);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ProxyType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProxyStatus>('available');
  const [countryFilter, setCountryFilter] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<SortMode>('availability');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [checkoutOffer, setCheckoutOffer] = useState<ProxyOffer | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<'auto' | 'manual'>('manual');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => {
      setIsMobile(media.matches);
      if (media.matches) setViewMode('grid');
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const countries = useMemo(() => {
    return Array.from(new Set(offers.map(item => item.country))).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [offers]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    const next = offers.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (countryFilter !== 'all' && item.country !== countryFilter) return false;

      if (!normalized) return true;

      return (
        item.ip.includes(normalized) ||
        item.id.toLowerCase().includes(normalized) ||
        item.country.toLowerCase().includes(normalized) ||
        item.city.toLowerCase().includes(normalized)
      );
    });

    return next.sort((a, b) => {
      if (sortBy === 'availability') {
        if (a.status !== b.status) return a.status === 'available' ? -1 : 1;
      }
      return a.ip.localeCompare(b.ip, undefined, { numeric: true });
    });
  }, [offers, search, typeFilter, statusFilter, countryFilter, sortBy]);

  const pageSize = viewMode === 'grid' ? (isMobile ? 10 : 24) : isMobile ? 12 : 18;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const availableCount = offers.filter(item => item.status === 'available').length;

  function resetFilters() {
    setTypeFilter('all');
    setStatusFilter('available');
    setCountryFilter('all');
    setSearch('');
    setSortBy('availability');
    setPage(1);
  }

  function openAutoCheckout() {
    const available = offers.filter(item => item.status === 'available');
    if (available.length < 1) return;

    const randomIndex = Math.floor((Date.now() / 17) % available.length);
    const selected = available[randomIndex];
    setCheckoutMode('auto');
    setCheckoutOffer(selected);
  }

  function openManualCheckout(offer: ProxyOffer) {
    setCheckoutMode('manual');
    setCheckoutOffer(offer);
  }

  function completePurchase() {
    if (!checkoutOffer) return;

    setOffers(prev => prev.map(item => (item.id === checkoutOffer.id ? { ...item, status: 'leased' } : item)));

    setSuccessBanner(
      checkoutMode === 'auto'
        ? `Прокси ${checkoutOffer.id} арендован автоматически.`
        : `Прокси ${checkoutOffer.id} успешно арендован.`,
    );
    setCheckoutOffer(null);

    window.setTimeout(() => setSuccessBanner(null), 2600);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Прокси в аренду"
            subtitle="Встроенный прокси-маркет для безопасной работы аккаунтов: арендуйте вручную или получите автоматически за один клик."
          />
          <ToolbarRow>
            <span className="platform-chip">Всего в каталоге: {offers.length}</span>
            <span className="platform-chip">Свободно: {availableCount}</span>
            <span className="platform-chip">Цена: 99 ₽ / месяц</span>
          </ToolbarRow>
        </PageHeader>

        {successBanner && (
          <SectionCard className="border-[rgba(79,209,139,0.45)] bg-[rgba(79,209,139,0.08)] py-3">
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--pf-success)]">
              <BadgeCheck size={15} /> {successBanner}
            </div>
          </SectionCard>
        )}

        <SectionCard>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="m-0 text-[16px] font-bold">Быстрая покупка прокси</h2>
              <p className="mt-1 text-[13px] text-[var(--pf-text-muted)]">
                Для быстрого старта система подберет случайный свободный прокси и сразу подготовит аренду.
              </p>
            </div>
            <div className="inline-flex flex-wrap items-center gap-2">
              <button className="platform-btn-primary" onClick={openAutoCheckout} disabled={availableCount < 1}>
                <Sparkles size={14} /> Подобрать автоматически
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <ToolbarRow>
            <label className="platform-search platform-toolbar-grow max-w-none">
              <Search size={14} color="var(--pf-text-dim)" />
              <input
                value={search}
                onChange={event => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Поиск по IP, ID, стране или городу"
              />
            </label>

            <div className="platform-view-switch">
              <button
                className={`platform-view-switch-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={14} /> {isMobile ? 'Карточки' : 'Сетка'}
              </button>
              <button
                className={`platform-view-switch-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={14} /> Список
              </button>
            </div>

            <button
              className={`platform-btn-secondary platform-mobile-only ${showFiltersMobile ? 'bg-[var(--pf-surface-3)]' : ''}`}
              onClick={() => setShowFiltersMobile(prev => !prev)}
            >
              <SlidersHorizontal size={14} /> Фильтры
            </button>
          </ToolbarRow>

          <ToolbarRow className={`mt-2 ${showFiltersMobile ? '' : 'hidden sm:flex'}`}>
            <div className="platform-toolbar-scroll sm:contents">
              <select
                className="platform-select"
                value={statusFilter}
                onChange={event => {
                  setStatusFilter(event.target.value as 'all' | ProxyStatus);
                  setPage(1);
                }}
                style={{ maxWidth: 200 }}
              >
                <option value="all">Все статусы</option>
                <option value="available">Только свободные</option>
                <option value="leased">Только занятые</option>
              </select>

              <select
                className="platform-select"
                value={typeFilter}
                onChange={event => {
                  setTypeFilter(event.target.value as 'all' | ProxyType);
                  setPage(1);
                }}
                style={{ maxWidth: 200 }}
              >
                <option value="all">Все типы</option>
                <option value="residential">Резидентский</option>
                <option value="mobile">Мобильный</option>
                <option value="datacenter">Дата-центр</option>
              </select>

              <select
                className="platform-select"
                value={countryFilter}
                onChange={event => {
                  setCountryFilter(event.target.value);
                  setPage(1);
                }}
                style={{ maxWidth: 200 }}
              >
                <option value="all">Все страны</option>
                {countries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              <select
                className="platform-select"
                value={sortBy}
                onChange={event => setSortBy(event.target.value as SortMode)}
                style={{ maxWidth: 200 }}
              >
                <option value="availability">Сначала свободные</option>
                <option value="ip">Сортировка по IP</option>
              </select>
            </div>

            <button className="platform-btn-secondary" onClick={resetFilters}>
              Сбросить
            </button>
          </ToolbarRow>
        </SectionCard>

        <SectionCard className="p-0 overflow-hidden">
          {viewMode === 'grid' ? (
            isMobile ? (
              <div className="platform-mobile-cards">
                {visible.map(offer => {
                  const isAvailable = offer.status === 'available';
                  return (
                    <article key={offer.id} className="platform-mobile-card">
                      <div className="platform-mobile-card-head">
                        <strong>{offer.id}</strong>
                        <span
                          className="platform-chip !min-h-[22px] !text-[11px]"
                          style={{
                            color: isAvailable ? '#86efac' : '#fda4af',
                            borderColor: isAvailable ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)',
                            background: isAvailable ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.1)',
                          }}
                        >
                          {STATUS_LABEL[offer.status]}
                        </span>
                      </div>
                      <div className="platform-mobile-meta">
                        <span className="inline-flex items-center gap-2">
                          <Server size={13} />
                          <span className="platform-ip-concealed">{offer.ip}</span>
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <CountryFlag country={offer.country} />
                          {offer.country}, {offer.city}
                        </span>
                        <span>
                          {TYPE_LABEL[offer.type]} · {offer.protocol}
                        </span>
                        <span>Задержка: ~{offer.speedMs} ms · Цена: {offer.priceMonth} ₽ / месяц</span>
                      </div>
                      <div className="platform-mobile-actions">
                        <button
                          className={isAvailable ? 'platform-btn-primary w-full' : 'platform-btn-secondary w-full'}
                          onClick={() => openManualCheckout(offer)}
                          disabled={!isAvailable}
                        >
                          {isAvailable ? 'Арендовать' : 'Недоступен'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="platform-plugin-grid">
                {visible.map(offer => {
                  const isAvailable = offer.status === 'available';
                  return (
                    <article key={offer.id} className="platform-plugin-card">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-[13px]">{offer.id}</strong>
                        <span
                          className="platform-chip !min-h-[22px] !text-[11px]"
                          style={{
                            color: isAvailable ? '#86efac' : '#fda4af',
                            borderColor: isAvailable ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)',
                            background: isAvailable ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.1)',
                          }}
                        >
                          {STATUS_LABEL[offer.status]}
                        </span>
                      </div>

                      <div className="grid gap-1.5 text-[12px] text-[var(--pf-text-muted)]">
                        <div className="inline-flex items-center gap-2 text-[13px] text-[var(--pf-text)]">
                          <Server size={14} />
                          <span className="platform-ip-concealed" aria-label="IP скрыт до аренды">
                            {offer.ip}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <Globe2 size={13} />
                          <CountryFlag country={offer.country} />
                          {offer.country}, {offer.city}
                        </div>
                        <div>
                          Тип: {TYPE_LABEL[offer.type]} · {offer.protocol}
                        </div>
                        <div>Задержка: ~{offer.speedMs} ms</div>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <strong className="text-[14px]">99 ₽ / месяц</strong>
                        <button
                          className={isAvailable ? 'platform-btn-primary' : 'platform-btn-secondary'}
                          onClick={() => openManualCheckout(offer)}
                          disabled={!isAvailable}
                        >
                          {isAvailable ? 'Арендовать' : 'Недоступен'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          ) : (
            isMobile ? (
              <div className="platform-proxy-list-mobile">
                {visible.map(offer => {
                  const isAvailable = offer.status === 'available';
                  return (
                    <article key={offer.id} className="platform-proxy-list-mobile-row">
                      <div className="platform-mobile-card-head">
                        <strong>{offer.id}</strong>
                        <span
                          className="platform-chip !min-h-[22px] !text-[11px]"
                          style={{
                            color: isAvailable ? '#86efac' : '#fda4af',
                            borderColor: isAvailable ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)',
                            background: isAvailable ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.1)',
                          }}
                        >
                          {STATUS_LABEL[offer.status]}
                        </span>
                      </div>
                      <div className="platform-mobile-meta">
                        <span className="inline-flex items-center gap-2">
                          <Server size={13} />
                          <span className="platform-ip-concealed">{offer.ip}</span>
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <CountryFlag country={offer.country} />
                          {offer.country}, {offer.city}
                        </span>
                        <span>
                          {TYPE_LABEL[offer.type]} · {offer.protocol} · ~{offer.speedMs} ms
                        </span>
                        <span>Цена: {offer.priceMonth} ₽ / месяц</span>
                      </div>
                      <div className="platform-mobile-actions">
                        <button
                          className={isAvailable ? 'platform-btn-primary w-full' : 'platform-btn-secondary w-full'}
                          onClick={() => openManualCheckout(offer)}
                          disabled={!isAvailable}
                        >
                          {isAvailable ? 'Арендовать' : 'Недоступен'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="platform-desktop-table">
                <DataTableWrap className="tablet-dense-scroll">
                  <table className="platform-table platform-proxy-list-table" style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>IP / Geo</th>
                        <th>Тип</th>
                        <th>Протокол</th>
                        <th style={{ textAlign: 'right' }}>Задержка</th>
                        <th>Статус</th>
                        <th style={{ textAlign: 'right' }}>Цена</th>
                        <th style={{ textAlign: 'right' }}>Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map(offer => {
                        const isAvailable = offer.status === 'available';
                        return (
                          <tr key={offer.id}>
                            <td>
                              <strong>{offer.id}</strong>
                            </td>
                            <td>
                              <div className="platform-proxy-list-geo">
                                <span className="platform-ip-concealed">{offer.ip}</span>
                                <span className="platform-kpi-meta inline-flex items-center gap-2">
                                  <CountryFlag country={offer.country} />
                                  {offer.country}, {offer.city}
                                </span>
                              </div>
                            </td>
                            <td>{TYPE_LABEL[offer.type]}</td>
                            <td>{offer.protocol}</td>
                            <td style={{ textAlign: 'right' }}>~{offer.speedMs} ms</td>
                            <td>
                              <span
                                className="platform-chip !min-h-[22px] !text-[11px]"
                                style={{
                                  color: isAvailable ? '#86efac' : '#fda4af',
                                  borderColor: isAvailable ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)',
                                  background: isAvailable ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.1)',
                                }}
                              >
                                {STATUS_LABEL[offer.status]}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{offer.priceMonth} ₽ / мес</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className={isAvailable ? 'platform-btn-primary' : 'platform-btn-secondary'}
                                onClick={() => openManualCheckout(offer)}
                                disabled={!isAvailable}
                              >
                                {isAvailable ? 'Арендовать' : 'Недоступен'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </DataTableWrap>
              </div>
            )
          )}

          {visible.length === 0 && <EmptyState>По выбранным фильтрам прокси не найдены.</EmptyState>}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--pf-border)] px-4 py-3">
            <span className="platform-kpi-meta">
              Показано {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} из{' '}
              {filtered.length}
            </span>
            <div className="inline-flex items-center gap-2">
              <button
                className="platform-btn-secondary"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Назад
              </button>
              <span className="platform-chip">
                {page} / {totalPages}
              </span>
              <button
                className="platform-btn-secondary"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Вперед
              </button>
            </div>
          </div>
        </SectionCard>
      </PageShell>

      <Dialog open={!!checkoutOffer} onOpenChange={() => setCheckoutOffer(null)}>
        <DialogContent className="platform-dialog-content" style={{ maxWidth: 520 }}>
          <DialogHeader>
            <DialogTitle>{checkoutMode === 'auto' ? 'Быстрая аренда прокси' : 'Аренда выбранного прокси'}</DialogTitle>
          </DialogHeader>

          {checkoutOffer && (
            <div className="grid gap-3">
              <SectionCard className="p-3">
                <div className="grid gap-2 text-[13px]">
                  <div className="inline-flex items-center justify-between gap-2">
                    <span className="text-[var(--pf-text-muted)]">ID</span>
                    <strong>{checkoutOffer.id}</strong>
                  </div>
                  <div className="inline-flex items-center justify-between gap-2">
                    <span className="text-[var(--pf-text-muted)]">IP</span>
                    <strong className="platform-ip-concealed">{checkoutOffer.ip}</strong>
                  </div>
                  <div className="inline-flex items-center justify-between gap-2">
                    <span className="text-[var(--pf-text-muted)]">Гео</span>
                    <strong className="inline-flex items-center gap-2">
                      <CountryFlag country={checkoutOffer.country} />
                      {checkoutOffer.country}, {checkoutOffer.city}
                    </strong>
                  </div>
                  <div className="inline-flex items-center justify-between gap-2">
                    <span className="text-[var(--pf-text-muted)]">Тип</span>
                    <strong>{TYPE_LABEL[checkoutOffer.type]}</strong>
                  </div>
                  <div className="inline-flex items-center justify-between gap-2">
                    <span className="text-[var(--pf-text-muted)]">Цена</span>
                    <strong>{checkoutOffer.priceMonth} ₽ / месяц</strong>
                  </div>
                </div>
              </SectionCard>

              <div className="inline-flex items-center gap-2 text-[12px] text-[var(--pf-text-muted)]">
                <ArrowUpDown size={13} />
                {checkoutMode === 'auto'
                  ? 'Прокси выбран автоматически из доступного пула.'
                  : 'Вы выбрали прокси вручную из каталога.'}
              </div>

              <div className="text-[12px] text-[var(--pf-text-dim)]">
                Полный IP и доступ к подключению откроются сразу после подтверждения аренды.
              </div>

              <div className="mt-1 grid grid-cols-2 gap-2">
                <button className="platform-btn-secondary" onClick={() => setCheckoutOffer(null)}>
                  Отмена
                </button>
                <button className="platform-btn-primary" onClick={completePurchase}>
                  <Shuffle size={14} /> Арендовать за 99 ₽
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
