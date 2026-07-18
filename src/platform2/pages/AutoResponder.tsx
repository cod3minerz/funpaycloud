"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  AlertTriangle,
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
  account_id: number | null;
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
    position,
  };
}

function newDraft(accounts: ApiAccount[]): Draft {
  return {
    account_id: accounts.length === 1 ? accounts[0].id : null,
    name: "",
    menu_text: "",
    commands: [newCommand()],
  };
}

function draftFromResponder(item: AutoResponder): Draft {
  return {
    id: item.id,
    account_id: item.funpay_account_id,
    name: item.name,
    menu_text: item.menu_text,
    commands: item.commands.map((command, position) => ({
      clientId: nextCommandId++,
      trigger_type: command.trigger_type,
      trigger_value: command.trigger_value,
      action_type: command.action_type,
      action_value: command.action_value || "",
      plugin_slug: command.plugin_slug || null,
      position,
    })),
  };
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

function Toggle({
  checked,
  disabled,
  label,
  testId,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  testId: string;
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
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
        checked ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

export default function AutoResponderPage() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [items, setItems] = useState<AutoResponder[]>([]);
  const [pluginsByAccount, setPluginsByAccount] = useState<Record<number, AutoResponderPlugin[]>>({});
  const pluginCacheRef = useRef(new Map<number, AutoResponderPlugin[]>());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switchingId, setSwitchingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const [assignmentItem, setAssignmentItem] = useState<AutoResponder | null>(null);
  const [assignmentAccountId, setAssignmentAccountId] = useState<number | null>(null);
  const [assignmentError, setAssignmentError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const isDraftOpen = draft !== null;

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [loadedAccounts, responders] = await Promise.all([
        accountsApi.list(),
        autoRespondersApi.listAll(),
      ]);
      setAccounts(loadedAccounts);
      setItems(responders);
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
    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    if (checkingAccess) return;
    void loadData();
  }, [checkingAccess, loadData]);

  useEffect(() => {
    if (!isDraftOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDraftOpen]);

  useEffect(() => {
    if (!isDraftOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (!saving) setDraft(null);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDraftOpen, saving]);

  const loadPluginsForAccount = useCallback(async (accountId: number) => {
    const cached = pluginCacheRef.current.get(accountId);
    if (cached) return cached;
    const loaded = await autoRespondersApi.plugins(accountId);
    pluginCacheRef.current.set(accountId, loaded);
    setPluginsByAccount((current) => ({ ...current, [accountId]: loaded }));
    return loaded;
  }, []);

  useEffect(() => {
    if (!draft?.account_id || pluginCacheRef.current.has(draft.account_id)) return;
    void loadPluginsForAccount(draft.account_id).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить плагины аккаунта");
    });
  }, [draft?.account_id, loadPluginsForAccount]);

  const plugins = draft?.account_id ? pluginsByAccount[draft.account_id] || [] : [];

  const changeDraftAccount = async (accountId: number | null) => {
    setDraft((current) => current ? { ...current, account_id: accountId } : current);
    if (!accountId) return;
    try {
      const available = await loadPluginsForAccount(accountId);
      const slugs = new Set(available.map((plugin) => plugin.slug));
      setDraft((current) => current && current.account_id === accountId ? {
        ...current,
        commands: current.commands.map((command) =>
          command.action_type === "run_plugin" && command.plugin_slug && !slugs.has(command.plugin_slug)
            ? { ...command, plugin_slug: null }
            : command,
        ),
      } : current);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить плагины аккаунта");
    }
  };

  const updateCommand = (clientId: number, patch: Partial<DraftCommand>) => {
    setDraft((current) => current ? {
      ...current,
      commands: current.commands.map((command) =>
        command.clientId === clientId ? { ...command, ...patch } : command,
      ),
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
        action_value: command.action_type === "send_message" ? command.action_value?.trim() || "" : "",
        plugin_slug: command.action_type === "run_plugin" ? command.plugin_slug || null : null,
        position,
      })),
    };
  };

  const saveResponder = async () => {
    if (!draft?.account_id) {
      toast.error("Выберите FunPay-аккаунт");
      return;
    }
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      const saved = draft.id
        ? await autoRespondersApi.update(draft.account_id, draft.id, payload)
        : await autoRespondersApi.create(draft.account_id, payload);
      setItems((current) => {
        const exists = current.some((item) => item.id === saved.id);
        return exists ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current];
      });
      setDraft(null);
      toast.success(draft?.id ? "Автоответчик обновлён" : "Автоответчик сохранён");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить автоответчик");
    } finally {
      setSaving(false);
    }
  };

  const toggleResponder = async (item: AutoResponder) => {
    setSwitchingId(item.id);
    try {
      const updated = await autoRespondersApi.setEnabled(item.funpay_account_id, item.id, !item.enabled);
      setItems((current) => current.map((candidate) => {
        if (candidate.id === updated.id) return updated;
        if (
          updated.enabled
          && candidate.enabled
          && candidate.funpay_account_id === updated.funpay_account_id
        ) return { ...candidate, enabled: false };
        return candidate;
      }));
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
      await autoRespondersApi.delete(item.funpay_account_id, item.id);
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
    setAssignmentAccountId(null);
    setAssignmentError("");
    setDraft(newDraft(accounts));
  };

  const openEditDraft = (item: AutoResponder) => {
    if (assigning) return;
    setAssignmentItem(null);
    setAssignmentAccountId(null);
    setAssignmentError("");
    setDraft(draftFromResponder(item));
  };

  const closeDraft = () => {
    if (!saving) setDraft(null);
  };

  const openAssignment = (item: AutoResponder) => {
    if (draft) return;
    setAssignmentItem(item);
    setAssignmentAccountId(item.funpay_account_id);
    setAssignmentError("");
  };

  const closeAssignment = () => {
    if (assigning) return;
    setAssignmentItem(null);
    setAssignmentAccountId(null);
    setAssignmentError("");
  };

  const assignAccount = async () => {
    if (!assignmentItem || !assignmentAccountId) return;
    if (assignmentAccountId === assignmentItem.funpay_account_id) {
      closeAssignment();
      return;
    }
    setAssigning(true);
    setAssignmentError("");
    try {
      const updated = await autoRespondersApi.assignAccount(assignmentItem.id, assignmentAccountId);
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDraft((current) => current?.id === updated.id
        ? { ...current, account_id: updated.funpay_account_id }
        : current);
      setAssignmentItem(null);
      setAssignmentAccountId(null);
      toast.success(assignmentItem.enabled
        ? "Аккаунт автоответчика изменён. Конфигурация выключена."
        : "Аккаунт автоответчика изменён.");
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Не удалось изменить аккаунт");
    } finally {
      setAssigning(false);
    }
  };

  if (checkingAccess) {
    return <LoadingState label="Проверяем доступ…" />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6" data-testid="auto-responder-page">
      <div>
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
            <Bot className="h-4 w-4" />
            DEV · только для администраторов
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">Автоответчик</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Настройте меню и команды для входящих сообщений покупателей на FunPay.
          </p>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="font-medium text-red-700 dark:text-red-300">Не удалось загрузить данные</p>
          <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/80">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Повторить
          </button>
        </div>
      ) : accounts.length === 0 && !loading ? (
        <EmptyPanel
          title="Сначала добавьте FunPay-аккаунт"
          text="Автоответчик привязывается к конкретному аккаунту продавца."
          actionLabel="Перейти к аккаунтам"
          onAction={() => router.push("/platform/accounts")}
        />
      ) : loading ? (
        <LoadingState label="Загружаем автоответчики…" />
      ) : (
        <>
          {items.length === 0 ? (
            <EmptyPanel
              title="Добавьте автоответчик"
              text="Создайте меню и добавьте команды, по которым покупатель получит нужный ответ."
              actionLabel="Добавить автоответчик"
              onAction={openNewDraft}
            />
          ) : (
            <section className="space-y-3" aria-label="Сохранённые автоответчики">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Автоответчики</h2>
                <button
                  type="button"
                  data-testid="add-auto-responder"
                  onClick={openNewDraft}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                >
                  <Plus className="h-4 w-4" /> Добавить автоответчик
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((item) => (
                  <article
                    key={item.id}
                    data-testid={`auto-responder-card-${item.id}`}
                    className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-900 ${
                      item.enabled ? "border-brand-500/40 ring-1 ring-brand-500/10" : "border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${item.enabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                            {item.enabled ? "Включён" : "Выключен"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {commandCountLabel(item.commands.length)}
                        </p>
                      </div>
                      <Toggle
                        checked={item.enabled}
                        disabled={switchingId === item.id}
                        label={`${item.enabled ? "Выключить" : "Включить"} ${item.name}`}
                        testId={`auto-responder-toggle-${item.id}`}
                        onChange={() => void toggleResponder(item)}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-950/60">
                      <div className="flex min-w-0 items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <UserRound className="h-4 w-4 shrink-0 text-brand-500" />
                        <span className="truncate">
                          FunPay-аккаунт: <span className="font-medium text-gray-900 dark:text-white">{accountLabelById(accounts, item.funpay_account_id)}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        data-testid={`auto-responder-assign-${item.id}`}
                        aria-label={`Выбрать аккаунт для ${item.name}`}
                        onClick={() => openAssignment(item)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 text-brand-600 transition hover:bg-brand-500/10 dark:text-brand-400"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                      <button
                        type="button"
                        aria-label={`Редактировать ${item.name}`}
                        onClick={() => openEditDraft(item)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <Pencil className="h-4 w-4" /> Редактировать
                      </button>
                      <button
                        type="button"
                        aria-label={`Удалить ${item.name}`}
                        disabled={deletingId === item.id}
                        onClick={() => void deleteResponder(item)}
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {draft && (
            <div
              data-testid="auto-responder-modal-backdrop"
              className="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-950/70 p-0 backdrop-blur-sm sm:p-4"
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="auto-responder-modal-title"
                aria-describedby="auto-responder-modal-description"
                data-testid="auto-responder-modal"
                className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-gray-900 sm:h-[90dvh] sm:max-w-5xl sm:rounded-2xl sm:border sm:border-gray-200 sm:dark:border-gray-800"
              >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6 sm:py-5">
                <div>
                  <h2 id="auto-responder-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                    {draft.id ? "Редактирование автоответчика" : "Новый автоответчик"}
                  </h2>
                  <p id="auto-responder-modal-description" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {draft.id ? "Изменения применятся к текущей конфигурации." : "Новая конфигурация сохранится выключенной."}
                  </p>
                </div>
                <button type="button" aria-label="Закрыть форму" disabled={saving} onClick={closeDraft} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div data-testid="auto-responder-form" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
              <div className="mb-5">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">FunPay-аккаунт</span>
                {draft.id ? (
                  <div data-testid="auto-responder-draft-account" className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                    <UserRound className="h-4 w-4 text-brand-500" />
                    {draft.account_id
                      ? accountLabelById(accounts, draft.account_id)
                      : "Аккаунт не выбран"}
                    <span className="ml-auto text-xs text-gray-400">Изменяется через + в карточке</span>
                  </div>
                ) : (
                  <select
                    aria-label="FunPay-аккаунт для нового автоответчика"
                    data-testid="auto-responder-draft-account"
                    autoFocus={accounts.length > 1}
                    value={draft.account_id ?? ""}
                    onChange={(event) => void changeDraftAccount(Number(event.target.value) || null)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                  >
                    {accounts.length > 1 && <option value="">Выберите аккаунт</option>}
                    {accounts.map((account) => <option key={account.id} value={account.id}>{accountLabel(account)}</option>)}
                  </select>
                )}
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Название автоответчика</span>
                  <input
                    data-testid="auto-responder-name"
                    autoFocus={Boolean(draft.id) || accounts.length === 1}
                    maxLength={120}
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    placeholder="Например, Основной автоответчик"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Меню для пользователя</span>
                  <textarea
                    data-testid="auto-responder-menu"
                    maxLength={2000}
                    rows={4}
                    value={draft.menu_text}
                    onChange={(event) => setDraft({ ...draft, menu_text: event.target.value })}
                    placeholder={"1 — получить инструкцию\n2 — вызвать продавца"}
                    className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                  />
                </label>
              </div>

              <div className="mt-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Команды</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Срабатывает первое совпадение сверху вниз.</p>
                  </div>
                  <button
                    type="button"
                    data-testid="add-auto-responder-command"
                    disabled={draft.commands.length >= 50}
                    onClick={addCommand}
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-500/30 px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-500/5 disabled:opacity-50 dark:text-brand-400"
                  >
                    <Plus className="h-4 w-4" /> Добавить команду
                  </button>
                </div>

                {draft.commands.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Добавьте хотя бы одну команду.
                  </div>
                )}

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
                        <select value={command.trigger_type} onChange={() => undefined} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                          <option value="keyword">Триггер-слово</option>
                        </select>
                      </label>
                      <label>
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Триггер</span>
                        <input
                          data-testid={`auto-responder-trigger-${index}`}
                          maxLength={100}
                          value={command.trigger_value}
                          onChange={(event) => updateCommand(command.clientId, { trigger_value: event.target.value })}
                          placeholder="Например, 1 или помощь"
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Действие при выполнении команды</span>
                        <select
                          data-testid={`auto-responder-action-${index}`}
                          value={command.action_type}
                          onChange={(event) => updateCommand(command.clientId, {
                            action_type: event.target.value as AutoResponderActionType,
                            action_value: "",
                            plugin_slug: null,
                          })}
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                          <option value="send_message">Отправить сообщение</option>
                          <option value="call_seller">Вызов продавца</option>
                          <option value="run_plugin">Выполнить плагин</option>
                        </select>
                      </label>
                    </div>

                    {command.action_type === "send_message" && (
                      <label className="mt-4 block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Сообщение покупателю</span>
                        <textarea
                          data-testid={`auto-responder-message-${index}`}
                          maxLength={2000}
                          rows={3}
                          value={command.action_value || ""}
                          onChange={(event) => updateCommand(command.clientId, { action_value: event.target.value })}
                          placeholder="Введите ответ, который будет отправлен в чат"
                          className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                      </label>
                    )}
                    {command.action_type === "call_seller" && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                        Продавец получит Telegram-уведомление с покупателем, сообщением и ссылкой на чат. Для включения автоответчика Telegram должен быть привязан.
                      </div>
                    )}
                    {command.action_type === "run_plugin" && (
                      <label className="mt-4 block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Подключённый плагин</span>
                        <select
                          data-testid={`auto-responder-plugin-${index}`}
                          value={command.plugin_slug || ""}
                          onChange={(event) => updateCommand(command.clientId, { plugin_slug: event.target.value || null })}
                          disabled={plugins.length === 0}
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
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
                <button
                  type="button"
                  data-testid="save-auto-responder"
                  disabled={saving}
                  onClick={() => void saveResponder()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" /> {saving ? "Сохраняем…" : "Сохранить"}
                </button>
              </div>
            </section>
            </div>
          )}
        </>
      )}

      {assignmentItem && (
        <div className="fixed inset-0 z-[100000] flex items-end justify-center bg-gray-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="auto-responder-assignment-title"
            data-testid="auto-responder-assignment-modal"
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-gray-900 sm:max-w-lg sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="auto-responder-assignment-title" className="text-lg font-semibold text-gray-900 dark:text-white">Выберите FunPay-аккаунт</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Автоответчик «{assignmentItem.name}» будет использоваться для выбранного аккаунта.</p>
              </div>
              <button type="button" aria-label="Закрыть выбор аккаунта" disabled={assigning} onClick={closeAssignment} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div role="radiogroup" aria-label="FunPay-аккаунты" className="mt-5 space-y-2">
              {accounts.map((account) => {
                const selected = assignmentAccountId === account.id;
                return (
                  <button
                    key={account.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-testid={`auto-responder-account-option-${account.id}`}
                    disabled={assigning}
                    onClick={() => {
                      setAssignmentAccountId(account.id);
                      setAssignmentError("");
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-brand-500 bg-brand-500/5 ring-1 ring-brand-500/20"
                        : "border-gray-200 hover:border-brand-500/40 dark:border-gray-700"
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${selected ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"}`}>
                      <UserRound className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{accountLabel(account)}</span>
                      <span className="block text-xs text-gray-400">Аккаунт #{account.id}</span>
                    </span>
                    <span className={`h-4 w-4 rounded-full border-4 ${selected ? "border-brand-500 bg-white" : "border-gray-300 dark:border-gray-600"}`} />
                  </button>
                );
              })}
            </div>

            {assignmentItem.enabled && assignmentAccountId !== assignmentItem.funpay_account_id && (
              <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                После смены аккаунта этот автоответчик будет выключен. Активный автоответчик выбранного аккаунта продолжит работать.
              </div>
            )}

            {assignmentError && (
              <div role="alert" data-testid="auto-responder-assignment-error" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {assignmentError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={assigning} onClick={closeAssignment} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Отмена</button>
              <button
                type="button"
                data-testid="save-auto-responder-account"
                disabled={assigning || !assignmentAccountId}
                onClick={() => void assignAccount()}
                className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assigning ? "Сохраняем…" : "Назначить"}
              </button>
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

function EmptyPanel({
  title,
  text,
  actionLabel,
  onAction,
}: {
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-14 text-center dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500"><Bot className="h-7 w-7" /></div>
      <h2 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 dark:text-gray-400">{text}</p>
      <button
        type="button"
        data-testid={actionLabel === "Добавить автоответчик" ? "add-auto-responder" : undefined}
        onClick={onAction}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
      >
        <Plus className="h-4 w-4" /> {actionLabel}
      </button>
    </div>
  );
}
