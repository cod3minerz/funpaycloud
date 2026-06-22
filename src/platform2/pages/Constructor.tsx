"use client";
import { useCallback, useContext, useEffect, useState, createContext } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel as FlowPanel,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Icon from "@/platform2/icons";
import { Modal } from "@/platform2/components/ui/modal";
import {
  accountsApi,
  scenariosApi,
  authApi,
  ApiAccount,
  ApiScenario,
  ApiScenarioLog,
} from "@/lib/api";
import { normalizePlanId, PLAN_LIMITS } from "@/shared/subscriptions";
import { toast } from "sonner";
import { useTheme } from "@/platform2/context/ThemeContext";

// ── Context для передачи scenarioId + onManualRun в узлы без props drilling ──
type ConstructorCtx = {
  scenarioId: string | null;
  onManualRun: (nodeId: string, withUser: string, text: string) => Promise<void>;
};
const ConstructorContext = createContext<ConstructorCtx>({
  scenarioId: null,
  onManualRun: async () => {},
});

// ── Types ─────────────────────────────────────────────────────────────────────

type NodeData = {
  subtype?: string;
  readOnly?: boolean;
  keyword?: string;
  client_type?: string;
  text?: string;
  prompt?: string;
  [key: string]: unknown;
};

type FlowNode = Node<NodeData>;

function parseFlowData(input: unknown): { nodes: FlowNode[]; edges: Edge[] } {
  if (!input || typeof input !== "object") return { nodes: [], edges: [] };
  const c = input as { nodes?: unknown; edges?: unknown };
  return {
    nodes: Array.isArray(c.nodes) ? (c.nodes as FlowNode[]) : [],
    edges: Array.isArray(c.edges) ? (c.edges as Edge[]) : [],
  };
}

// ── Node Components (styled for platform2) ────────────────────────────────────

function TriggerNode({ data }: NodeProps<FlowNode>) {
  const { onManualRun, scenarioId } = useContext(ConstructorContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [nodeId, setNodeId] = useState("");
  const [withUser, setWithUser] = useState("");
  const [runText, setRunText] = useState("");
  const [running, setRunning] = useState(false);

  const label =
    data.subtype === "new_order"
      ? "Новый заказ"
      : data.subtype === "manual_start"
      ? "Ручной запуск"
      : "Новое сообщение";

  const handleRun = async () => {
    if (!nodeId.trim()) { toast.error("Укажите Node ID чата"); return; }
    setRunning(true);
    try {
      await onManualRun(nodeId.trim(), withUser.trim() || "покупатель", runText.trim() || "запуск");
      toast.success("Сценарий запущен!");
      setModalOpen(false);
    } catch {
      toast.error("Ошибка запуска сценария");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <div className="min-w-[220px] overflow-hidden rounded-xl border border-brand-400 bg-white shadow-sm dark:border-brand-500 dark:bg-gray-900">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-brand-500/10 px-3 py-2 dark:border-gray-800">
          <Icon name="bolt" className="h-3.5 w-3.5 text-brand-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
            Триггер
          </span>
        </div>
        <div className="p-3">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Событие
          </label>
          <div className="text-[12px] font-medium text-gray-800 dark:text-white">{label}</div>
          {data.subtype === "manual_start" && (
            <button
              onClick={() => setModalOpen(true)}
              disabled={!scenarioId}
              className="nodrag mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              <Icon name="bolt" className="h-3 w-3" />
              Запустить вручную
            </button>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !border-none !bg-brand-500"
        />
      </div>

      {/* Modal для ввода параметров ручного запуска */}
      {modalOpen && (
        <div
          className="nodrag fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => !running && setModalOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white">Ручной запуск сценария</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Node ID чата <span className="text-error-500">*</span>
                </label>
                <input
                  autoFocus
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  placeholder="Например: 1234567"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-1 text-[10px] text-gray-400">ID чата из URL на FunPay (?node=...)</p>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Имя покупателя
                </label>
                <input
                  value={withUser}
                  onChange={(e) => setWithUser(e.target.value)}
                  placeholder="покупатель"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Текст для условий
                </label>
                <input
                  value={runText}
                  onChange={(e) => setRunText(e.target.value)}
                  placeholder="запуск"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-1 text-[10px] text-gray-400">Используется в условиях «Содержит слово»</p>
              </div>
            </div>
            <div className="flex gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
              <button
                onClick={() => setModalOpen(false)}
                disabled={running}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400"
              >
                Отмена
              </button>
              <button
                onClick={() => void handleRun()}
                disabled={running || !nodeId.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {running ? <Icon name="time" className="h-4 w-4 animate-spin" /> : <Icon name="bolt" className="h-4 w-4" />}
                {running ? "Запуск…" : "Запустить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ConditionNode({ id, data }: NodeProps<FlowNode>) {
  const { updateNodeData } = useReactFlow();
  const readOnly = Boolean(data?.readOnly);
  const borderColor = "#f79009";

  return (
    <div
      className="min-w-[220px] overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-900"
      style={{ border: `1px solid ${borderColor}` }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-none"
        style={{ background: borderColor }}
      />
      <div className="flex items-center gap-2 border-b border-gray-100 bg-warning-500/10 px-3 py-2 dark:border-gray-800">
        <Icon name="check-circle" className="h-3.5 w-3.5 text-warning-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
          Условие
        </span>
      </div>
      <div className="p-3">
        {data.subtype === "contains_word" && (
          <>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Содержит слово
            </label>
            <input
              className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[12px] text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={String(data.keyword || "")}
              onChange={(e) => !readOnly && updateNodeData(id, { keyword: e.target.value })}
              placeholder="Например: скидка"
              disabled={readOnly}
            />
          </>
        )}
        {data.subtype === "client_type" && (
          <>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Тип клиента
            </label>
            <select
              className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[12px] text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={String(data.client_type || "new")}
              onChange={(e) => !readOnly && updateNodeData(id, { client_type: e.target.value })}
              disabled={readOnly}
            >
              <option value="new">Новый клиент</option>
              <option value="returning">Повторный клиент</option>
            </select>
          </>
        )}
        <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-wide">
          <span className="text-error-500">Нет</span>
          <span className="text-success-500">Да</span>
        </div>
      </div>
      <Handle
        type="source"
        id="false"
        position={Position.Bottom}
        style={{ left: "25%", background: "#f04438" }}
        className="!h-3 !w-3 !border-none"
      />
      <Handle
        type="source"
        id="true"
        position={Position.Bottom}
        style={{ left: "75%", background: "#12b76a" }}
        className="!h-3 !w-3 !border-none"
      />
    </div>
  );
}

function ActionNode({ id, data }: NodeProps<FlowNode>) {
  const { updateNodeData } = useReactFlow();
  const readOnly = Boolean(data?.readOnly);

  return (
    <div className="min-w-[220px] overflow-hidden rounded-xl border border-success-400 bg-white shadow-sm dark:border-success-500 dark:bg-gray-900">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-none !bg-success-500"
      />
      <div className="flex items-center gap-2 border-b border-gray-100 bg-success-500/10 px-3 py-2 dark:border-gray-800">
        <Icon name="arrow-right" className="h-3.5 w-3.5 text-success-600" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
          Действие
        </span>
      </div>
      <div className="p-3">
        {data.subtype === "send_message" && (
          <>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Отправить сообщение
            </label>
            <textarea
              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[12px] text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              rows={3}
              value={String(data.text || "")}
              onChange={(e) => !readOnly && updateNodeData(id, { text: e.target.value })}
              placeholder="Введите текст..."
              disabled={readOnly}
            />
          </>
        )}
        {data.subtype === "deliver_item" && (
          <div className="text-[12px] font-medium text-gray-800 dark:text-white">
            Выдать оплаченный товар
          </div>
        )}
        {data.subtype === "notify_tg" && (
          <div className="text-[12px] font-medium text-gray-800 dark:text-white">
            Уведомление в Telegram
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-none !bg-success-500"
      />
    </div>
  );
}

function AiNode({ id, data }: NodeProps<FlowNode>) {
  const { updateNodeData } = useReactFlow();
  const readOnly = Boolean(data?.readOnly);

  return (
    <div className="min-w-[220px] overflow-hidden rounded-xl border border-violet-400 bg-white shadow-md shadow-violet-500/10 dark:border-violet-500 dark:bg-gray-900">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-none !bg-violet-500"
      />
      <div className="flex items-center gap-2 border-b border-gray-100 bg-violet-500/10 px-3 py-2 dark:border-gray-800">
        <Icon name="shooting-star" className="h-3.5 w-3.5 text-violet-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
          AI Узел
        </span>
      </div>
      <div className="p-3">
        {data.subtype === "ai_reply" && (
          <>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Инструкция (Промпт)
            </label>
            <textarea
              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[12px] text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              rows={3}
              value={String(data.prompt || "")}
              onChange={(e) => !readOnly && updateNodeData(id, { prompt: e.target.value })}
              placeholder="Инструкция для ответа..."
              disabled={readOnly}
            />
          </>
        )}
        {data.subtype === "ai_summary" && (
          <div className="text-[12px] font-medium text-gray-800 dark:text-white">
            Суммаризация диалога
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-none !bg-violet-500"
      />
    </div>
  );
}

const nodeTypes = {
  triggerNode: TriggerNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode,
  aiNode: AiNode,
};

// ── "Soon" badge ──────────────────────────────────────────────────────────────

function SoonBadge() {
  return (
    <span className="ml-auto shrink-0 rounded-full bg-warning-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-warning-600 dark:text-warning-400">
      Скоро
    </span>
  );
}

// ── Main Flow Component ───────────────────────────────────────────────────────

function ConstructorFlow() {
  const reactFlow = useReactFlow();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);
  const [selectedScenarioID, setSelectedScenarioID] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePalette, setActivePalette] = useState<string | null>(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logs, setLogs] = useState<ApiScenarioLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [planLimits, setPlanLimits] = useState<typeof PLAN_LIMITS[keyof typeof PLAN_LIMITS]>(PLAN_LIMITS.pro); // default to pro until loaded

  // Mobile read-only
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const sync = () => setIsReadOnly(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Load plan limits
  useEffect(() => {
    authApi.me().then((me) => {
      const plan = normalizePlanId(me.plan);
      setPlanLimits(
        plan === "trial" ? PLAN_LIMITS.trial
        : plan === "lite" ? PLAN_LIMITS.lite
        : plan === "pro" ? PLAN_LIMITS.pro
        : PLAN_LIMITS.ultra
      );
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setNodes((cur) =>
      cur.map((n) => ({ ...n, selected: isReadOnly ? false : n.selected, data: { ...n.data, readOnly: isReadOnly } }))
    );
    setActivePalette(null);
  }, [isReadOnly, setNodes]);

  // Normalize node type from subtype
  const normalizeNode = useCallback((n: FlowNode): FlowNode => {
    const known = new Set(["triggerNode", "conditionNode", "actionNode", "aiNode"]);
    if (known.has(String(n.type || ""))) return n;
    const sub = n.data?.subtype;
    if (sub === "new_message" || sub === "new_order" || sub === "manual_start")
      return { ...n, type: "triggerNode" };
    if (sub === "contains_word" || sub === "client_type")
      return { ...n, type: "conditionNode" };
    if (sub === "send_message" || sub === "deliver_item" || sub === "notify_tg")
      return { ...n, type: "actionNode" };
    if (sub === "ai_reply" || sub === "ai_summary") return { ...n, type: "aiNode" };
    return { ...n, type: "actionNode" };
  }, []);

  // Load accounts
  useEffect(() => {
    accountsApi
      .list()
      .then((accs) => {
        setAccounts(accs);
        if (accs.length > 0) setSelectedAccountID(accs[0].id);
        else setLoading(false);
      })
      .catch(() => {
        toast.error("Ошибка загрузки аккаунтов");
        setLoading(false);
      });
  }, []);

  // Load scenarios when account changes
  useEffect(() => {
    if (!selectedAccountID) return;
    setLoading(true);
    scenariosApi
      .list(selectedAccountID)
      .then((scens) => {
        setScenarios(scens);
        setSelectedScenarioID(scens.length > 0 ? scens[0].id : null);
        if (scens.length === 0) { setNodes([]); setEdges([]); }
      })
      .catch(() => toast.error("Ошибка загрузки сценариев"))
      .finally(() => setLoading(false));
  }, [selectedAccountID, setNodes, setEdges]);

  // Load flow when scenario changes
  useEffect(() => {
    if (!selectedScenarioID) { setNodes([]); setEdges([]); return; }
    const scenario = scenarios.find((s) => s.id === selectedScenarioID);
    if (!scenario?.flow_data) { setNodes([]); setEdges([]); return; }
    try {
      const raw = typeof scenario.flow_data === "string"
        ? JSON.parse(scenario.flow_data || "{}")
        : scenario.flow_data;
      const parsed = parseFlowData(raw);
      const loadedNodes = parsed.nodes.map((n) => normalizeNode({ ...n, data: { ...n.data, readOnly: isReadOnly } }));
      setNodes(loadedNodes);
      setEdges(parsed.edges);
      requestAnimationFrame(() => reactFlow.fitView({ padding: 0.24, duration: 260 }));
    } catch {
      toast.error("Не удалось загрузить данные графа");
    }
  }, [selectedScenarioID, scenarios, setNodes, setEdges, normalizeNode, reactFlow, isReadOnly]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => {
        // Была ли связь между source и target уже?
        const wasConnected = eds.some(
          (e) =>
            e.source === params.source &&
            e.sourceHandle === (params.sourceHandle ?? null) &&
            e.target === params.target
        );
        // Удаляем старое ребро с того же выхода (если было)
        const filtered = eds.filter(
          (e) =>
            !(e.source === params.source && e.sourceHandle === (params.sourceHandle ?? null))
        );
        // Если тянули на тот же узел — это развязка (disconnect)
        if (wasConnected) return filtered;
        // Иначе — новая связь (replace)
        return addEdge(params, filtered);
      });
    },
    [setEdges]
  );

  const isValidConnection = useCallback(
    (connection: Connection) => {
      // Нельзя связать узел с самим собой
      if (connection.source === connection.target) return false;
      // Проверка на циклы (без блокировки замены рёбер — этим занимается onConnect)
      const hasCycle = (target: string, visited = new Set<string>()): boolean => {
        if (visited.has(target) || target === connection.source) return true;
        visited.add(target);
        return edges.filter((e) => e.source === target).some((e) => hasCycle(e.target, new Set(visited)));
      };
      return !hasCycle(connection.target);
    },
    [edges]
  );

  const handleSave = async () => {
    if (isReadOnly) { toast.info("Редактирование доступно только на десктопе"); return; }
    if (!selectedScenarioID) return;
    setSaving(true);
    const scenario = scenarios.find((s) => s.id === selectedScenarioID);
    if (!scenario) { setSaving(false); return; }
    try {
      await scenariosApi.update(selectedScenarioID, {
        name: scenario.name,
        is_active: scenario.is_active,
        flow_data: JSON.stringify({ nodes, edges }),
      });
      toast.success("Сценарий сохранён");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedAccountID || !newName.trim()) return;
    if (scenarios.length >= planLimits.scenarios) {
      toast.error(`Лимит сценариев для вашего тарифа: ${planLimits.scenarios}. Перейдите на более высокий тариф.`);
      setCreateOpen(false);
      return;
    }
    setCreating(true);
    try {
      const res = await scenariosApi.create(selectedAccountID, {
        name: newName.trim(),
        trigger_type: "chat_message",
        flow_data: "{}",
        is_active: true,
      });
      const now = new Date().toISOString();
      const fresh: ApiScenario = {
        id: res.id, user_id: 0, funpay_account_id: selectedAccountID,
        name: newName.trim(), trigger_type: "chat_message",
        flow_data: "{}", is_active: true, created_at: now, updated_at: now,
      };
      setScenarios((prev) => [fresh, ...prev]);
      setSelectedScenarioID(res.id);
      setNodes([]); setEdges([]);
      setCreateOpen(false); setNewName("");
      toast.success("Сценарий создан");
    } catch { toast.error("Ошибка создания"); }
    finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!selectedScenarioID) return;
    setDeleting(true);
    const id = selectedScenarioID;
    try {
      await scenariosApi.delete(id);
      const next = scenarios.filter((s) => s.id !== id);
      setScenarios(next);
      setSelectedScenarioID(next.length > 0 ? next[0].id : null);
      if (next.length === 0) { setNodes([]); setEdges([]); }
      setDeleteOpen(false);
      toast.success("Сценарий удалён");
    } catch { toast.error("Не удалось удалить"); }
    finally { setDeleting(false); }
  };

  const handleLogs = async () => {
    if (!selectedScenarioID) return;
    setIsLogsOpen(true); setLogsLoading(true);
    try { setLogs(await scenariosApi.getLogs(selectedScenarioID)); }
    catch { toast.error("Ошибка загрузки логов"); }
    finally { setLogsLoading(false); }
  };

  const addNode = (type: string, subtype: string, extra: Record<string, unknown> = {}) => {
    if (isReadOnly) return;
    const maxNodes = planLimits.nodes_per_scenario;
    if (maxNodes !== Infinity && nodes.length >= maxNodes) {
      toast.error(`Лимит узлов в сценарии для вашего тарифа: ${maxNodes}.`);
      setActivePalette(null);
      return;
    }
    if (type === "aiNode" && !planLimits.ai_nodes) {
      toast.error("AI-узлы доступны начиная с тарифа Pro.");
      setActivePalette(null);
      return;
    }
    setNodes((nds) => [
      ...nds,
      {
        id: `node_${Date.now()}`,
        type,
        position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
        data: { subtype, ...extra, readOnly: isReadOnly },
      },
    ]);
    setActivePalette(null);
  };

  const handleDuplicate = () => {
    const selected = nodes.filter((n) => n.selected);
    if (!selected.length) return;
    setNodes((nds) => [
      ...nds,
      ...selected.map((n) => ({
        ...n,
        id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        position: { x: n.position.x + 40, y: n.position.y + 40 },
        selected: false,
      })),
    ]);
  };

  const handleDeleteNodes = () => {
    const ids = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    setNodes((nds) => nds.filter((n) => !ids.has(n.id)));
    setEdges((eds) => eds.filter((e) => !ids.has(e.source) && !ids.has(e.target)));
  };

  const handleManualRun = useCallback(
    async (nodeId: string, withUser: string, text: string) => {
      if (!selectedScenarioID) throw new Error("нет сценария");
      await scenariosApi.run(selectedScenarioID, nodeId, withUser, text);
    },
    [selectedScenarioID]
  );

  const hasSelected = !isReadOnly && nodes.some((n) => n.selected);
  const edgeOpts = { animated: true, style: { stroke: "#465fff", strokeWidth: 2 } };
  const bgDotColor = isDark ? "#374151" : "#d1d5db";
  const bgFill = isDark ? "#030712" : "#f9fafb";

  return (
    <ConstructorContext.Provider value={{ scenarioId: selectedScenarioID, onManualRun: handleManualRun }}>
    <div
      className="-mx-4 -my-4 md:-mx-6 md:-my-6 relative flex flex-col overflow-hidden"
      style={{ height: "calc(100dvh - 4rem)" }}
    >
      {/* ── TOOLBAR ── */}
      <div className="relative z-20 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedAccountID ?? ""}
              onChange={(e) => setSelectedAccountID(Number(e.target.value))}
              className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="" disabled>Аккаунт</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.username ?? `#${a.id}`}</option>
              ))}
            </select>
            <Icon name="chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="relative">
            <select
              value={selectedScenarioID ?? ""}
              onChange={(e) => setSelectedScenarioID(e.target.value)}
              className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Выберите сценарий</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Icon name="chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
          {isReadOnly && (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-800">
              Режим просмотра
            </span>
          )}
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogs}
              disabled={!selectedScenarioID}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Icon name="time" className="h-4 w-4" />
              История
            </button>
            <button
              onClick={() => { setNewName(""); setCreateOpen(true); }}
              disabled={!selectedAccountID}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Icon name="plus" className="h-4 w-4" />
              Создать
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              disabled={!selectedScenarioID || deleting}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-error-50 hover:text-error-500 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <Icon name="trash" className="h-4 w-4" />
              Удалить
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedScenarioID}
              className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <Icon name={saving ? "time" : "check-line"} className={`h-4 w-4 ${saving ? "animate-spin" : ""}`} />
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        )}
      </div>

      {/* ── CANVAS ── */}
      <div className="relative flex-1 overflow-hidden" style={{ background: bgFill, minHeight: 0 }}>
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-gray-950/60">
            <Icon name="time" className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={isReadOnly ? undefined : onNodesChange}
          onEdgesChange={isReadOnly ? undefined : onEdgesChange}
          onConnect={isReadOnly ? undefined : onConnect}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={edgeOpts}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={!isReadOnly}
          nodesConnectable={!isReadOnly}
          elementsSelectable={!isReadOnly}
          selectionOnDrag={!isReadOnly}
          deleteKeyCode={isReadOnly ? null : ["Backspace", "Delete"]}
          fitView
          onClick={() => setActivePalette(null)}
        >
          <Controls
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <MiniMap
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
            style={{ background: bgFill }}
            maskColor={isDark ? "rgba(3,7,18,0.6)" : "rgba(249,250,251,0.6)"}
            nodeColor={isDark ? "#374151" : "#e5e7eb"}
          />
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color={bgDotColor} />

          {/* Empty state */}
          {!selectedScenarioID && !loading && (
            <FlowPanel position="top-center" className="pointer-events-none mt-24">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <Icon name="wrench" className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                  Выберите аккаунт и сценарий
                </p>
              </div>
            </FlowPanel>
          )}

          {/* Bottom palette */}
          {!isReadOnly && (
            <FlowPanel position="bottom-center" className="mb-5">
              {hasSelected ? (
                <div className="flex gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                  <button
                    onClick={handleDuplicate}
                    className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Icon name="copy" className="h-4 w-4" />
                    Дублировать
                  </button>
                  <button
                    onClick={handleDeleteNodes}
                    className="flex h-10 items-center gap-2 rounded-xl border border-error-200 px-4 text-sm font-medium text-error-500 hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/10"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                    Удалить
                  </button>
                </div>
              ) : (
                <div className="relative flex items-end justify-center gap-2">
                  {/* Trigger submenu */}
                  {activePalette === "trigger" && (
                    <div className="absolute bottom-full left-0 mb-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1.5 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
                      onClick={(e) => e.stopPropagation()}>
                      <p className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Триггеры</p>
                      <button onClick={() => addNode("triggerNode", "new_message")}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                        <Icon name="bolt" className="h-3.5 w-3.5 text-brand-500" />
                        Входящее сообщение
                      </button>
                      <button onClick={() => addNode("triggerNode", "new_order")}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                        <Icon name="bolt" className="h-3.5 w-3.5 text-brand-500" />
                        Новый заказ
                      </button>
                      <button onClick={() => addNode("triggerNode", "manual_start")}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                        <Icon name="bolt" className="h-3.5 w-3.5 text-brand-500" />
                        Ручной запуск
                      </button>
                      <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                      {["Оценка получена", "Сделка закрыта"].map((item) => (
                        <div key={item} className="flex w-full cursor-not-allowed items-center gap-2.5 px-3 py-2 text-sm text-gray-400">
                          <Icon name="bolt" className="h-3.5 w-3.5 text-gray-300" />
                          {item}
                          <SoonBadge />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Condition submenu */}
                  {activePalette === "condition" && (
                    <div className="absolute bottom-full mb-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1.5 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
                      style={{ left: "calc(25% - 26px)" }}
                      onClick={(e) => e.stopPropagation()}>
                      <p className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Условия</p>
                      <button onClick={() => addNode("conditionNode", "contains_word", { keyword: "" })}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                        <Icon name="check-circle" className="h-3.5 w-3.5 text-warning-500" />
                        Содержит слово
                      </button>
                      <button onClick={() => addNode("conditionNode", "client_type", { client_type: "new" })}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                        <Icon name="check-circle" className="h-3.5 w-3.5 text-warning-500" />
                        Тип клиента
                      </button>
                      <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                      {["Количество заказов", "Время суток"].map((item) => (
                        <div key={item} className="flex w-full cursor-not-allowed items-center gap-2.5 px-3 py-2 text-sm text-gray-400">
                          <Icon name="check-circle" className="h-3.5 w-3.5 text-gray-300" />
                          {item}
                          <SoonBadge />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action submenu */}
                  {activePalette === "action" && (
                    <div className="absolute bottom-full mb-2 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1.5 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
                      style={{ left: "calc(50% - 26px)" }}
                      onClick={(e) => e.stopPropagation()}>
                      <p className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Действия</p>
                      <button onClick={() => addNode("actionNode", "send_message", { text: "" })}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                        <Icon name="arrow-right" className="h-3.5 w-3.5 text-success-600" />
                        Отправить сообщение
                      </button>
                      <button onClick={() => addNode("actionNode", "deliver_item")}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                        <Icon name="arrow-right" className="h-3.5 w-3.5 text-success-600" />
                        Выдать товар
                      </button>
                      <button onClick={() => addNode("actionNode", "notify_tg")}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                        <Icon name="arrow-right" className="h-3.5 w-3.5 text-success-600" />
                        Уведомление в Telegram
                      </button>
                      <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                      {["Отправить файл", "Добавить задержку", "Пометить чат"].map((item) => (
                        <div key={item} className="flex w-full cursor-not-allowed items-center gap-2.5 px-3 py-2 text-sm text-gray-400">
                          <Icon name="arrow-right" className="h-3.5 w-3.5 text-gray-300" />
                          {item}
                          <SoonBadge />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI submenu */}
                  {activePalette === "ai" && (
                    <div className="absolute bottom-full right-0 mb-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1.5 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
                      onClick={(e) => e.stopPropagation()}>
                      <p className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">AI Узлы</p>
                      <button onClick={() => addNode("aiNode", "ai_reply")}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-violet-50 dark:text-gray-300 dark:hover:bg-violet-500/10">
                        <Icon name="shooting-star" className="h-3.5 w-3.5 text-violet-500" />
                        AI-Ответ клиенту
                      </button>
                      <button onClick={() => addNode("aiNode", "ai_summary")}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-violet-50 dark:text-gray-300 dark:hover:bg-violet-500/10">
                        <Icon name="shooting-star" className="h-3.5 w-3.5 text-violet-500" />
                        Суммаризация диалога
                      </button>
                      <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                      {["AI анализ", "AI классификация"].map((item) => (
                        <div key={item} className="flex w-full cursor-not-allowed items-center gap-2.5 px-3 py-2 text-sm text-gray-400">
                          <Icon name="shooting-star" className="h-3.5 w-3.5 text-gray-300" />
                          {item}
                          <SoonBadge />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Palette buttons */}
                  {(
                    [
                      { id: "trigger", icon: "bolt", label: "Триггеры", activeColor: "bg-brand-500/10 text-brand-500" },
                      { id: "condition", icon: "check-circle", label: "Условия", activeColor: "bg-warning-500/10 text-warning-600" },
                      { id: "action", icon: "arrow-right", label: "Действия", activeColor: "bg-success-500/10 text-success-600" },
                      { id: "ai", icon: "shooting-star", label: "AI Узлы", activeColor: "bg-violet-500/10 text-violet-600" },
                    ] as const
                  ).map((btn) => {
                    const aiLocked = btn.id === "ai" && !planLimits.ai_nodes;
                    return (
                    <button
                      key={btn.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (aiLocked) { toast.error("AI-узлы доступны начиная с тарифа Pro."); return; }
                        setActivePalette((p) => (p === btn.id ? null : btn.id));
                      }}
                      title={aiLocked ? "Доступно начиная с тарифа Pro" : undefined}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors whitespace-nowrap ${
                        aiLocked
                          ? "cursor-not-allowed border-gray-100 bg-white text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600"
                          : activePalette === btn.id
                          ? `border-transparent ${btn.activeColor}`
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                      }`}
                    >
                      <Icon name={btn.icon} className="h-4 w-4" />
                      {btn.label}
                      {aiLocked && <span className="ml-0.5 text-[9px] font-bold uppercase text-gray-300 dark:text-gray-600">Pro+</span>}
                      <Icon
                        name="chevron-up"
                        className={`h-3.5 w-3.5 transition-transform ${activePalette === btn.id ? "rotate-180" : "text-gray-400"}`}
                      />
                    </button>
                  );})}
                </div>
              )}
            </FlowPanel>
          )}
        </ReactFlow>

        {/* Logs drawer */}
        {isLogsOpen && (
          <div className="absolute right-0 top-0 z-50 flex h-full w-[380px] flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">
                <Icon name="time" className="h-4 w-4 text-gray-400" />
                История запусков
              </h3>
              <button
                onClick={() => setIsLogsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <Icon name="time" className="h-6 w-6 animate-spin text-brand-500" />
                </div>
              ) : logs.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Запусков пока не было</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        log.status === "success"
                          ? "bg-success-500/10 text-success-600"
                          : "bg-error-500/10 text-error-500"
                      }`}>
                        {log.status === "success" ? "УСПЕШНО" : "ОШИБКА"}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Icon name="time" className="h-3 w-3" />
                        {new Date(log.started_at).toLocaleString("ru-RU")}
                      </span>
                    </div>
                    {log.error_message && (
                      <p className="mt-1 rounded-lg bg-error-500/10 p-2 text-[12px] text-error-500">
                        {log.error_message}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => !creating && setCreateOpen(false)} className="max-w-md p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">Новый сценарий</h2>
        <label className="mb-1 block text-xs font-medium text-gray-500">Название</label>
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !creating && newName.trim()) void handleCreate(); }}
          placeholder="Например: Автоответ на новые сообщения"
          maxLength={80}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <div className="mt-5 flex gap-2">
          <button onClick={() => setCreateOpen(false)} disabled={creating}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400">
            Отмена
          </button>
          <button onClick={() => void handleCreate()} disabled={creating || !newName.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {creating ? <Icon name="time" className="h-4 w-4 animate-spin" /> : <Icon name="plus" className="h-4 w-4" />}
            Создать
          </button>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} className="max-w-md p-6">
        <h2 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">Удалить сценарий?</h2>
        <p className="mb-4 text-sm text-gray-500">Это действие необратимо. Сценарий будет удалён навсегда.</p>
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {scenarios.find((s) => s.id === selectedScenarioID)?.name ?? "Выбранный сценарий"}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDeleteOpen(false)} disabled={deleting}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400">
            Отмена
          </button>
          <button onClick={() => void handleDelete()} disabled={deleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-error-200 py-2.5 text-sm font-semibold text-error-500 hover:bg-error-50 disabled:opacity-50 dark:border-error-500/30 dark:hover:bg-error-500/10">
            {deleting ? <Icon name="time" className="h-4 w-4 animate-spin" /> : <Icon name="trash" className="h-4 w-4" />}
            Удалить навсегда
          </button>
        </div>
      </Modal>
    </div>
    </ConstructorContext.Provider>
  );
}

export default function ConstructorPage() {
  return (
    <ReactFlowProvider>
      <ConstructorFlow />
    </ReactFlowProvider>
  );
}
