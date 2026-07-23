"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bot,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  accountsApi,
  autoRespondersApi,
  settingsApi,
  type ApiAccount,
  type AutoResponder,
  type AutoResponderActionType,
  type AutoResponderCommandInput,
  type AutoResponderInput,
  type AutoResponderPlugin,
} from "@/lib/api";

type DraftCommand = AutoResponderCommandInput & { clientId: number };
type Draft = {
  id?: number;
  name: string;
  menu_text: string;
  commands: DraftCommand[];
};

let nextCommandId = 1;

function newCommand(position = 0): DraftCommand {
  return {
    clientId: nextCommandId++,
    trigger_type: "keyword",
    trigger_value: "",
    action_type: "send_message",
    action_value: "",
    plugin_slug: null,
    include_telegram_username: false,
    position,
  };
}

function newDraft(): Draft {
  return { name: "", menu_text: "", commands: [newCommand()] };
}

function draftFromResponder(item: AutoResponder): Draft {
  return {
    id: item.id,
    name: item.name,
    menu_text: item.menu_text,
    commands: item.commands.map((command, position) => ({
      clientId: nextCommandId++,
      trigger_type: command.trigger_type,
      trigger_value: command.trigger_value,
      action_type: command.action_type,
      action_value: command.action_value || "",
      plugin_slug: command.plugin_slug || null,
      include_telegram_username: Boolean(command.include_telegram_username),
      position,
    })),
  };
}

function assignedAccountIds(item: AutoResponder): number[] {
  if (Array.isArray(item.funpay_account_ids)) return item.funpay_account_ids;
  return item.funpay_account_id ? [item.funpay_account_id] : [];
}

function accountLabel(account: ApiAccount) {
  return account.username?.trim() || `FunPay-аккаунт #${account.id}`;
}

function accountLabelById(accounts: ApiAccount[], accountId: number) {
  const account = accounts.find((candidate) => candidate.id === accountId);
  return account ? accountLabel(account) : `FunPay-аккаунт #${accountId}`;
}

function commandCountLabel(count: number) {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} команд`;
  if (mod10 === 1) return `${count} команда`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} команды`;
  return `${count} команд`;
}

function sameIds(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort((a, b) => a - b);
  const sortedRight = [...right].sort((a, b) => a - b);
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function Toggle({
  checked,
  disabled,
  label,
  testId,
  title,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  testId: string;
  title?: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-testid={testId}
      disabled={disabled}
      title={title}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
        checked ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}

export default function AutoResponderPage() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [items, setItems] = useState<AutoResponder[]>([]);
  const [plugins, setPlugins] = useState<AutoResponderPlugin[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switchingId, setSwitchingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const [assignmentItem, setAssignmentItem] = useState<AutoResponder | null>(null);
  const [assignmentAccountIds, setAssignmentAccountIds] = useState<number[]>([]);
  const [assignmentError, setAssignmentError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [quickUnassignKey, setQuickUnassignKey] = useState("");
  const modalOpen = Boolean(draft || assignmentItem);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [loadedAccounts, responders, pluginCatalog] = await Promise.all([
        accountsApi.list(),
        autoRespondersApi.listAll(),
        autoRespondersApi.plugins(),
      ]);
      setAccounts(loadedAccounts);
      setItems(responders);
      setPlugins(pluginCatalog);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось загрузить автоответчики");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    settingsApi.getProfile()
      .then((profile) => {
        if (!alive) return;
        if (!profile.is_admin) {
          router.replace("/platform/dashboard");
          return;
        }
        setCheckingAccess(false);
      })
      .catch(() => {
        if (alive) router.replace("/platform/dashboard");
      });
    return () => { alive = false; };
  }, [router]);

  useEffect(() => {
    if (!checkingAccess) void loadData();
  }, [checkingAccess, loadData]);

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (draft && !saving) setDraft(null);
      if (assignmentItem && !assigning) {
        setAssignmentItem(null);
        setAssignmentError("");
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [assignmentItem, assigning, draft, modalOpen, saving]);

  const updateCommand = (clientId: number, patch: Partial<DraftCommand>) => {
    setDraft((current) => current ? {
      ...current,
      commands: current.commands.map((command) => command.clientId === clientId ? { ...command, ...patch } : command),
    } : current);
  };

  const addCommand = () => {
    setDraft((current) => current ? {
      ...current,
      commands: [...current.commands, newCommand(current.commands.length)],
    } : current);
  };

  const removeCommand = (clientId: number) => {
    setDraft((current) => current ? {
      ...current,
      commands: current.commands
        .filter((command) => command.clientId !== clientId)
        .map((command, position) => ({ ...command, position })),
    } : current);
  };

  const moveCommand = (index: number, direction: -1 | 1) => {
    setDraft((current) => {
      if (!current) return current;
      const target = index + direction;
      if (target < 0 || target >= current.commands.length) return current;
      const commands = [...current.commands];
      [commands[index], commands[target]] = [commands[target], commands[index]];
      return { ...current, commands: commands.map((command, position) => ({ ...command, position })) };
    });
  };

  const buildPayload = (): AutoResponderInput | null => {
    if (!draft) return null;
    const name = draft.name.trim();
    const menuText = draft.menu_text.trim();
    if (!name) {
      toast.error("Введите название автоответчика");
      return null;
    }
    if (!menuText) {
      toast.error("Заполните меню для пользователя");
      return null;
    }
    if (draft.commands.length === 0) {
      toast.error("Добавьте хотя бы одну команду");
      return null;
    }
    const seen = new Set<string>();
    for (const [index, command] of draft.commands.entries()) {
      const trigger = command.trigger_value.trim();
      if (!trigger) {
        toast.error(`Введите триггер команды ${index + 1}`);
        return null;
      }
      const normalized = trigger.toLocaleLowerCase("ru-RU");
      if (seen.has(normalized)) {
        toast.error(`Триггер «${trigger}» указан несколько раз`);
        return null;
      }
      seen.add(normalized);
      if (command.action_type === "send_message" && !command.action_value?.trim()) {
        toast.error(`Введите сообщение для команды ${index + 1}`);
        return null;
      }
      if (command.action_type === "run_plugin" && !command.plugin_slug) {
        toast.error(`Выберите плагин для команды ${index + 1}`);
        return null;
      }
    }
    return {
      name,
      menu_text: menuText,
      commands: draft.commands.map((command, position) => ({
        trigger_type: "keyword",
        trigger_value: command.trigger_value.trim(),
        action_type: command.action_type,
        action_value: command.action_type === "send_message" || command.action_type === "call_seller"
          ? command.action_value?.trim() || ""
          : "",
        plugin_slug: command.action_type === "run_plugin" ? command.plugin_slug || null : null,
        include_telegram_username: command.action_type === "call_seller"
          ? Boolean(command.include_telegram_username)
          : false,
        position,
      })),
    };
  };

  const saveResponder = async () => {
    const payload = buildPayload();
    if (!draft || !payload) return;
    setSaving(true);
    try {
      const saved = draft.id
        ? await autoRespondersApi.update(draft.id, payload)
        : await autoRespondersApi.create(payload);
      setItems((current) => current.some((item) => item.id === saved.id)
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current]);
      const wasEdit = Boolean(draft.id);
      setDraft(null);
      toast.success(wasEdit ? "Автоответчик обновлён" : "Автоответчик сохранён без назначенных аккаунтов");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить автоответчик");
    } finally {
      setSaving(false);
    }
  };

  const toggleResponder = async (item: AutoResponder) => {
    if (assignedAccountIds(item).length === 0) return;
    setSwitchingId(item.id);
    try {
      const updated = await autoRespondersApi.setEnabled(item.id, !item.enabled);
      setItems((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate));
      toast.success(updated.enabled ? "Автоответчик включён" : "Автоответчик выключен");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось изменить статус");
    } finally {
      setSwitchingId(null);
    }
  };

  const deleteResponder = async (item: AutoResponder) => {
    if (!window.confirm(`Удалить автоответчик «${item.name}»?`)) return;
    setDeletingId(item.id);
    try {
      await autoRespondersApi.delete(item.id);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      if (draft?.id === item.id) setDraft(null);
      toast.success("Автоответчик удалён");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить автоответчик");
    } finally {
      setDeletingId(null);
    }
  };

  const openNewDraft = () => {
    if (assigning) return;
    setAssignmentItem(null);
    setAssignmentError("");
    setDraft(newDraft());
  };

  const openEditDraft = (item: AutoResponder) => {
    if (assigning) return;
    setAssignmentItem(null);
    setAssignmentError("");
    setDraft(draftFromResponder(item));
  };

  const closeDraft = () => {
    if (!saving) setDraft(null);
  };

  const openAssignment = (item: AutoResponder) => {
    if (draft) return;
    setAssignmentItem(item);
    setAssignmentAccountIds(assignedAccountIds(item));
    setAssignmentError("");
  };

  const closeAssignment = () => {
    if (assigning) return;
    setAssignmentItem(null);
    setAssignmentError("");
  };

  const toggleAssignmentAccount = (accountId: number) => {
    setAssignmentAccountIds((current) => current.includes(accountId)
      ? current.filter((id) => id !== accountId)
      : [...current, accountId]);
    setAssignmentError("");
  };

  const saveAssignments = async () => {
    if (!assignmentItem) return;
    const currentIds = assignedAccountIds(assignmentItem);
    if (sameIds(currentIds, assignmentAccountIds)) {
      closeAssignment();
      return;
    }
    setAssigning(true);
    setAssignmentError("");
    try {
      const updated = await autoRespondersApi.replaceAccounts(assignmentItem.id, assignmentAccountIds);
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setAssignmentItem(null);
      toast.success("Назначения автоответчика сохранены");
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Не удалось сохранить назначения");
    } finally {
      setAssigning(false);
    }
  };

  const quickUnassign = async (item: AutoResponder, accountId: number) => {
    const key = `${item.id}:${accountId}`;
    setQuickUnassignKey(key);
    try {
      const updated = await autoRespondersApi.replaceAccounts(
        item.id,
        assignedAccountIds(item).filter((id) => id !== accountId),
      );
      setItems((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate));
      toast.success("Аккаунт снят с автоответчика");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось снять аккаунт");
    } finally {
      setQuickUnassignKey("");
    }
  };

  const sortedItems = useMemo(
    () => [...items].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime() || right.id - left.id),
    [items],
  );

  if (checkingAccess) return <LoadingState label="Проверяем доступ…" />;

  return (
    <div className="mx-auto max-w-6xl space-y-6" data-testid="auto-responder-page">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
          <Bot className="h-4 w-4" /> DEV · только для администраторов
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">Автоответчик</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Настройте меню и команды, затем назначьте конфигурацию одному или нескольким FunPay-аккаунтам.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="font-medium text-red-700 dark:text-red-300">Не удалось загрузить данные</p>
          <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/80">{loadError}</p>
          <button type="button" onClick={() => void loadData()} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white">Повторить</button>
        </div>
      ) : loading ? (
        <LoadingState label="Загружаем автоответчики…" />
      ) : sortedItems.length === 0 ? (
        <EmptyPanel
          title="Добавьте автоответчик"
          text="Конфигурация сначала сохранится без аккаунтов. Назначить аккаунты можно будет через + в карточке."
          actionLabel="Добавить автоответчик"
          onAction={openNewDraft}
        />
      ) : (
        <section className="space-y-3" aria-label="Сохранённые автоответчики">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Автоответчики</h2>
            <button type="button" data-testid="add-auto-responder" onClick={openNewDraft} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600">
              <Plus className="h-4 w-4" /> Добавить автоответчик
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {sortedItems.map((item) => {
              const accountIds = assignedAccountIds(item);
              const hasAccounts = accountIds.length > 0;
              return (
                <article
                  key={item.id}
                  data-testid={`auto-responder-card-${item.id}`}
                  className={`min-w-0 rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-900 ${item.enabled ? "border-brand-500/40 ring-1 ring-brand-500/10" : "border-gray-200 dark:border-gray-800"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${item.enabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                          {item.enabled ? "Включён" : "Выключен"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{commandCountLabel(item.commands.length)}</p>
                    </div>
                    <Toggle
                      checked={item.enabled}
                      disabled={!hasAccounts || switchingId === item.id}
                      title={!hasAccounts ? "Сначала назначьте аккаунт" : undefined}
                      label={!hasAccounts ? `Сначала назначьте аккаунт для ${item.name}` : `${item.enabled ? "Выключить" : "Включить"} ${item.name}`}
                      testId={`auto-responder-toggle-${item.id}`}
                      onChange={() => void toggleResponder(item)}
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-950/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {hasAccounts ? (
                          <div className="flex min-w-0 flex-wrap gap-2" aria-label={`Назначенные аккаунты для ${item.name}`}>
                            {accountIds.map((accountId) => {
                              const key = `${item.id}:${accountId}`;
                              return (
                                <span key={accountId} data-testid={`auto-responder-account-chip-${item.id}-${accountId}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 py-1 pl-2.5 pr-1 text-xs font-medium text-brand-700 dark:text-brand-300">
                                  <UserRound className="h-3.5 w-3.5 shrink-0" />
                                  <span className="max-w-44 truncate">{accountLabelById(accounts, accountId)}</span>
                                  <button
                                    type="button"
                                    data-testid={`auto-responder-unassign-${item.id}-${accountId}`}
                                    aria-label={`Снять аккаунт ${accountLabelById(accounts, accountId)} с ${item.name}`}
                                    disabled={quickUnassignKey === key || assigning}
                                    onClick={() => void quickUnassign(item, accountId)}
                                    className="rounded-full p-0.5 transition hover:bg-brand-500/15 disabled:opacity-50"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <div data-testid={`auto-responder-unassigned-${item.id}`} className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="h-4 w-4 shrink-0" /> Назначьте аккаунт
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        data-testid={`auto-responder-assign-${item.id}`}
                        aria-label={`Выбрать аккаунты для ${item.name}`}
                        onClick={() => openAssignment(item)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 text-brand-600 transition hover:bg-brand-500/10 dark:text-brand-400"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <button type="button" aria-label={`Редактировать ${item.name}`} onClick={() => openEditDraft(item)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                      <Pencil className="h-4 w-4" /> Редактировать
                    </button>
                    <button type="button" aria-label={`Удалить ${item.name}`} disabled={deletingId === item.id} onClick={() => void deleteResponder(item)} className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {draft && (
        <div data-testid="auto-responder-modal-backdrop" className="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="auto-responder-modal-title" aria-describedby="auto-responder-modal-description" data-testid="auto-responder-modal" className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-gray-900 sm:h-[90dvh] sm:max-w-5xl sm:rounded-2xl sm:border sm:border-gray-200 sm:dark:border-gray-800">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6 sm:py-5">
              <div>
                <h2 id="auto-responder-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">{draft.id ? "Редактирование автоответчика" : "Новый автоответчик"}</h2>
                <p id="auto-responder-modal-description" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {draft.id ? "Изменения применятся ко всем назначенным аккаунтам." : "Новая конфигурация сохранится выключенной и без назначенных аккаунтов."}
                </p>
              </div>
              <button type="button" aria-label="Закрыть форму" disabled={saving} onClick={closeDraft} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
            </div>

            <div data-testid="auto-responder-form" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
              <div className="grid gap-5 lg:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Название автоответчика</span>
                  <input data-testid="auto-responder-name" autoFocus maxLength={120} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Например, Основной автоответчик" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Меню для пользователя</span>
                  <textarea data-testid="auto-responder-menu" maxLength={2000} rows={4} value={draft.menu_text} onChange={(event) => setDraft({ ...draft, menu_text: event.target.value })} placeholder={"1 — получить инструкцию\n2 — вызвать продавца"} className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                </label>
              </div>

              <div className="mt-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Команды</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Срабатывает первое совпадение сверху вниз.</p>
                  </div>
                  <button type="button" data-testid="add-auto-responder-command" disabled={draft.commands.length >= 50} onClick={addCommand} className="inline-flex items-center gap-2 rounded-lg border border-brand-500/30 px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-500/5 disabled:opacity-50 dark:text-brand-400"><Plus className="h-4 w-4" /> Добавить команду</button>
                </div>

                {draft.commands.length === 0 && <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">Добавьте хотя бы одну команду.</div>}

                {draft.commands.map((command, index) => (
                  <div key={command.clientId} data-testid={`auto-responder-command-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Команда {index + 1}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" aria-label={`Переместить команду ${index + 1} вверх`} disabled={index === 0} onClick={() => moveCommand(index, -1)} className="rounded-lg p-2 text-gray-500 hover:bg-white disabled:opacity-30 dark:hover:bg-gray-800"><ArrowUp className="h-4 w-4" /></button>
                        <button type="button" aria-label={`Переместить команду ${index + 1} вниз`} disabled={index === draft.commands.length - 1} onClick={() => moveCommand(index, 1)} className="rounded-lg p-2 text-gray-500 hover:bg-white disabled:opacity-30 dark:hover:bg-gray-800"><ArrowDown className="h-4 w-4" /></button>
                        <button type="button" aria-label={`Удалить команду ${index + 1}`} onClick={() => removeCommand(command.clientId)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label>
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Команда</span>
                        <select value={command.trigger_type} onChange={() => undefined} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"><option value="keyword">Триггер-слово</option></select>
                      </label>
                      <label>
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Триггер</span>
                        <input data-testid={`auto-responder-trigger-${index}`} maxLength={100} value={command.trigger_value} onChange={(event) => updateCommand(command.clientId, { trigger_value: event.target.value })} placeholder="Например, 1 или помощь" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Действие при выполнении команды</span>
                        <select data-testid={`auto-responder-action-${index}`} value={command.action_type} onChange={(event) => updateCommand(command.clientId, { action_type: event.target.value as AutoResponderActionType, action_value: "", plugin_slug: null, include_telegram_username: false })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                          <option value="send_message">Отправить сообщение</option>
                          <option value="call_seller">Вызов продавца</option>
                          <option value="run_plugin">Выполнить плагин</option>
                        </select>
                      </label>
                    </div>

                    {command.action_type === "send_message" && (
                      <label className="mt-4 block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Сообщение покупателю</span>
                        <textarea data-testid={`auto-responder-message-${index}`} maxLength={2000} rows={3} value={command.action_value || ""} onChange={(event) => updateCommand(command.clientId, { action_value: event.target.value })} placeholder="Введите ответ, который будет отправлен в чат" className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                      </label>
                    )}
                    {command.action_type === "call_seller" && (
                      <div className="mt-4 space-y-4">
                        <label className="block">
                          <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Ответ покупателю <span className="normal-case">(необязательно)</span></span>
                          <textarea
                            data-testid={`auto-responder-call-seller-reply-${index}`}
                            maxLength={2000}
                            rows={3}
                            value={command.action_value || ""}
                            onChange={(event) => updateCommand(command.clientId, { action_value: event.target.value })}
                            placeholder="Например, Сейчас позову продавца…"
                            className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                          <span className="mt-1.5 block text-xs text-gray-500 dark:text-gray-400">Если оставить поле пустым, сообщение покупателю не отправится.</span>
                        </label>

                        <fieldset>
                          <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Указывать ваш @username в Telegram-уведомлении?</legend>
                          <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
                            {[
                              { label: "Нет", value: false },
                              { label: "Да", value: true },
                            ].map((option) => (
                              <label
                                key={option.label}
                                data-testid={`auto-responder-call-seller-mention-${index}-${option.value ? "yes" : "no"}`}
                                className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                                  Boolean(command.include_telegram_username) === option.value
                                    ? "border-brand-500 bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-300"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`auto-responder-telegram-username-${command.clientId}`}
                                  value={option.value ? "yes" : "no"}
                                  checked={Boolean(command.include_telegram_username) === option.value}
                                  onChange={() => updateCommand(command.clientId, {
                                    include_telegram_username: option.value,
                                  })}
                                  className="sr-only"
                                />
                                {option.label}
                              </label>
                            ))}
                          </div>
                          {command.include_telegram_username && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Бот упомянет привязанный Telegram-аккаунт по его Telegram ID.
                            </p>
                          )}
                        </fieldset>

                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">Продавец получит Telegram-уведомление и короткое беззвучное голосовое сообщение для дополнительного оповещения. Для включения автоответчика Telegram должен быть привязан.</div>
                      </div>
                    )}
                    {command.action_type === "run_plugin" && (
                      <label className="mt-4 block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Плагин с поддержкой команд</span>
                        <select data-testid={`auto-responder-plugin-${index}`} value={command.plugin_slug || ""} onChange={(event) => updateCommand(command.clientId, { plugin_slug: event.target.value || null })} disabled={plugins.length === 0} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                          <option value="">{plugins.length ? "Выберите плагин" : "Нет поддерживаемых плагинов"}</option>
                          {plugins.map((plugin) => <option key={plugin.slug} value={plugin.slug}>{plugin.name}</option>)}
                        </select>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div data-testid="auto-responder-modal-footer" className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-gray-800 dark:bg-gray-900">
              <button type="button" disabled={saving} onClick={closeDraft} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Отмена</button>
              <button type="button" data-testid="save-auto-responder" disabled={saving} onClick={() => void saveResponder()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? "Сохраняем…" : "Сохранить"}</button>
            </div>
          </section>
        </div>
      )}

      {assignmentItem && (
        <div className="fixed inset-0 z-[100000] flex items-end justify-center bg-gray-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="auto-responder-assignment-title" data-testid="auto-responder-assignment-modal" className="flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 sm:max-h-[90dvh] sm:max-w-lg sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
              <div>
                <h2 id="auto-responder-assignment-title" className="text-lg font-semibold text-gray-900 dark:text-white">Назначьте FunPay-аккаунты</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Выберите все аккаунты, для которых будет использоваться «{assignmentItem.name}».</p>
              </div>
              <button type="button" aria-label="Закрыть выбор аккаунтов" disabled={assigning} onClick={closeAssignment} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              {accounts.length ? (
                <fieldset aria-label="FunPay-аккаунты" className="space-y-2">
                  <legend className="sr-only">FunPay-аккаунты</legend>
                  {accounts.map((account) => {
                    const selected = assignmentAccountIds.includes(account.id);
                    return (
                      <label key={account.id} data-testid={`auto-responder-account-option-${account.id}`} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${selected ? "border-brand-500 bg-brand-500/5 ring-1 ring-brand-500/20" : "border-gray-200 hover:border-brand-500/40 dark:border-gray-700"}`}>
                        <input type="checkbox" checked={selected} disabled={assigning} onChange={() => toggleAssignmentAccount(account.id)} className="h-4 w-4 shrink-0 accent-brand-500" />
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${selected ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"}`}><UserRound className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{accountLabel(account)}</span>
                          <span className="block text-xs text-gray-400">Аккаунт #{account.id}</span>
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-300">У вас пока нет FunPay-аккаунтов.</p>
                  <button type="button" onClick={() => router.push("/platform/accounts")} className="mt-3 text-sm font-semibold text-brand-600 dark:text-brand-400">Перейти к аккаунтам</button>
                </div>
              )}

              {assignmentItem.enabled && (
                <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Добавленные аккаунты начнут отвечать сразу, а снятые перестанут. При конфликте с другим активным автоответчиком назначения не изменятся.
                </div>
              )}

              {assignmentError && <div role="alert" data-testid="auto-responder-assignment-error" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{assignmentError}</div>}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 p-5 sm:flex-row sm:justify-end dark:border-gray-800">
              <button type="button" disabled={assigning} onClick={closeAssignment} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Отмена</button>
              <button type="button" data-testid="save-auto-responder-account" disabled={assigning} onClick={() => void saveAssignments()} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60">{assigning ? "Сохраняем…" : "Сохранить назначения"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function EmptyPanel({ title, text, actionLabel, onAction }: { title: string; text: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-14 text-center dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500"><Bot className="h-7 w-7" /></div>
      <h2 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 dark:text-gray-400">{text}</p>
      <button type="button" data-testid={actionLabel === "Добавить автоответчик" ? "add-auto-responder" : undefined} onClick={onAction} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"><Plus className="h-4 w-4" /> {actionLabel}</button>
    </div>
  );
}
