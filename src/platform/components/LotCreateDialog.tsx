'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from '@/shared/streamline/icons';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import {
  ApiAccount,
  ApiLotCategory,
  ApiLotCategorySubcategory,
  ApiLotCreateForm,
  ApiLotCreateValues,
  lotsApi,
} from '@/lib/api';
import {
  getInitialCreateFieldValue,
  LotSchemaFields,
  SchemaFieldValues,
} from '@/platform/components/LotSchemaFields';

type LotCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: ApiAccount[];
  initialAccountId?: number | null;
  onCreated?: (result: { accountId: number; lotId?: string }) => void | Promise<void>;
};

function buildCategoryKey(category: ApiLotCategory) {
  return [
    category.title_node_type || 'lots',
    category.title_node_id || category.game_id,
    category.variant_name || '',
    category.game_title,
  ].join(':');
}

function formatCategoryLabel(category: ApiLotCategory) {
  const suffix = category.variant_name ? ` / ${category.variant_name}` : '';
  return `${category.game_title}${suffix}`;
}

function isCreateFieldEmpty(field: ApiLotCreateForm['schema'][number], raw: SchemaFieldValues[string]) {
  if (field.type === 'checkbox') {
    if ((field.options || []).length > 1) {
      return !Array.isArray(raw) || raw.length === 0;
    }
    return !Boolean(raw);
  }
  return typeof raw !== 'string' || raw.trim() === '';
}

function coerceCreateFieldValue(raw: SchemaFieldValues[string]) {
  if (Array.isArray(raw)) {
    return raw.map(item => String(item));
  }
  if (typeof raw === 'boolean') {
    return raw;
  }
  return raw == null ? '' : String(raw);
}

function isNativeDeliverySchemaField(name: string) {
  const clean = name.trim();
  return clean === 'secrets' || clean === 'auto_delivery' || clean.endsWith('[secrets]') || clean.endsWith('[auto_delivery]');
}

function splitWarehouseText(value: string) {
  return value
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

export function LotCreateDialog({ open, onOpenChange, accounts, initialAccountId, onCreated }: LotCreateDialogProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [categories, setCategories] = useState<ApiLotCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number>(0);

  const [formData, setFormData] = useState<ApiLotCreateForm | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<SchemaFieldValues>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [warehouseText, setWarehouseText] = useState('');
  const [warehouseAutoDelivery, setWarehouseAutoDelivery] = useState(false);
  const [warehouseTemplate, setWarehouseTemplate] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) {
      setCategories([]);
      setCategoriesError(null);
      setSelectedCategoryKey('');
      setSelectedSubcategoryId(0);
      setFormData(null);
      setFormError(null);
      setFormValues({});
      setTouchedFields({});
      setWarehouseText('');
      setWarehouseAutoDelivery(false);
      setWarehouseTemplate('');
      setCreating(false);
      return;
    }

    const fallbackAccountId = initialAccountId ?? accounts[0]?.id ?? null;
    setSelectedAccountId(fallbackAccountId);
  }, [open, initialAccountId, accounts]);

  useEffect(() => {
    if (!open || !selectedAccountId) return;

    let cancelled = false;
    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoriesError(null);
      setFormData(null);
      setFormError(null);
      setFormValues({});
      setTouchedFields({});
      try {
        const data = await lotsApi.categories(selectedAccountId);
        if (cancelled) return;
        const safe = Array.isArray(data) ? data : [];
        setCategories(safe);
        setSelectedCategoryKey(prev => {
          if (prev && safe.some(category => buildCategoryKey(category) === prev)) {
            return prev;
          }
          return safe[0] ? buildCategoryKey(safe[0]) : '';
        });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Ошибка загрузки категорий';
        setCategories([]);
        setCategoriesError(message);
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, [open, selectedAccountId]);

  const selectedCategory = useMemo(
    () => categories.find(category => buildCategoryKey(category) === selectedCategoryKey) ?? null,
    [categories, selectedCategoryKey],
  );

  useEffect(() => {
    const subcategories = selectedCategory?.subcategories || [];
    if (subcategories.length === 0) {
      setSelectedSubcategoryId(0);
      return;
    }
    if (!subcategories.some(item => item.id === selectedSubcategoryId)) {
      setSelectedSubcategoryId(subcategories[0].id);
    }
  }, [selectedCategory, selectedSubcategoryId]);

  const selectedSubcategory = useMemo<ApiLotCategorySubcategory | null>(
    () => selectedCategory?.subcategories.find(item => item.id === selectedSubcategoryId) ?? null,
    [selectedCategory, selectedSubcategoryId],
  );

  async function loadCreateForm() {
    if (!open || !selectedAccountId || !selectedSubcategory) return;

    setFormLoading(true);
    setFormError(null);
    try {
      const data = await lotsApi.getCreateForm(selectedAccountId, selectedSubcategory.id, selectedSubcategory.node_type);
      setFormData(data);

      const nextValues: SchemaFieldValues = {};
      for (const field of data.schema || []) {
        if (isNativeDeliverySchemaField(field.name)) {
          continue;
        }
        nextValues[field.name] = getInitialCreateFieldValue(field);
      }
      setFormValues(nextValues);
      setTouchedFields({});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки формы создания';
      setFormError(message);
      setFormData(null);
      setFormValues({});
      setTouchedFields({});
    } finally {
      setFormLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !selectedAccountId || !selectedSubcategory) {
      setFormData(null);
      setFormError(null);
      setFormValues({});
      setTouchedFields({});
      return;
    }
    void loadCreateForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedAccountId, selectedSubcategory?.id, selectedSubcategory?.node_type]);

  const schemaReady = formData?.schema_status === 'ready' && (formData.schema?.length || 0) > 0;
  const visibleSchema = useMemo(
    () => (formData?.schema || []).filter(field => !isNativeDeliverySchemaField(field.name)),
    [formData],
  );

  async function handleCreate() {
    if (!selectedAccountId) {
      toast.error('Выберите аккаунт');
      return;
    }
    if (!selectedSubcategory) {
      toast.error('Выберите подкатегорию');
      return;
    }
    if (!formData || !schemaReady) {
      toast.error('Схема формы пока недоступна');
      return;
    }

    for (const field of visibleSchema) {
      if (field.required && isCreateFieldEmpty(field, formValues[field.name])) {
        toast.error(`Заполните поле «${field.label || field.name}»`);
        return;
      }
    }

    const values: ApiLotCreateValues = {};
    for (const field of visibleSchema) {
      const rawValue = formValues[field.name];
      const touched = Boolean(touchedFields[field.name]);
      const shouldInclude = touched || (field.required && !isCreateFieldEmpty(field, rawValue));
      if (!shouldInclude) continue;
      values[field.name] = coerceCreateFieldValue(rawValue);
    }

    setCreating(true);
    try {
      const result = await lotsApi.create(selectedAccountId, {
        mode: 'schema',
        node_id: selectedSubcategory.id,
        node_type: selectedSubcategory.node_type,
        values,
        warehouse_items: splitWarehouseText(warehouseText),
        auto_delivery_enabled: warehouseAutoDelivery,
        auto_delivery_template: warehouseTemplate,
      });
      toast.success('Лот создан');
      onOpenChange(false);
      if (onCreated) {
        const createdLotId = typeof result?.id === 'string' && result.id.trim() ? result.id.trim() : undefined;
        await onCreated({ accountId: selectedAccountId, lotId: createdLotId });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка создания лота');
    } finally {
      setCreating(false);
    }
  }

  const categoryOptions = categories || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="platform-dialog-content max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-[960px]">
        <DialogHeader>
          <DialogTitle>Создать лот</DialogTitle>
          <div className="text-sm text-[var(--pf-text-muted)]">
            Сначала выберите аккаунт, категорию и подкатегорию, затем заполните схему из каталога.
          </div>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-[var(--pf-text)]">Аккаунт</span>
            <select
              className="platform-select w-full"
              value={selectedAccountId ?? ''}
              onChange={event => setSelectedAccountId(Number(event.target.value))}
              disabled={creating || accounts.length === 0}
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.username || `ID ${account.id}`}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-[var(--pf-text)]">Категория</span>
            <select
              className="platform-select w-full"
              value={selectedCategoryKey}
              onChange={event => setSelectedCategoryKey(event.target.value)}
              disabled={categoriesLoading || creating || categoryOptions.length === 0}
            >
              {categoryOptions.length === 0 ? (
                <option value="">{categoriesLoading ? 'Загрузка категорий...' : 'Нет категорий'}</option>
              ) : (
                categoryOptions.map(category => (
                  <option key={buildCategoryKey(category)} value={buildCategoryKey(category)}>
                    {formatCategoryLabel(category)}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="block text-sm font-medium text-[var(--pf-text)]">Подкатегория</span>
            <select
              className="platform-select w-full"
              value={selectedSubcategoryId || ''}
              onChange={event => setSelectedSubcategoryId(Number(event.target.value))}
              disabled={creating || !selectedCategory || (selectedCategory.subcategories?.length || 0) === 0}
            >
              {!selectedCategory || (selectedCategory.subcategories?.length || 0) === 0 ? (
                <option value="">Нет подкатегорий</option>
              ) : (
                selectedCategory.subcategories.map(subcategory => (
                  <option key={`${subcategory.node_type}:${subcategory.id}`} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>

        {categoriesError ? (
          <div className="rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-5 text-sm text-[var(--pf-text-muted)]">
            {categoriesError}
          </div>
        ) : null}

        {formLoading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[var(--pf-accent)]" />
          </div>
        ) : formError ? (
          <div className="space-y-4 rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-5">
            <div className="text-sm text-[var(--pf-text-muted)]">{formError}</div>
            <div className="flex gap-2">
              <button className="platform-btn-primary" onClick={() => void loadCreateForm()}>Повторить</button>
              <button className="platform-btn-secondary" onClick={() => onOpenChange(false)}>Закрыть</button>
            </div>
          </div>
        ) : formData?.schema_status === 'missing' ? (
          <div className="space-y-4 rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-5">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[var(--pf-text)]">Схема ещё не синхронизирована</div>
              <div className="text-sm text-[var(--pf-text-muted)]">
                Для этой подкатегории пока нет пригодной схемы. Создание временно недоступно.
              </div>
              {formData.sync_error ? (
                <div className="text-xs text-[var(--pf-text-dim)]">Последняя ошибка синка: {formData.sync_error}</div>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button className="platform-btn-primary" onClick={() => void loadCreateForm()}>Повторить</button>
              <button className="platform-btn-secondary" onClick={() => onOpenChange(false)}>Закрыть</button>
            </div>
          </div>
        ) : formData ? (
          <>
            <div className="rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] px-4 py-3 text-sm text-[var(--pf-text-muted)]">
              {formData.meta?.category_title || selectedCategory?.game_title || 'Категория'}
              {formData.meta?.variant_name ? ` / ${formData.meta.variant_name}` : ''}
              {' · '}
              {formData.meta?.subcategory_name || selectedSubcategory?.name || 'Подкатегория'}
              {formData.meta?.node_type ? ` · ${formData.meta.node_type}` : ''}
              {formData.meta?.node_id ? ` · node ${formData.meta.node_id}` : ''}
            </div>

            <LotSchemaFields
              fields={visibleSchema}
              values={formValues}
              onChange={(name, value) => {
                setFormValues(prev => ({ ...prev, [name]: value }));
                setTouchedFields(prev => ({ ...prev, [name]: true }));
              }}
              disabled={creating}
            />

            <div className="grid gap-4 rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[var(--pf-text)]">Товары склада</span>
                <textarea
                  className="platform-textarea min-h-[140px] w-full"
                  value={warehouseText}
                  onChange={event => setWarehouseText(event.target.value)}
                  placeholder="Один товар на строку"
                  disabled={creating}
                />
              </label>
              <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-surface-2)] px-4 text-sm text-[var(--pf-text)]">
                <input
                  type="checkbox"
                  checked={warehouseAutoDelivery}
                  onChange={event => setWarehouseAutoDelivery(event.target.checked)}
                  disabled={creating}
                />
                <span>Автовыдача FP Cloud</span>
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[var(--pf-text)]">Шаблон сообщения FP Cloud</span>
                <textarea
                  className="platform-textarea min-h-[100px] w-full"
                  value={warehouseTemplate}
                  onChange={event => setWarehouseTemplate(event.target.value)}
                  placeholder="Спасибо за покупку! Ваш товар: {item}"
                  disabled={creating}
                />
              </label>
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <button className="platform-btn-secondary" onClick={() => onOpenChange(false)} disabled={creating}>
                Отмена
              </button>
              <button className="platform-btn-primary" onClick={() => void handleCreate()} disabled={creating || !schemaReady}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : 'Создать'}
              </button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
