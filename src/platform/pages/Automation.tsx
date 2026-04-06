import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronRight, Edit2, Handshake, MessageSquare, Plus, TriangleAlert, Trash2, User, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';
import { automationRules as initialRules, AutomationRule } from '@/platform/data/demoData';
import { PageHeader, PageShell, PageTitle, Panel, SectionCard } from '@/platform/components/primitives';

const PRESETS = [
  {
    name: 'Приветствие новому покупателю',
    icon: User,
    trigger: 'new_message_first',
    triggerLabel: 'Покупатель написал впервые',
    action: 'send_message',
    actionLabel: 'Отправить сообщение',
    actionText: 'Здравствуйте! Рады приветствовать вас.',
  },
  {
    name: 'Уведомление об окончании товаров',
    icon: TriangleAlert,
    trigger: 'low_stock',
    triggerLabel: 'Остаток товара < 5',
    action: 'notify_telegram',
    actionLabel: 'Уведомить в Telegram',
    actionText: 'Внимание! Товары заканчиваются.',
  },
  {
    name: 'Автоответ на запрос цены',
    icon: MessageSquare,
    trigger: 'new_message',
    triggerLabel: 'Новое сообщение',
    action: 'send_message',
    actionLabel: 'Отправить сообщение',
    actionText: 'Цены указаны в описании лота. Для скидок от 5 штук — пишите!',
  },
  {
    name: 'Благодарность после заказа',
    icon: Handshake,
    trigger: 'order_completed',
    triggerLabel: 'Заказ выполнен',
    action: 'send_message',
    actionLabel: 'Отправить сообщение',
    actionText: 'Спасибо за покупку! Пожалуйста, оставьте отзыв.',
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

export default function Automation() {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    trigger: 'new_message',
    condition: '',
    action: 'send_message',
    actionText: '',
  });

  function toggleRule(id: string) {
    setRules(prev => prev.map(rule => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)));
  }

  function deleteRule(id: string) {
    setRules(prev => prev.filter(rule => rule.id !== id));
  }

  function addPreset(preset: (typeof PRESETS)[number]) {
    const exists = rules.some(rule => rule.name === preset.name);
    if (exists) return;

    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: preset.name,
      enabled: true,
      trigger: preset.trigger,
      triggerLabel: preset.triggerLabel,
      action: preset.action,
      actionLabel: preset.actionLabel,
      actionText: preset.actionText,
    };
    setRules(prev => [...prev, newRule]);
  }

  function openNewRule() {
    setEditingId(null);
    setForm({ name: '', trigger: 'new_message', condition: '', action: 'send_message', actionText: '' });
    setDialogOpen(true);
  }

  function saveRule() {
    if (!form.name.trim()) return;
    const triggerObj = TRIGGERS.find(item => item.value === form.trigger);
    const actionObj = ACTIONS.find(item => item.value === form.action);

    if (editingId) {
      setRules(prev =>
        prev.map(rule =>
          rule.id === editingId
            ? {
                ...rule,
                name: form.name,
                trigger: form.trigger,
                triggerLabel: triggerObj?.label ?? form.trigger,
                condition: form.condition || undefined,
                action: form.action,
                actionLabel: actionObj?.label ?? form.action,
                actionText: form.actionText || undefined,
              }
            : rule,
        ),
      );
    } else {
      const newRule: AutomationRule = {
        id: `rule-${Date.now()}`,
        name: form.name,
        enabled: true,
        trigger: form.trigger,
        triggerLabel: triggerObj?.label ?? form.trigger,
        condition: form.condition || undefined,
        action: form.action,
        actionLabel: actionObj?.label ?? form.action,
        actionText: form.actionText || undefined,
      };
      setRules(prev => [...prev, newRule]);
    }

    setDialogOpen(false);
  }

  function startEditRule(rule: AutomationRule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      trigger: rule.trigger,
      condition: rule.condition ?? '',
      action: rule.action,
      actionText: rule.actionText ?? '',
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
          <div className="mb-3 text-[11px] font-bold tracking-[0.1em] text-[var(--pf-text-dim)]">ГОТОВЫЕ СЦЕНАРИИ</div>
          <div className="grid gap-3 md:grid-cols-2">
            {PRESETS.map(preset => {
              const added = rules.some(rule => rule.name === preset.name);
              const Icon = preset.icon;
              return (
                <button
                  key={preset.name}
                  className="platform-panel flex items-center gap-3 p-3 text-left"
                  onClick={() => !added && addPreset(preset)}
                  style={{ opacity: added ? 0.7 : 1, cursor: added ? 'default' : 'pointer' }}
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)] text-[var(--pf-text-muted)]">
                    <Icon size={17} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[13px] font-bold">{preset.name}</span>
                    <span className="text-[11px] text-[var(--pf-text-dim)]">
                      {preset.triggerLabel} → {preset.actionLabel}
                    </span>
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
          <div className="mb-3 text-[11px] font-bold tracking-[0.1em] text-[var(--pf-text-dim)]">МОИ ПРАВИЛА ({rules.length})</div>
          <div className="grid gap-3">
            <AnimatePresence>
              {rules.map(rule => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Panel className="p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[var(--pf-border)] bg-[var(--pf-surface-2)]">
                        <Zap size={14} color="#60a5fa" />
                      </span>
                      <strong className="flex-1 text-[15px]">{rule.name}</strong>
                      <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                      <button className="platform-topbar-btn" onClick={() => startEditRule(rule)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="platform-topbar-btn" onClick={() => deleteRule(rule.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="platform-chip">{rule.triggerLabel}</span>
                      <ChevronRight size={14} color="var(--pf-text-dim)" />
                      {rule.condition && (
                        <>
                          <span className="platform-chip" style={{ color: '#fbbf24' }}>
                            {rule.condition}
                          </span>
                          <ChevronRight size={14} color="var(--pf-text-dim)" />
                        </>
                      )}
                      <span className="platform-chip" style={{ color: '#4ade80' }}>
                        {rule.actionLabel}
                      </span>
                    </div>

                    {rule.actionText && (
                      <p className="mt-2 text-[12px] italic text-[var(--pf-text-muted)]">«{rule.actionText}»</p>
                    )}

                    {!rule.enabled && (
                      <div className="mt-2 rounded-[10px] border border-[rgba(251,113,133,0.34)] bg-[rgba(251,113,133,0.08)] px-2 py-1 text-[12px] font-semibold text-[#fb7185]">
                        Правило отключено
                      </div>
                    )}
                  </Panel>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
                onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
                placeholder="Например: Ответ на заказ"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Триггер</label>
              <select
                className="platform-select"
                value={form.trigger}
                onChange={event => setForm(prev => ({ ...prev, trigger: event.target.value }))}
              >
                {TRIGGERS.map(trigger => (
                  <option key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Условие (необязательно)</label>
              <input
                className="platform-input"
                value={form.condition}
                onChange={event => setForm(prev => ({ ...prev, condition: event.target.value }))}
                placeholder="Например: сумма заказа > 500"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Действие</label>
              <select
                className="platform-select"
                value={form.action}
                onChange={event => setForm(prev => ({ ...prev, action: event.target.value }))}
              >
                {ACTIONS.map(action => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            {form.action === 'send_message' && (
              <div>
                <label className="mb-1 block text-[13px] text-[var(--pf-text-muted)]">Текст сообщения</label>
                <textarea
                  className="platform-textarea"
                  value={form.actionText}
                  onChange={event => setForm(prev => ({ ...prev, actionText: event.target.value }))}
                  rows={4}
                  placeholder="Введите текст сообщения"
                />
              </div>
            )}

            <div className="mt-1 flex gap-2">
              <button className="platform-btn-primary flex-1" onClick={saveRule}>
                {editingId ? 'Сохранить' : 'Создать правило'}
              </button>
              <button className="platform-btn-secondary flex-1" onClick={() => setDialogOpen(false)}>
                Отмена
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
