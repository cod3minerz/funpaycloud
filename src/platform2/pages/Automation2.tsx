'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import type { AutomationRule } from '@/platform/data/demoData';
import { automationRules as initialRules } from '@/platform/data/demoData';
import { P2Card, P2PageHeader, P2PrimaryAction, P2SecondaryAction } from '@/platform2/components/primitives';

export default function Automation2() {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    trigger: 'new_message',
    action: 'send_message',
    condition: '',
    actionText: '',
  });

  function toggleRule(id: string) {
    setRules(prev => prev.map(rule => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)));
  }

  function createRule() {
    const name = form.name.trim();
    if (!name) return;

    const rule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name,
      enabled: true,
      trigger: form.trigger,
      triggerLabel: form.trigger,
      condition: form.condition || undefined,
      action: form.action,
      actionLabel: form.action,
      actionText: form.actionText || undefined,
    };

    setRules(prev => [rule, ...prev]);
    setDialogOpen(false);
    setForm({ name: '', trigger: 'new_message', action: 'send_message', condition: '', actionText: '' });
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <P2PageHeader
        title="Automation"
        description="Build production rules for responses, delivery and monitoring."
        actions={
          <P2PrimaryAction onClick={() => setDialogOpen(true)}>
            <PlusIcon className="size-4" />
            New rule
          </P2PrimaryAction>
        }
      />

      <P2Card title="Rules" subtitle="Enable or disable automation pipelines">
        <div className="grid gap-3 md:grid-cols-2">
          {rules.map(rule => (
            <article key={rule.id} className="rounded-xl border border-[var(--p2-border-soft)] bg-[var(--p2-surface-2)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
                  <p className="text-xs text-[var(--p2-text-dim)] mt-1">{rule.triggerLabel} → {rule.actionLabel}</p>
                </div>
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
              </div>

              {rule.condition ? <p className="text-xs text-[var(--p2-text-muted)] mt-2">Condition: {rule.condition}</p> : null}
              {rule.actionText ? <p className="text-xs text-[var(--p2-text-muted)] mt-1 line-clamp-2">Message: {rule.actionText}</p> : null}
            </article>
          ))}
        </div>
      </P2Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p2-dialog max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create automation rule</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <label className="space-y-1.5 block">
              <span className="text-xs text-[var(--p2-text-dim)]">Rule name</span>
              <Input className="p2-input" value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 block">
                <span className="text-xs text-[var(--p2-text-dim)]">Trigger</span>
                <Select value={form.trigger} onValueChange={value => setForm(prev => ({ ...prev, trigger: value }))}>
                  <SelectTrigger className="p2-select-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="p2-select-content">
                    <SelectItem className="p2-select-item" value="new_message">new_message</SelectItem>
                    <SelectItem className="p2-select-item" value="order_paid">order_paid</SelectItem>
                    <SelectItem className="p2-select-item" value="order_completed">order_completed</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs text-[var(--p2-text-dim)]">Action</span>
                <Select value={form.action} onValueChange={value => setForm(prev => ({ ...prev, action: value }))}>
                  <SelectTrigger className="p2-select-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="p2-select-content">
                    <SelectItem className="p2-select-item" value="send_message">send_message</SelectItem>
                    <SelectItem className="p2-select-item" value="deliver_item">deliver_item</SelectItem>
                    <SelectItem className="p2-select-item" value="notify_telegram">notify_telegram</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>

            <label className="space-y-1.5 block">
              <span className="text-xs text-[var(--p2-text-dim)]">Condition (optional)</span>
              <Input className="p2-input" value={form.condition} onChange={event => setForm(prev => ({ ...prev, condition: event.target.value }))} />
            </label>

            <label className="space-y-1.5 block">
              <span className="text-xs text-[var(--p2-text-dim)]">Action text (optional)</span>
              <Textarea className="p2-input min-h-24" value={form.actionText} onChange={event => setForm(prev => ({ ...prev, actionText: event.target.value }))} />
            </label>

            <div className="flex justify-end gap-2">
              <P2SecondaryAction onClick={() => setDialogOpen(false)}>Cancel</P2SecondaryAction>
              <P2PrimaryAction onClick={createRule}>Create rule</P2PrimaryAction>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
