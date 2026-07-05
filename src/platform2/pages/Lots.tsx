"use client";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { RaiseLogTable } from "@/platform2/components/RaiseLogTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/platform2/components/ui/card";
import { Button } from "@/platform2/components/ui/button";
import { Badge } from "@/platform2/components/ui/badge";
import { Modal } from "@/platform2/components/ui/modal";
import { Dropdown } from "@/platform2/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/platform2/components/ui/dropdown/DropdownItem";
import Select from "@/platform2/components/form/Select";
import Input from "@/platform2/components/form/input/InputField";
import TextArea from "@/platform2/components/form/input/TextArea";
import Icon from "@/platform2/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/platform2/components/ui/table";
import {
  lotsApi,
  accountsApi,
  ApiLot,
  ApiAccount,
  ApiLotCategory,
  ApiLotCategorySubcategory,
  ApiLotCreateForm,
  ApiLotEditForm,
  ApiLotCreateValues,
  ApiLotEditValues,
} from "@/lib/api";

// ──────────────────────────────────────────────────────────────────────────────
// Schema field renderer — полностью в стилях platform2
// ──────────────────────────────────────────────────────────────────────────────
type FieldValues = Record<string, string | boolean | string[]>;

function getInitialValue(
  field: ApiLotCreateForm["schema"][number]
): string | boolean | string[] {
  if (field.type === "checkbox") {
    if ((field.options || []).length > 1) return [];
    return false;
  }
  return "";
}

function SchemaFieldInput({
  field,
  value,
  onChange,
}: {
  field: ApiLotCreateForm["schema"][number];
  value: string | boolean | string[] | undefined;
  onChange: (v: string | boolean | string[]) => void;
}) {
  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  if (field.type === "select" && field.options) {
    return (
      <Select
        value={String(value ?? "")}
        onChange={(val) => onChange(val)}
      >
        <option value="">— выберите —</option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === "textarea") {
    return (
      <TextArea
        value={String(value ?? "")}
        onChange={(val) => onChange(val)}
        rows={3}
        placeholder={field.placeholder ?? ""}
      />
    );
  }

  if (field.type === "checkbox") {
    const opts = field.options || [];
    if (opts.length > 1) {
      const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-3">
          {opts.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, opt.value]
                    : selected.filter((v) => v !== opt.value);
                  onChange(next);
                }}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      );
    }
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {field.options?.[0]?.label ?? field.label}
        </span>
      </label>
    );
  }

  return (
    <Input
      type={field.type === "number" ? "number" : "text"}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder ?? ""}
    />
  );
}

function FieldGroup({
  field,
  value,
  onChange,
}: {
  field: ApiLotCreateForm["schema"][number];
  value: string | boolean | string[] | undefined;
  onChange: (v: string | boolean | string[]) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.label}
        {field.required && <span className="ml-1 text-error-500">*</span>}
      </label>
      <SchemaFieldInput field={field} value={value} onChange={onChange} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Вспомогательные функции для категорий
// ──────────────────────────────────────────────────────────────────────────────
function buildCategoryKey(cat: ApiLotCategory): string {
  return [
    cat.title_node_type || "lots",
    cat.title_node_id || cat.game_id,
    cat.variant_name || "",
  ].join(":");
}

function formatCategoryLabel(cat: ApiLotCategory): string {
  return cat.variant_name ? `${cat.game_title} / ${cat.variant_name}` : cat.game_title;
}

function isNativeDeliverySchemaField(name: string) {
  const clean = name.trim();
  return clean === "secrets" || clean === "auto_delivery" || clean.endsWith("[secrets]") || clean.endsWith("[auto_delivery]");
}

function splitWarehouseText(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// ──────────────────────────────────────────────────────────────────────────────
// Модал создания лота
// ──────────────────────────────────────────────────────────────────────────────
function LotCreateModal({
  isOpen,
  onClose,
  accounts,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  accounts: ApiAccount[];
  onCreated: () => void;
}) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [categories, setCategories] = useState<ApiLotCategory[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsError, setCatsError] = useState<string | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number>(0);
  const [formData, setFormData] = useState<ApiLotCreateForm | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FieldValues>({});
  const [warehouseText, setWarehouseText] = useState("");
  const [warehouseAutoDelivery, setWarehouseAutoDelivery] = useState(false);
  const [warehouseTemplate, setWarehouseTemplate] = useState("");
  const [creating, setCreating] = useState(false);

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  // Сброс при закрытии
  useEffect(() => {
    if (!isOpen) {
      setSelectedAccountId(null);
      setCategories([]);
      setCatsError(null);
      setSelectedCategoryKey("");
      setSelectedSubcategoryId(0);
      setFormData(null);
      setFormError(null);
      setFormValues({});
      setWarehouseText("");
      setWarehouseAutoDelivery(false);
      setWarehouseTemplate("");
      setCreating(false);
      return;
    }
    const fallback = accounts[0]?.id ?? null;
    setSelectedAccountId(fallback ? Number(fallback) : null);
  }, [isOpen, accounts]);

  // Загружаем категории при смене аккаунта
  useEffect(() => {
    if (!isOpen || !selectedAccountId) return;
    let cancelled = false;
    setCatsLoading(true);
    setCatsError(null);
    setFormData(null);
    setFormValues({});
    lotsApi.categories(selectedAccountId)
      .then((data) => {
        if (cancelled) return;
        const safe = Array.isArray(data) ? data : [];
        setCategories(safe);
        setSelectedCategoryKey(safe[0] ? buildCategoryKey(safe[0]) : "");
      })
      .catch((e) => {
        if (cancelled) return;
        setCatsError(e instanceof Error ? e.message : "Ошибка загрузки категорий");
        setCategories([]);
      })
      .finally(() => { if (!cancelled) setCatsLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, selectedAccountId]);

  const selectedCategory = useMemo(
    () => categories.find((c) => buildCategoryKey(c) === selectedCategoryKey) ?? null,
    [categories, selectedCategoryKey]
  );

  // Автовыбор первой подкатегории
  useEffect(() => {
    const subs = selectedCategory?.subcategories || [];
    if (subs.length === 0) { setSelectedSubcategoryId(0); return; }
    if (!subs.some((s) => s.id === selectedSubcategoryId)) {
      setSelectedSubcategoryId(subs[0].id);
    }
  }, [selectedCategory, selectedSubcategoryId]);

  const selectedSubcategory = useMemo<ApiLotCategorySubcategory | null>(
    () => selectedCategory?.subcategories.find((s) => s.id === selectedSubcategoryId) ?? null,
    [selectedCategory, selectedSubcategoryId]
  );

  // Загружаем схему формы при выборе подкатегории
  useEffect(() => {
    if (!isOpen || !selectedAccountId || !selectedSubcategory) {
      setFormData(null);
      setFormValues({});
      return;
    }
    let cancelled = false;
    setFormLoading(true);
    setFormError(null);
    lotsApi.getCreateForm(selectedAccountId, selectedSubcategory.id, selectedSubcategory.node_type)
      .then((data) => {
        if (cancelled) return;
        setFormData(data);
        const vals: FieldValues = {};
        for (const f of data.schema || []) {
          if (isNativeDeliverySchemaField(f.name)) continue;
          vals[f.name] = getInitialValue(f);
        }
        setFormValues(vals);
      })
      .catch((e) => {
        if (cancelled) return;
        setFormError(e instanceof Error ? e.message : "Ошибка загрузки схемы");
        setFormData(null);
        setFormValues({});
      })
      .finally(() => { if (!cancelled) setFormLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, selectedAccountId, selectedSubcategory?.id, selectedSubcategory?.node_type]);

  async function handleCreate() {
    if (!selectedAccountId || !selectedSubcategory || !formData) return;
    const schemaReady = formData.schema_status === "ready" && (formData.schema?.length || 0) > 0;
    if (!schemaReady) return;

    const values: ApiLotCreateValues = {};
    const visibleSchema = formData.schema.filter((field) => !isNativeDeliverySchemaField(field.name));
    for (const f of visibleSchema) {
      const raw = formValues[f.name];
      if (Array.isArray(raw)) values[f.name] = raw.map(String);
      else if (typeof raw === "boolean") values[f.name] = raw;
      else values[f.name] = raw == null ? "" : String(raw);
    }

    setCreating(true);
    try {
      await lotsApi.create(selectedAccountId, {
        mode: "schema",
        node_id: selectedSubcategory.id,
        node_type: selectedSubcategory.node_type,
        values,
        warehouse_items: splitWarehouseText(warehouseText),
        auto_delivery_enabled: warehouseAutoDelivery,
        auto_delivery_template: warehouseTemplate,
      });
      onCreated();
      onClose();
    } catch {
      // ignore — пользователь увидит что лот не создался
    } finally {
      setCreating(false);
    }
  }

  const subs = selectedCategory?.subcategories || [];
  const schemaReady =
    formData?.schema_status === "ready" && (formData?.schema?.length || 0) > 0;
  const visibleSchema = useMemo(
    () => (formData?.schema || []).filter((field) => !isNativeDeliverySchemaField(field.name)),
    [formData]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl p-8">
      <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Создать лот</h2>
      <p className="mb-5 text-sm text-gray-500">
        Выберите аккаунт и категорию — поля лота загрузятся из каталога FunPay.
      </p>

      <div className="space-y-4">
        {/* Аккаунт */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Аккаунт</label>
          <Select
            value={String(selectedAccountId ?? "")}
            onChange={(val) => setSelectedAccountId(Number(val))}
          >
            <option value="">Выберите аккаунт</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.username ?? `#${a.id}`}</option>
            ))}
          </Select>
        </div>

        {/* Категория */}
        {selectedAccountId && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Категория</label>
            {catsLoading ? (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                Загрузка категорий…
              </div>
            ) : catsError ? (
              <p className="text-sm text-error-500">{catsError}</p>
            ) : (
              <Select
                value={selectedCategoryKey}
                onChange={(val) => setSelectedCategoryKey(val)}
              >
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={buildCategoryKey(cat)} value={buildCategoryKey(cat)}>
                    {formatCategoryLabel(cat)}
                  </option>
                ))}
              </Select>
            )}
          </div>
        )}

        {/* Подкатегория */}
        {selectedCategory && subs.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Подкатегория</label>
            <Select
              value={String(selectedSubcategoryId)}
              onChange={(val) => setSelectedSubcategoryId(Number(val))}
            >
              {subs.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
        )}

        {/* Схема полей */}
        {formLoading && (
          <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            Загрузка полей из FunPay…
          </div>
        )}
        {formError && <p className="text-sm text-error-500">{formError}</p>}
        {formData && !schemaReady && !formLoading && (
          <p className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 dark:border-yellow-700/30 dark:bg-yellow-900/20 dark:text-yellow-400">
            Схема недоступна: {formData.sync_error ?? "требуется синхронизация с FunPay"}
          </p>
        )}
        {schemaReady && formData && (
          <>
            <div className="border-t border-gray-100 pt-4 dark:border-gray-800" />
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleSchema.map((field) => (
                <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <FieldGroup
                    field={field}
                    value={formValues[field.name]}
                    onChange={(v) => setFormValues((prev) => ({ ...prev, [field.name]: v }))}
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Товары склада</label>
                <TextArea
                  value={warehouseText}
                  onChange={setWarehouseText}
                  rows={5}
                  placeholder="Один товар на строку"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={warehouseAutoDelivery}
                  onChange={(event) => setWarehouseAutoDelivery(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Автовыдача FP Cloud</span>
              </label>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Шаблон сообщения FP Cloud</label>
                <TextArea
                  value={warehouseTemplate}
                  onChange={setWarehouseTemplate}
                  rows={3}
                  placeholder="Спасибо за покупку! Ваш товар: {item}"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          variant="primary"
          onClick={handleCreate}
          disabled={creating || !schemaReady || !selectedSubcategory}
        >
          {creating ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Создание…
            </span>
          ) : "Создать лот"}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={creating}>Отмена</Button>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Модал редактирования лота
// ──────────────────────────────────────────────────────────────────────────────
function LotEditModal({
  isOpen,
  onClose,
  lot,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  lot: ApiLot | null;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState<ApiLotEditForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FieldValues>({});
  const [saving, setSaving] = useState(false);

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  useEffect(() => {
    if (!isOpen || !lot) {
      setFormData(null);
      setLoadError(null);
      setFormValues({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    lotsApi.getEditForm(lot.funpay_account_id, lot.lot_id)
      .then((data) => {
        if (cancelled) return;
        setFormData(data);
        const vals: FieldValues = {};
        for (const f of data.schema || []) {
          if (isNativeDeliverySchemaField(f.name)) continue;
          const raw = data.values?.[f.name];
          if (f.type === "checkbox") {
            if ((f.options || []).length > 1) {
              vals[f.name] = Array.isArray(raw) ? raw.map(String) : [];
            } else {
              vals[f.name] = Boolean(raw);
            }
          } else {
            vals[f.name] = raw == null ? "" : String(raw);
          }
        }
        setFormValues(vals);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Ошибка загрузки формы");
        setFormData(null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, lot?.lot_id, lot?.funpay_account_id]);

  async function handleSave() {
    if (!lot || !formData) return;
    const values: ApiLotEditValues = {};
    for (const f of visibleSchema) {
      const raw = formValues[f.name];
      if (Array.isArray(raw)) values[f.name] = raw.map(String);
      else if (typeof raw === "boolean") values[f.name] = raw;
      else values[f.name] = raw == null ? "" : String(raw);
    }
    setSaving(true);
    try {
      await lotsApi.update(lot.funpay_account_id, lot.lot_id, { mode: "schema", values });
      onSaved();
      onClose();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const visibleSchema = useMemo(
    () => (formData?.schema || []).filter((field) => !isNativeDeliverySchemaField(field.name)),
    [formData],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl p-8">
      <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Редактировать лот</h2>
      {lot && (
        <p className="mb-5 line-clamp-1 text-sm text-gray-400">{lot.title}</p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      )}
      {loadError && (
        <p className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700/30 dark:bg-error-900/20 dark:text-error-400">
          {loadError}
        </p>
      )}

      {!loading && formData && visibleSchema.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleSchema.map((field) => (
            <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
              <FieldGroup
                field={field}
                value={formValues[field.name]}
                onChange={(v) => setFormValues((prev) => ({ ...prev, [field.name]: v }))}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && formData && visibleSchema.length === 0 && (
        <p className="text-sm text-gray-400">Нет редактируемых полей для этого лота.</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || loading || !!loadError || !formData}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Сохранение…
            </span>
          ) : "Сохранить"}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={saving}>Отмена</Button>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Основная страница
// ──────────────────────────────────────────────────────────────────────────────
export default function LotsPage() {
  const [lots, setLots] = useState<ApiLot[]>([]);
  const [lotsLoading, setLotsLoading] = useState(true);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [search, setSearch] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editLot, setEditLot] = useState<ApiLot | null>(null);
  const [raising, setRaising] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    lotsApi.listAll().then(setLots).catch(() => {}).finally(() => setLotsLoading(false));
    accountsApi.list().then(setAccounts).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return lots
      .filter((l) => !filterAccount || String(l.funpay_account_id) === filterAccount)
      .filter((l) => !search || l.title.toLowerCase().includes(search.toLowerCase()));
  }, [lots, filterAccount, search]);

  async function reloadLots() {
    const updated = await lotsApi.listAll().catch(() => lots);
    setLots(updated);
  }

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (filterAccount) {
        // Refresh single selected account
        const fresh = await lotsApi.listByAccount(filterAccount, { refresh: true });
        setLots((prev) => [
          ...prev.filter((l) => String(l.funpay_account_id) !== filterAccount),
          ...fresh,
        ]);
      } else {
        // Refresh all accounts
        const accountIds = accounts.map((a) => String(a.id));
        const results = await Promise.allSettled(
          accountIds.map((id) => lotsApi.listByAccount(id, { refresh: true }))
        );
        const freshAll: ApiLot[] = [];
        results.forEach((r) => {
          if (r.status === "fulfilled") freshAll.push(...r.value);
        });
        setLots(freshAll);
      }
      toast.success("Лоты обновлены с FunPay");
    } catch {
      toast.error("Не удалось обновить лоты");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleRaise(lot: ApiLot) {
    setRaising(lot.id);
    setOpenDropdownId(null);
    try {
      await lotsApi.raiseLot(lot.funpay_account_id, lot.lot_id);
      toast.success("Лот поднят");
    } catch {
      toast.error("Не удалось поднять лот");
    } finally {
      setRaising(null);
    }
  }

  async function handleToggleActive(lot: ApiLot) {
    setToggling(lot.id);
    try {
      await lotsApi.update(lot.funpay_account_id, lot.lot_id, {
        mode: "schema",
        values: { is_active: !lot.is_active },
      });
      setLots((prev) =>
        prev.map((l) => (l.id === lot.id ? { ...l, is_active: !l.is_active } : l))
      );
    } catch {
      toast.error("Не удалось изменить статус лота");
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(lot: ApiLot) {
    setOpenDropdownId(null);
    try {
      await lotsApi.delete(lot.funpay_account_id, lot.lot_id);
      setLots((prev) => prev.filter((l) => l.id !== lot.id));
      toast.success("Лот удалён");
    } catch {
      toast.error("Не удалось удалить лот");
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Лоты</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 sm:flex-none"
          >
            <Icon
              name="refresh"
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Обновление…" : "Обновить с FunPay"}
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)} className="flex-1 sm:flex-none">
            <Icon name="plus" className="mr-2 h-4 w-4" />
            Создать лот
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Все лоты</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                type="text"
                placeholder="Поиск"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 flex-1 sm:flex-none sm:w-48"
              />
              <Select
                value={filterAccount}
                onChange={setFilterAccount}
                className="flex-1 sm:flex-none sm:w-44"
              >
                <option value="">Все аккаунты</option>
                {accounts.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.username ?? `#${a.id}`}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {lotsLoading ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/5" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6 ml-auto" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Icon name="box-cube" className="h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">
                Лоты не найдены
              </h3>
              <p className="mt-2 text-sm text-gray-500">По текущим фильтрам нет подходящих лотов.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Лот</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Категория</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Аккаунт</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Цена</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Кол-во</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Статус</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Действия</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lot) => (
                    <TableRow key={lot.id}>

                      {/* LOT NAME */}
                      <TableCell className="px-5 py-4 max-w-[260px]">
                        <p className="font-medium text-gray-800 dark:text-white leading-snug line-clamp-2">
                          {lot.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{lot.description ?? ""}</p>
                        <p className="mt-0.5 text-xs text-gray-300 dark:text-gray-600">ID: {lot.lot_id}</p>
                      </TableCell>

                      {/* CATEGORY */}
                      <TableCell className="px-5 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{lot.category_name}</span>
                      </TableCell>

                      {/* ACCOUNT */}
                      <TableCell className="px-5 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{lot.account_username}</span>
                      </TableCell>

                      {/* PRICE */}
                      <TableCell className="px-5 py-4">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">
                          {lot.price.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">₽</span>
                      </TableCell>

                      {/* QUANTITY */}
                      <TableCell className="px-5 py-4">
                        <span className={`text-sm font-medium ${(lot.amount ?? 0) > 0 ? "text-success-500" : "text-gray-400"}`}>
                          {lot.amount ?? 0}
                        </span>
                      </TableCell>

                      {/* STATUS — toggle switch */}
                      <TableCell className="px-5 py-4">
                        <button
                          onClick={() => handleToggleActive(lot)}
                          disabled={toggling === lot.id}
                          className="flex items-center gap-2 group"
                          title={lot.is_active ? "Выключить лот" : "Включить лот"}
                        >
                          <span
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              lot.is_active ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                            } ${toggling === lot.id ? "opacity-60" : ""}`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                                lot.is_active ? "translate-x-4.5" : "translate-x-0.5"
                              }`}
                            />
                          </span>
                          <Badge variant={lot.is_active ? "success" : "secondary"} className="text-xs">
                            {lot.is_active ? "Активен" : "Выключен"}
                          </Badge>
                        </button>
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={raising === lot.id}
                            onClick={() => handleRaise(lot)}
                          >
                            <Icon name="arrow-up" className="mr-1.5 h-3.5 w-3.5" />
                            {raising === lot.id ? "…" : "Поднять"}
                          </Button>

                          <div className="relative">
                            <button
                              className="dropdown-toggle flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
                              onClick={() => setOpenDropdownId((prev) => (prev === lot.id ? null : lot.id))}
                            >
                              <Icon name="horizontal-dots" className="h-4 w-4" />
                            </button>

                            <Dropdown
                              isOpen={openDropdownId === lot.id}
                              onClose={() => setOpenDropdownId(null)}
                              className="w-44 py-1"
                            >
                              <DropdownItem
                                onItemClick={() => { setOpenDropdownId(null); setEditLot(lot); }}
                                baseClassName="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                <Icon name="pencil" className="h-4 w-4 text-gray-400" />
                                Редактировать
                              </DropdownItem>
                              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                              <DropdownItem
                                onItemClick={() => handleDelete(lot)}
                                baseClassName="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                              >
                                <Icon name="trash" className="h-4 w-4" />
                                Удалить
                              </DropdownItem>
                            </Dropdown>
                          </div>
                        </div>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* История подъёма лотов */}
      {filterAccount && (
        <RaiseLogTable accountId={Number(filterAccount)} />
      )}

      {/* MODALS */}
      <LotCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        accounts={accounts}
        onCreated={reloadLots}
      />

      <LotEditModal
        isOpen={editLot !== null}
        onClose={() => setEditLot(null)}
        lot={editLot}
        onSaved={reloadLots}
      />
    </div>
  );
}
