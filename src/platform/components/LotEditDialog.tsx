'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from '@/shared/streamline/icons';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { ApiLotEditForm, ApiLotEditValues, ApiWarehouseLot, ApiLot, lotsApi } from '@/lib/api';
import { LotSchemaFields, normalizeSchemaFieldValue, SchemaFieldValues } from '@/platform/components/LotSchemaFields';

type EditableLotRef =
  | Pick<ApiLot, 'funpay_account_id' | 'lot_id' | 'id' | 'title' | 'account_username' | 'category_name'>
  | Pick<ApiWarehouseLot, 'funpay_account_id' | 'lot_id' | 'id' | 'title' | 'account_username' | 'category_name'>;

type LotEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: EditableLotRef | null;
  onSaved?: () => void | Promise<void>;
};

function isNativeDeliverySchemaField(name: string) {
  const clean = name.trim();
  return clean === 'secrets' || clean === 'auto_delivery' || clean.endsWith('[secrets]') || clean.endsWith('[auto_delivery]');
}

export function LotEditDialog({ open, onOpenChange, lot, onSaved }: LotEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ApiLotEditForm | null>(null);
  const [formValues, setFormValues] = useState<SchemaFieldValues>({});

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
        if (isNativeDeliverySchemaField(field.name)) continue;
        nextValues[field.name] = normalizeSchemaFieldValue(data.values?.[field.name], field.type, field.options?.length || 0);
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

  const schema = useMemo(
    () => (formData?.schema || []).filter(field => !isNativeDeliverySchemaField(field.name)),
    [formData],
  );
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
            <LotSchemaFields
              fields={schema}
              values={formValues}
              onChange={(name, value) => setFormValues(prev => ({ ...prev, [name]: value }))}
              disabled={saving}
            />

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
