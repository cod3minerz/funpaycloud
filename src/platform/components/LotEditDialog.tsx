'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from '@/shared/streamline/icons';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { ApiLotEditForm, ApiLotEditValues, ApiWarehouseLot, ApiLot, lotsApi } from '@/lib/api';

type EditableLotRef =
  | Pick<ApiLot, 'funpay_account_id' | 'lot_id' | 'id' | 'title' | 'account_username' | 'category_name'>
  | Pick<ApiWarehouseLot, 'funpay_account_id' | 'lot_id' | 'id' | 'title' | 'account_username' | 'category_name'>;

type LotEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: EditableLotRef | null;
  onSaved?: () => void | Promise<void>;
};

function normalizeFieldValue(raw: unknown, type: string, optionCount: number) {
  if (type === 'checkbox' && optionCount <= 1) {
    return Boolean(raw);
  }
  if (type === 'checkbox') {
    return Array.isArray(raw)
      ? raw.map(item => String(item))
      : typeof raw === 'string' && raw
        ? [raw]
        : [];
  }
  if (Array.isArray(raw)) {
    return raw[0] != null ? String(raw[0]) : '';
  }
  if (raw == null) return '';
  return String(raw);
}

function isTextareaField(type: string) {
  return type === 'textarea';
}

function isSelectField(type: string) {
  return type === 'select';
}

function isRadioField(type: string) {
  return type === 'radio';
}

function isCheckboxField(type: string) {
  return type === 'checkbox';
}

export function LotEditDialog({ open, onOpenChange, lot, onSaved }: LotEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ApiLotEditForm | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean | string[]>>({});

  const accountId = lot?.funpay_account_id ?? 0;
  const lotId = lot?.lot_id || String(lot?.id || '');

  async function loadEditForm() {
    if (!open || !accountId || !lotId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await lotsApi.getEditForm(accountId, lotId);
      setFormData(data);
      const nextValues: Record<string, string | boolean | string[]> = {};
      for (const field of data.schema || []) {
        nextValues[field.name] = normalizeFieldValue(data.values?.[field.name], field.type, field.options?.length || 0);
      }
      setFormValues(nextValues);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки формы редактирования';
      setLoadError(message);
      setFormData(null);
      setFormValues({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setLoadError(null);
      setSaving(false);
      return;
    }
    void loadEditForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accountId, lotId]);

  const schema = formData?.schema || [];
  const title = formData?.lot?.title || lot?.title || 'Редактирование лота';

  const normalizedValues = useMemo(() => {
    const prepared: ApiLotEditValues = {};
    for (const field of schema) {
      const raw = formValues[field.name];
      if (Array.isArray(raw)) {
        prepared[field.name] = raw.map(item => String(item));
      } else if (typeof raw === 'boolean') {
        prepared[field.name] = raw;
      } else {
        prepared[field.name] = raw == null ? '' : String(raw);
      }
    }
    return prepared;
  }, [formValues, schema]);

  function setStringField(name: string, value: string) {
    setFormValues(prev => ({ ...prev, [name]: value }));
  }

  function setBooleanField(name: string, value: boolean) {
    setFormValues(prev => ({ ...prev, [name]: value }));
  }

  function toggleMultiCheckbox(name: string, optionValue: string, checked: boolean) {
    setFormValues(prev => {
      const current = Array.isArray(prev[name]) ? [...(prev[name] as string[])] : [];
      const next = checked
        ? Array.from(new Set([...current, optionValue]))
        : current.filter(item => item !== optionValue);
      return { ...prev, [name]: next };
    });
  }

  async function handleSave() {
    if (!accountId || !lotId) return;
    setSaving(true);
    try {
      await lotsApi.update(accountId, lotId, {
        mode: 'schema',
        values: normalizedValues,
      });
      toast.success('Лот обновлён');
      onOpenChange(false);
      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения лота');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="platform-dialog-content max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-[920px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <div className="text-sm text-[var(--pf-text-muted)]">
            {formData?.lot?.account_username || lot?.account_username || 'Аккаунт'} · {formData?.lot?.category_name || lot?.category_name || 'Лот'}
            {formData?.meta?.node_type ? ` · ${formData.meta.node_type}` : ''}
            {formData?.meta?.node_id ? ` · node ${formData.meta.node_id}` : ''}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[var(--pf-accent)]" />
          </div>
        ) : loadError ? (
          <div className="space-y-4 rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-5">
            <div className="text-sm text-[var(--pf-text-muted)]">{loadError}</div>
            <div className="flex gap-2">
              <button className="platform-btn-primary" onClick={() => void loadEditForm()}>Повторить</button>
              <button className="platform-btn-secondary" onClick={() => onOpenChange(false)}>Закрыть</button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {schema.map(field => {
                const currentValue = formValues[field.name];
                const options = Array.isArray(field.options) ? field.options : [];
                const wide = isTextareaField(field.type) || (isCheckboxField(field.type) && options.length > 1);

                return (
                  <div
                    key={field.name}
                    className={wide ? 'space-y-2 sm:col-span-2' : 'space-y-2'}
                  >
                    <label className="block text-sm font-medium text-[var(--pf-text)]">
                      {field.label || field.name}
                      {field.required ? <span className="ml-1 text-[var(--pf-danger)]">*</span> : null}
                    </label>

                    {isTextareaField(field.type) ? (
                      <textarea
                        className="platform-input min-h-[140px] w-full"
                        placeholder={field.placeholder || ''}
                        value={typeof currentValue === 'string' ? currentValue : ''}
                        onChange={event => setStringField(field.name, event.target.value)}
                      />
                    ) : isSelectField(field.type) ? (
                      <select
                        className="platform-select w-full"
                        value={typeof currentValue === 'string' ? currentValue : ''}
                        onChange={event => setStringField(field.name, event.target.value)}
                      >
                        {!field.required ? <option value="">{field.placeholder || 'Не выбрано'}</option> : null}
                        {options.map(option => (
                          <option key={`${field.name}-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : isRadioField(field.type) ? (
                      <div className="space-y-2 rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
                        {options.map(option => (
                          <label key={`${field.name}-${option.value}`} className="flex items-center gap-3 text-sm text-[var(--pf-text)]">
                            <input
                              type="radio"
                              name={field.name}
                              value={option.value}
                              checked={currentValue === option.value}
                              onChange={event => setStringField(field.name, event.target.value)}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : isCheckboxField(field.type) && options.length > 1 ? (
                      <div className="space-y-2 rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
                        {options.map(option => {
                          const selected = Array.isArray(currentValue) ? currentValue : [];
                          return (
                            <label key={`${field.name}-${option.value}`} className="flex items-center gap-3 text-sm text-[var(--pf-text)]">
                              <input
                                type="checkbox"
                                checked={selected.includes(option.value)}
                                onChange={event => toggleMultiCheckbox(field.name, option.value, event.target.checked)}
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : isCheckboxField(field.type) ? (
                      <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] px-4 text-sm text-[var(--pf-text)]">
                        <input
                          type="checkbox"
                          checked={Boolean(currentValue)}
                          onChange={event => setBooleanField(field.name, event.target.checked)}
                        />
                        <span>{options[0]?.label || field.label || field.name}</span>
                      </label>
                    ) : (
                      <input
                        className="platform-input w-full"
                        type={field.type === 'number' ? 'number' : 'text'}
                        placeholder={field.placeholder || ''}
                        value={typeof currentValue === 'string' ? currentValue : ''}
                        onChange={event => setStringField(field.name, event.target.value)}
                      />
                    )}

                    {field.placeholder && !isTextareaField(field.type) && !isSelectField(field.type) && !isCheckboxField(field.type) && !isRadioField(field.type) ? (
                      <div className="text-xs text-[var(--pf-text-dim)]">{field.placeholder}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <button className="platform-btn-secondary" onClick={() => onOpenChange(false)} disabled={saving}>
                Отмена
              </button>
              <button className="platform-btn-primary" onClick={() => void handleSave()} disabled={saving || loading || schema.length === 0}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : 'Сохранить'}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
