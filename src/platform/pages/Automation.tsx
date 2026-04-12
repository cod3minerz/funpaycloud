'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronRight,
  Edit2,
  Handshake,
  Loader2,
  MessageSquare,
  Plus,
  TriangleAlert,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';
import { accountsApi, ApiAccount, ApiAutomationRule, automationApi } from '@/lib/api';
import { sanitizeInput } from '@/lib/sanitize';
import { PageHeader, PageShell, PageTitle, Panel, RequestErrorState, SectionCard } from '@/platform/components/primitives';

const PRESETS = [
  {
    name: 'Приветствие новому покупателю',
    icon: User,
    trigger_type: 'new_message_first',
    triggerLabel: 'Покупатель написал впервые',
    action_type: 'send_message',
    actionLabel: 'Отправить сообщение',
    action_value: 'Здравствуйте! Рады приветствовать вас.',
  },
  {
    name: 'Уведомление об окончании товаров',
    icon: TriangleAlert,
    trigger_type: 'low_stock',
    triggerLabel: 'Остаток товара < 5',
    action_type: 'notify_telegram',
    actionLabel: 'Уведомить в Telegram',
    action_value: 'Внимание! Товары заканчиваются.',
  },
  {
    name: 'Автоответ на запрос цены',
    icon: MessageSquare,
    trigger_type: 'new_message',
    triggerLabel: 'Новое сообщение',
    action_type: 'send_message',
    actionLabel: 'Отправить сообщение',
    action_value: 'Цены указаны в описании лота. Для скидок от 5 штук — пишите!',
  },
  {
    name: 'Благодарность после заказа',
    icon: Handshake,
    trigger_type: 'order_completed',
    triggerLabel: 'Заказ выполнен',
    action_type: 'send_message',
    actionLabel: 'Отправить сообщение',
    action_value: 'Спасибо за покупку! Пожалуйста, оставьте отзыв.',
  },
];

const TRIGGERS = [
  { value: 'new_message', label: 'Новое сообщение' },
  { value: 'new_order', label: 'Новый заказ' },
  { value: 'order_completed', label: 'Заказ выполнен' },
  { value: 'new_message_first', label: 'Покупатель написал впервые' },
  { value: 'low_stock', label: 'Остаток товара < N' },
  { value: 'high_order', label: 'Заказ на сумму > N' },
];

const ACTIONS = [
  { value: 'send_message', label: 'Отправить сообщение' },
  { value: 'deliver_item', label: 'Выдать товар' },
  { value: 'disable_lot', label: 'Отключить лот' },
  { value: 'notify_telegram', label: 'Уведомить в Telegram' },
  { value: 'raise_lots', label: 'Поднять лоты' },
];

function getTriggerLabel(type: string) {
  return TRIGGERS.find(t => t.value === type)?.label ?? type;
}
function getActionLabel(type: string) {
  return ACTIONS.find(a => a.value === type)?.label ?? type;
}

export default function Automation() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [rules, setRules] = useState<ApiAutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string | number>>(new Set());
  const [form, setForm] = useState({
    name: '',
    trigger_type: 'new_message',
    trigger_value: '',
    action_type: 'send_message',
    action_value: '',
  });
  const visibleRules = selectedAccountID
    ? rules.filter(rule => rule.funpay_account_id === selectedAccountID)
    : rules;
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([accountsApi.list(), automationApi.list()])
      .then(([accountRows, ruleRows]) => {
        if (cancelled) return;
        const safeAccounts = Array.isArray(accountRows) ? accountRows : [];
        const safeRules = Array.isArray(ruleRows) ? ruleRows : [];
        setAccounts(safeAccounts);
        setRules(safeRules);
        if (safeAccounts.length > 0) setSelectedAccountID(safeAccounts[0].id);
      })
      .catch(err => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Ошибка загрузки автоматизации';
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

  async function toggleRule(id: string | number) {
    setTogglingIds(prev => new Set(prev).add(id));
    try {
      const updated = await automationApi.toggle(id);
      setRules(prev => prev.map(r => r.id === id ? updated : r));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка переключения правила');
    } finally {
      setTogglingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  }

  async function deleteRule(id: string | number) {
    try {
      await automationApi.delete(id);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Правило удалено');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления правила');
    }
  }

  async function addPreset(preset: (typeof PRESETS)[number]) {
    if (!selectedAccountID) {
      toast.error('Выберите аккаунт');
      return;
    }
    if (rules.some(r => r.name === preset.name && r.funpay_account_id === selectedAccountID)) return;
    setSaving(true);
    try {
      const newRule = await automationApi.create({
        name: preset.name,
        trigger_type: preset.trigger_type,
        action_type: preset.action_type,
        action_value: preset.action_value,
        funpay_account_id: selectedAccountID,
      });
      setRules(prev => [...prev, newRule]);
      toast.success('Пресет добавлен');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка добавления пресета');
    } finally {
      setSaving(false);
    }
  }

  function openNewRule() {
    setEditingId(null);
    setForm({ name: '', trigger_type: 'new_message', trigger_value: '', action_type: 'send_message', action_value: '' });
    setDialogOpen(true);
  }

  async function saveRule() {
    const name = sanitizeInput(form.name);
    if (!name) { toast.error('Введите название правила'); return; }
    if (!selectedAccountID) { toast.error('Выберите аккаунт'); return; }

    const payload = {
      name,
      trigger_type: form.trigger_type,
      trigger_value: form.trigger_value ? sanitizeInput(form.trigger_value) : undefined,
      action_type: form.action_type,
      action_value: form.action_value ? sanitizeInput(form.action_value) : undefined,
      funpay_account_id: selectedAccountID,
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await automationApi.update(editingId, payload);
        setRules(prev => prev.map(r => r.id === editingId ? updated : r));
        toast.success('Правило обновлено');
      } else {
        const newRule = await automationApi.create(payload);
        setRules(prev => [...prev, newRule]);
        toast.success('Правило создано');
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения правила');
    } finally {
      setSaving(false);
    }
  }

  function startEditRule(rule: ApiAutomationRule) {
    setSelectedAccountID(rule.funpay_account_id);
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      trigger_type: rule.trigger_type,
      trigger_value: rule.trigger_value ?? '',
      action_type: rule.action_type,
      action_value: rule.action_value ?? '',
    });
    setDialogOpen(true);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <PageShell>
        <PageHeader>
          <PageTitle
            title="Автоматизация"
            subtitle="Сценарии обработки заказов и сообщений в единой управляемой системе."
          />
          <button className="platform-btn-primary" onClick={openNewRule}>
            <Plus size={15} /> Добавить правило
          </button>
        </PageHeader>

        <SectionCard>
          <div className="mb-3">
            <select
              className="platform-select"
              value={selectedAccountID ?? ''}
              onChange={event => setSelectedAccountID(Number(event.target.value))}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.username || `ID ${acc.id}`}</option>
              ))}
            </select>
          </div>
          <div className="mb-3 text-[11px] font-bold tracking-[0.1em] text-[var(--pf-text-dim)]">ГОТОВЫЕ СЦЕНАРИИ</div>
          <div className="grid gap-3 md:grid-cols-2">
            {PRESETS.map(preset => {
              const added = selectedAccountID
                ? rules.some(r => r.name === preset.name && r.funpay_account_id === selectedAccountID)
                : false;
              const Icon = preset.icon;
              return (
                <button
                  key={preset.name}
                  className="platform-panel flex items-center gap-3 p-3 text-left"
                  onClick={() => !added && addPreset(preset)}
                  style={{ opacity: added ? 0.7 : 1, cursor: added ? 'default' : 'pointer' }}
                  disabled={saving}
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] text-[var(--pf-text-muted)]">
                    <Icon size={17} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[13px] font-bold">{preset.name}</span>
                    <span className="text-[11px] text-[var(--pf-text-dim)]">{preset.triggerLabel} → {preset.actionLabel}</span>
                  </span>
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--pf-border)]"
                    style={{ background: added ? 'rgba(74,222,128,0.16)' : 'rgba(91,140,255,0.24)' }}
                  >
                    {added ? <Check size={13} color="#4ade80" /> : <Plus size={13} />}
                  </span>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="mb-3 text-[11px] font-bold tracking-[0.1em] text-[var(--pf-text-dim)]">МОИ ПРАВИЛА ({visibleRules.length})</div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-[var(--pf-accent)]" />
            </div>
          ) : loadError ? (
            <RequestErrorState message={loadError} onRetry={() => setReloadKey(prev => prev + 1)} />
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {visibleRules.map(rule => {
                  const isToggling = togglingIds.has(rule.id);
                  return (
                    <motion.div key={rule.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <Panel className="p-3">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)]">
                            <Zap size={14} color="#60a5fa" />
                          </span>
                          <strong className="flex-1 text-[15px]">{rule.name}</strong>
                          {isToggling ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                          )}
                          <button className="platform-topbar-btn" onClick={() => startEditRule(rule)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="platform-topbar-btn" onClick={() => deleteRule(rule.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="platform-chip">{getTriggerLabel(rule.trigger_type)}</span>
                          <ChevronRight size={14} color="var(--pf-text-dim)" />
                          {rule.trigger_value && (
                            <>
                              <span className="platform-chip" style={{ color: '#fbbf24' }}>{rule.trigger_value}</span>
                              <ChevronRight size={14} color="var(--pf-text-dim)" />
                            </>
                          )}
                          <span className="platform-chip" style={{ color: '#4ade80' }}>{getActionLabel(rule.action_type)}</span>
                          <span className="platform-chip">Аккаунт: {accounts.find(acc => acc.id === rule.funpay_account_id)?.username || `ID ${rule.funpay_account_id}`}</span>
                        </div>

                        {rule.action_value && (
                          <p className="mt-2 text-[12px] italic text-[var(--pf-text-muted)]">«{rule.action_value}»</p>
                        )}

                        {!rule.enabled && (
                          <div className="mt-2 rounded-[10px] border border-[rgba(251,113,133,0.34)] bg-[rgba(251,113,133,0.08)] px-2 py-1 text-[12px] font-semibold text-[#fb7185]">
                            Правило отключено
                          </div>
                        )}
                      </Panel>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {visibleRules.length === 0 && <div className="platform-empty">Нет правил автоматизации</div>}
            </div>
          )}
        </SectionCard>
      </PageShell>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="platform-dialog-content" style={{ maxWidth: 540 }}>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Редактировать правило' : 'Новое правило'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Название правила</label>
              <input
                className="platform-input"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Например: Ответ на заказ"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Триггер</label>
              <select className="platform-select" value={form.trigger_type} onChange={e => setForm(prev => ({ ...prev, trigger_type: e.target.value }))}>
                {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Условие (необязательно)</label>
              <input
                className="platform-input"
                value={form.trigger_value}
                onChange={e => setForm(prev => ({ ...prev, trigger_value: e.target.value }))}
                placeholder="Например: сумма заказа > 500"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Действие</label>
              <select className="platform-select" value={form.action_type} onChange={e => setForm(prev => ({ ...prev, action_type: e.target.value }))}>
                {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            {form.action_type === 'send_message' && (
              <div>
                <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Текст сообщения</label>
                <textarea
                  className="platform-textarea"
                  value={form.action_value}
                  onChange={e => setForm(prev => ({ ...prev, action_value: e.target.value }))}
                  rows={4}
                  placeholder="Введите текст сообщения"
                />
              </div>
            )}
            <div className="mt-1 flex gap-2">
              <button className="platform-btn-primary flex-1" onClick={saveRule} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : (editingId ? 'Сохранить' : 'Создать правило')}
              </button>
              <button className="platform-btn-secondary flex-1" onClick={() => setDialogOpen(false)}>Отмена</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
