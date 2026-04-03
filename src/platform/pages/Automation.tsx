import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Zap, ChevronRight, Check } from 'lucide-react';
import { automationRules as initialRules, AutomationRule } from '@/platform/data/demoData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';

const CARD_STYLE: React.CSSProperties = {
  background: '#0a1428',
  border: '1px solid rgba(0,121,255,0.18)',
  borderRadius: '12px',
  padding: '20px',
};

const PRESETS = [
  { name: 'Приветствие новому покупателю', icon: '👋', trigger: 'new_message_first', triggerLabel: 'Покупатель написал впервые', action: 'send_message', actionLabel: 'Отправить сообщение', actionText: 'Здравствуйте! Рады приветствовать вас.' },
  { name: 'Уведомление об окончании товаров', icon: '⚠️', trigger: 'low_stock', triggerLabel: 'Остаток товара < 5', action: 'notify_telegram', actionLabel: 'Уведомить в Telegram', actionText: 'Внимание! Товары заканчиваются.' },
  { name: 'Автоответ на запрос цены', icon: '💬', trigger: 'new_message', triggerLabel: 'Новое сообщение', action: 'send_message', actionLabel: 'Отправить сообщение', actionText: 'Цены указаны в описании лота. Для скидок от 5 штук — пишите!' },
  { name: 'Благодарность после заказа', icon: '🙏', trigger: 'order_completed', triggerLabel: 'Заказ выполнен', action: 'send_message', actionLabel: 'Отправить сообщение', actionText: 'Спасибо за покупку! Пожалуйста, оставьте отзыв.' },
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
  const [form, setForm] = useState({ name: '', trigger: 'new_message', condition: '', action: 'send_message', actionText: '' });

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function deleteRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id));
  }

  function addPreset(preset: typeof PRESETS[number]) {
    const exists = rules.find(r => r.name === preset.name);
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
    const triggerObj = TRIGGERS.find(t => t.value === form.trigger);
    const actionObj = ACTIONS.find(a => a.value === form.action);
    if (editingId) {
      setRules(prev => prev.map(r => r.id === editingId ? {
        ...r,
        name: form.name,
        trigger: form.trigger,
        triggerLabel: triggerObj?.label ?? form.trigger,
        condition: form.condition || undefined,
        action: form.action,
        actionLabel: actionObj?.label ?? form.action,
        actionText: form.actionText || undefined,
      } : r));
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
    setForm({ name: rule.name, trigger: rule.trigger, condition: rule.condition ?? '', action: rule.action, actionText: rule.actionText ?? '' });
    setDialogOpen(true);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(0,121,255,0.08)',
    border: '1px solid rgba(0,121,255,0.2)',
    borderRadius: '8px',
    padding: '9px 12px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '24px', minHeight: '100vh', background: '#050C1C', color: '#fff', fontFamily: 'Syne, sans-serif' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Автоматизация</h1>
        <button
          onClick={openNewRule}
          style={{ background: 'linear-gradient(135deg, #007BFF, #0052F4)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Добавить правило
        </button>
      </div>

      {/* Presets */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#7DC8FF', fontSize: '13px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Готовые сценарии
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {PRESETS.map(p => {
            const added = rules.some(r => r.name === p.name);
            return (
              <div
                key={p.name}
                style={{ ...CARD_STYLE, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', opacity: added ? 0.7 : 1, cursor: added ? 'default' : 'pointer', transition: 'border-color 0.2s' }}
                onClick={() => !added && addPreset(p)}
              >
                <span style={{ fontSize: '24px' }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px' }}>{p.name}</div>
                  <div style={{ color: '#7DC8FF', fontSize: '11px' }}>{p.triggerLabel} → {p.actionLabel}</div>
                </div>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: added ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #007BFF, #0052F4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {added ? <Check size={14} color="#22c55e" /> : <Plus size={14} color="#fff" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules */}
      <div>
        <div style={{ color: '#7DC8FF', fontSize: '13px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Мои правила ({rules.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AnimatePresence>
            {rules.map(rule => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ ...CARD_STYLE, padding: '16px' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background: 'rgba(0,121,255,0.15)', borderRadius: '8px', padding: '7px' }}>
                    <Zap size={15} color="#0079FF" />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '15px', flex: 1 }}>{rule.name}</span>
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  <button
                    onClick={() => startEditRule(rule)}
                    style={{ background: 'transparent', border: 'none', color: '#7DC8FF', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Flow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Trigger */}
                  <div style={{ background: 'rgba(0,121,255,0.12)', border: '1px solid rgba(0,121,255,0.3)', borderRadius: '8px', padding: '8px 12px', minWidth: '160px' }}>
                    <div style={{ color: '#7DC8FF', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Триггер</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{rule.triggerLabel}</div>
                  </div>

                  <ChevronRight size={16} color="#7DC8FF" />

                  {/* Condition (optional) */}
                  {rule.condition && (
                    <>
                      <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '8px', padding: '8px 12px', minWidth: '160px' }}>
                        <div style={{ color: '#eab308', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Условие</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{rule.condition}</div>
                      </div>
                      <ChevronRight size={16} color="#7DC8FF" />
                    </>
                  )}

                  {/* Action */}
                  <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '8px', padding: '8px 12px', minWidth: '160px', flex: 1 }}>
                    <div style={{ color: '#22c55e', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Действие</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{rule.actionLabel}</div>
                    {rule.actionText && (
                      <div style={{ fontSize: '12px', color: '#7DC8FF', marginTop: '4px', fontStyle: 'italic' }}>«{rule.actionText}»</div>
                    )}
                  </div>
                </div>

                {!rule.enabled && (
                  <div style={{ marginTop: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '6px 12px', color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>
                    Правило отключено
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={{ background: '#0a1428', border: '1px solid rgba(0,121,255,0.3)', color: '#fff', maxWidth: '520px' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#fff' }}>{editingId ? 'Редактировать правило' : 'Новое правило'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ color: '#7DC8FF', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Название правила</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Например: Ответ на заказ"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ color: '#7DC8FF', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Триггер</label>
              <select
                value={form.trigger}
                onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#7DC8FF', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Условие (необязательно)</label>
              <input
                value={form.condition}
                onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                placeholder="Например: сумма заказа > 500"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ color: '#7DC8FF', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Действие</label>
              <select
                value={form.action}
                onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            {form.action === 'send_message' && (
              <div>
                <label style={{ color: '#7DC8FF', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Текст сообщения</label>
                <textarea
                  value={form.actionText}
                  onChange={e => setForm(f => ({ ...f, actionText: e.target.value }))}
                  placeholder="Введите текст сообщения..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={saveRule} style={{ flex: 1, background: 'linear-gradient(135deg, #007BFF, #0052F4)', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                {editingId ? 'Сохранить' : 'Создать правило'}
              </button>
              <button onClick={() => setDialogOpen(false)} style={{ flex: 1, background: 'transparent', color: '#7DC8FF', border: '1px solid rgba(0,121,255,0.3)', borderRadius: '8px', padding: '11px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                Отмена
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
