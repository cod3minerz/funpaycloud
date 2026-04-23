'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpCircle, Loader2, Pencil, Plus, Power, Trash2, SearchX } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { accountsApi, ApiAccount, ApiLot, lotsApi } from '@/lib/api';
import {
  DataTableWrap,
  EmptyState,
  PageHeader,
  PageShell,
  PageTitle,
  RequestErrorState,
  SectionCard,
  ToolbarRow,
} from '@/platform/components/primitives';

type CategoryOption = {
  game_id: number;
  game_title: string;
  sub_id: number;
  sub_name: string;
};

export default function Lots() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [lots, setLots] = useState<ApiLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [raisingIDs, setRaisingIDs] = useState<Set<string>>(new Set());
  const [savingIDs, setSavingIDs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [createAccountID, setCreateAccountID] = useState<number | null>(null);
  const [createNodeID, setCreateNodeID] = useState<number>(0);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPrice, setCreatePrice] = useState('');
  const [createAmount, setCreateAmount] = useState('0');
  const [creating, setCreating] = useState(false);

  const [editingLot, setEditingLot] = useState<ApiLot | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editAmount, setEditAmount] = useState('0');
  const [editActive, setEditActive] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function loadLots() {
    setLoading(true);
    setLoadError(null);
    try {
      const accs = await accountsApi.list();
      const safeAccs = Array.isArray(accs) ? accs : [];
      setAccounts(safeAccs);

      const targetAccounts = accountFilter === 'all'
        ? safeAccs
        : safeAccs.filter(acc => String(acc.id) === accountFilter);

      const collected: ApiLot[] = [];
      const perAccount = await Promise.allSettled(targetAccounts.map(acc => lotsApi.listByAccount(acc.id)));
      for (let i = 0; i < perAccount.length; i += 1) {
        const result = perAccount[i];
        const account = targetAccounts[i];
        if (result.status !== 'fulfilled') continue;
        const rows = Array.isArray(result.value) ? result.value : [];
        for (const row of rows) {
          collected.push({
            ...row,
            lot_id: row.lot_id || String(row.id),
            account_username: row.account_username || account?.username || `ID ${account?.id}`,
            funpay_account_id: row.funpay_account_id || account?.id || 0,
          });
        }
      }
      setLots(collected);

      if (createAccountID == null && safeAccs.length > 0) {
        setCreateAccountID(safeAccs[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки лотов';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, accountFilter]);

  useEffect(() => {
    if (!createOpen) return;
    if (!createAccountID) return;
    let cancelled = false;
    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        const data = await lotsApi.categories(createAccountID);
        if (cancelled) return;
        const flat: CategoryOption[] = [];
        for (const game of data || []) {
          for (const sub of game.subcategories || []) {
            flat.push({
              game_id: game.game_id,
              game_title: game.game_title,
              sub_id: sub.id,
              sub_name: sub.name,
            });
          }
        }
        setCategories(flat);
        if (flat.length > 0 && createNodeID === 0) {
          setCreateNodeID(flat[0].sub_id);
        }
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Ошибка загрузки категорий');
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }
    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, [createOpen, createAccountID, createNodeID]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lots.filter(lot => {
      if (!q) return true;
      return `${lot.title} ${lot.category_name} ${lot.lot_id} ${lot.account_username}`.toLowerCase().includes(q);
    });
  }, [lots, search]);

  function makeLotKey(lot: ApiLot) {
    return `${lot.funpay_account_id}:${lot.lot_id || lot.id}`;
  }

  async function raise(lot: ApiLot) {
    const key = makeLotKey(lot);
    setRaisingIDs(prev => new Set(prev).add(key));
    try {
      await lotsApi.raiseLot(lot.funpay_account_id, lot.lot_id || lot.id);
      toast.success(`Лот поднят: ${lot.title}`);
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка поднятия лота');
    } finally {
      setRaisingIDs(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function createLot() {
    if (!createAccountID) {
      toast.error('Выберите аккаунт');
      return;
    }
    if (!createNodeID || !createTitle.trim() || !createPrice.trim()) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setCreating(true);
    try {
      await lotsApi.create(createAccountID, {
        node_id: createNodeID,
        title: createTitle.trim(),
        description: createDescription,
        price: Number(createPrice),
        amount: Number(createAmount || 0),
      });
      toast.success('Лот создан');
      setCreateOpen(false);
      setCreateTitle('');
      setCreateDescription('');
      setCreatePrice('');
      setCreateAmount('0');
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка создания лота');
    } finally {
      setCreating(false);
    }
  }

  function openEdit(lot: ApiLot) {
    setEditingLot(lot);
    setEditTitle(lot.title || '');
    setEditDescription(lot.description || '');
    setEditPrice(String(Number(lot.price || 0)));
    setEditAmount(String(Number(lot.amount || 0)));
    setEditActive(Boolean(lot.is_active));
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editingLot) return;
    setUpdating(true);
    try {
      await lotsApi.update(editingLot.funpay_account_id, editingLot.lot_id || editingLot.id, {
        title: editTitle.trim(),
        description: editDescription,
        price: Number(editPrice),
        amount: Number(editAmount || 0),
        is_active: editActive,
      });
      toast.success('Лот обновлён');
      setEditOpen(false);
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка обновления лота');
    } finally {
      setUpdating(false);
    }
  }

  async function removeLot(lot: ApiLot) {
    if (!window.confirm(`Удалить лот «${lot.title}»?`)) return;
    const key = makeLotKey(lot);
    setSavingIDs(prev => new Set(prev).add(key));
    try {
      await lotsApi.delete(lot.funpay_account_id, lot.lot_id || lot.id);
      toast.success('Лот удалён');
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления лота');
    } finally {
      setSavingIDs(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function toggleActive(lot: ApiLot) {
    const key = makeLotKey(lot);
    setSavingIDs(prev => new Set(prev).add(key));
    try {
      await lotsApi.update(lot.funpay_account_id, lot.lot_id || lot.id, {
        title: lot.title,
        description: lot.description || '',
        price: Number(lot.price || 0),
        amount: Number(lot.amount || 0),
        is_active: !lot.is_active,
      });
      toast.success(!lot.is_active ? 'Лот включён' : 'Лот выключен');
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка изменения статуса');
    } finally {
      setSavingIDs(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <PageShell>
        <PageHeader>
          <PageTitle title="Лоты" />
          <button
            className="platform-btn-primary"
            onClick={() => {
              if (accounts.length === 0) {
                toast.error('Сначала добавьте аккаунт');
                return;
              }
              if (accountFilter !== 'all') {
                setCreateAccountID(Number(accountFilter));
              } else if (!createAccountID && accounts[0]) {
                setCreateAccountID(accounts[0].id);
              }
              setCreateOpen(true);
            }}
          >
            <Plus size={14} /> Создать лот
          </button>
        </PageHeader>

        <SectionCard>
          <ToolbarRow>
            <label className="platform-search platform-toolbar-grow max-w-none">
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск по лотам" />
            </label>
            <select className="platform-select" value={accountFilter} onChange={event => setAccountFilter(event.target.value)}>
              <option value="all">Все аккаунты</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.username || `ID ${acc.id}`}</option>
              ))}
            </select>
          </ToolbarRow>
        </SectionCard>

        <SectionCard className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[var(--pf-accent)]" />
            </div>
          ) : loadError ? (
            <RequestErrorState message={loadError} onRetry={() => setReloadKey(prev => prev + 1)} />
          ) : (
            <>
              <div className="platform-desktop-table">
                <DataTableWrap>
                  <table className="platform-table min-w-[1100px]">
                    <thead>
                      <tr>
                        <th>Лот</th>
                        <th>Категория</th>
                        <th>Аккаунт</th>
                        <th className="text-right">Цена</th>
                        <th className="text-right">Кол-во</th>
                        <th>Статус</th>
                        <th className="text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(lot => {
                        const key = makeLotKey(lot);
                        const busy = raisingIDs.has(key) || savingIDs.has(key);
                        return (
                          <tr key={key}>
                            <td>
                              <div className="font-semibold">{lot.title}</div>
                              {lot.description ? <div className="text-xs text-[var(--pf-text-muted)] line-clamp-2">{lot.description}</div> : null}
                              <div className="text-[11px] text-[var(--pf-text-dim)]">ID: {lot.lot_id || lot.id}</div>
                            </td>
                            <td>{lot.category_name || '—'}</td>
                            <td>{lot.account_username || `ID ${lot.funpay_account_id}`}</td>
                            <td className="text-right font-bold">{Number(lot.price || 0)} {lot.currency || '₽'}</td>
                            <td className="text-right">{Number(lot.amount || 0)}</td>
                            <td>
                              <span className={lot.is_active ? 'badge-active' : 'badge-inactive'}>
                                {lot.is_active ? 'Активен' : 'Неактивен'}
                              </span>
                            </td>
                            <td className="text-right">
                              <div className="inline-flex flex-wrap justify-end gap-2">
                                <button className="platform-btn-secondary" onClick={() => void raise(lot)} disabled={busy}>
                                  {raisingIDs.has(key) ? <Loader2 size={14} className="animate-spin" /> : <><ArrowUpCircle size={14} /> Поднять</>}
                                </button>
                                <button className="platform-btn-secondary" onClick={() => openEdit(lot)} disabled={busy}>
                                  <Pencil size={14} /> Редактировать
                                </button>
                                <button className="platform-btn-secondary" onClick={() => void toggleActive(lot)} disabled={busy}>
                                  <Power size={14} /> {lot.is_active ? 'Выключить' : 'Включить'}
                                </button>
                                <button className="platform-btn-secondary" onClick={() => void removeLot(lot)} disabled={busy}>
                                  <Trash2 size={14} /> Удалить
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </DataTableWrap>
              </div>
              {filtered.length === 0 && (
                <EmptyState
                  icon={SearchX}
                  title="Лоты не найдены"
                  description="По текущим фильтрам нет подходящих лотов. Попробуйте изменить параметры поиска."
                  action={
                    search ? (
                      <button className="platform-btn-secondary" onClick={() => setSearch('')}>
                        Сбросить поиск
                      </button>
                    ) : undefined
                  }
                />
              )}
            </>
          )}
        </SectionCard>
      </PageShell>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="platform-dialog-content sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Создать лот</DialogTitle>
          </DialogHeader>
          <div className="platform-form-grid">
            <label className="platform-field">
              <span>Аккаунт</span>
              <select className="platform-select" value={createAccountID ?? ''} onChange={event => setCreateAccountID(Number(event.target.value))}>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.username || `ID ${acc.id}`}</option>
                ))}
              </select>
            </label>
            <label className="platform-field">
              <span>Категория</span>
              <select className="platform-select" value={createNodeID} onChange={event => setCreateNodeID(Number(event.target.value))}>
                {categoriesLoading ? (
                  <option value={0}>Загрузка...</option>
                ) : (
                  categories.map(item => (
                    <option key={`${item.game_id}-${item.sub_id}`} value={item.sub_id}>
                      {item.game_title} / {item.sub_name}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="platform-field">
              <span>Название</span>
              <input className="platform-input" value={createTitle} onChange={event => setCreateTitle(event.target.value)} />
            </label>
            <label className="platform-field">
              <span>Описание</span>
              <textarea className="platform-input min-h-[88px]" value={createDescription} onChange={event => setCreateDescription(event.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="platform-field">
                <span>Цена</span>
                <input className="platform-input" type="number" value={createPrice} onChange={event => setCreatePrice(event.target.value)} />
              </label>
              <label className="platform-field">
                <span>Количество</span>
                <input className="platform-input" type="number" value={createAmount} onChange={event => setCreateAmount(event.target.value)} />
              </label>
            </div>
            <div className="mt-2 flex gap-2">
              <button className="platform-btn-primary flex-1" onClick={() => void createLot()} disabled={creating || categoriesLoading}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : 'Создать'}
              </button>
              <button className="platform-btn-secondary flex-1" onClick={() => setCreateOpen(false)}>Отмена</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="platform-dialog-content sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Редактировать лот</DialogTitle>
          </DialogHeader>
          <div className="platform-form-grid">
            <label className="platform-field">
              <span>Название</span>
              <input className="platform-input" value={editTitle} onChange={event => setEditTitle(event.target.value)} />
            </label>
            <label className="platform-field">
              <span>Описание</span>
              <textarea className="platform-input min-h-[88px]" value={editDescription} onChange={event => setEditDescription(event.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="platform-field">
                <span>Цена</span>
                <input className="platform-input" type="number" value={editPrice} onChange={event => setEditPrice(event.target.value)} />
              </label>
              <label className="platform-field">
                <span>Количество</span>
                <input className="platform-input" type="number" value={editAmount} onChange={event => setEditAmount(event.target.value)} />
              </label>
            </div>
            <label className="platform-field inline-flex items-center gap-2">
              <input type="checkbox" checked={editActive} onChange={event => setEditActive(event.target.checked)} />
              <span>Лот активен</span>
            </label>
            <div className="mt-2 flex gap-2">
              <button className="platform-btn-primary flex-1" onClick={() => void saveEdit()} disabled={updating}>
                {updating ? <Loader2 size={14} className="animate-spin" /> : 'Сохранить'}
              </button>
              <button className="platform-btn-secondary flex-1" onClick={() => setEditOpen(false)}>Отмена</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
