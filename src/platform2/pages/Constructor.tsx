"use client";
import React, { useCallback, useEffect, useState } from "react";
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
import { accountsApi, scenariosApi, ApiAccount, ApiScenario, ApiScenarioLog } from "@/lib/api";
import Icon from "@/platform2/icons";

// ── Node types ────────────────────────────────────────────────────────────────

type NodeData = {
  subtype?: string;
  keyword?: string;
  client_type?: string;
  text?: string;
  prompt?: string;
  [key: string]: unknown;
};

type ConstructorNode = Node<NodeData>;

type FlowData = {
  nodes?: ConstructorNode[];
  edges?: Edge[];
};

function parseFlow(raw: string): FlowData {
  try {
    const parsed = JSON.parse(raw) as FlowData;
    return {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
    };
  } catch {
    return { nodes: [], edges: [] };
  }
}

const headerCls = "px-3 py-2 flex items-center gap-2 border-b";
const labelCls = "text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1";
const nodeCls = "rounded-xl border min-w-[200px] shadow-sm overflow-hidden";
const nodeInputCls = "w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-brand-400";

function TriggerNode({ data }: NodeProps<ConstructorNode>) {
  const label = data.subtype === "new_order"
    ? "Новый заказ"
    : data.subtype === "manual_start"
    ? "Ручной запуск"
    : "Новое сообщение";
  return (
    <div className={`${nodeCls} border-brand-400 bg-white dark:bg-gray-900`}>
      <div className={`${headerCls} bg-brand-500/10 border-brand-100`}>
        <Icon name="bolt" className="h-3.5 w-3.5 text-brand-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Триггер</span>
      </div>
      <div className="p-3">
        <span className={labelCls}>Событие</span>
        <p className="text-xs font-medium text-gray-800 dark:text-white">{label}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-brand-500 !border-0" />
    </div>
  );
}

function ConditionNode({ id, data }: NodeProps<ConstructorNode>) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`${nodeCls} border-warning-400 bg-white dark:bg-gray-900`}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-warning-400 !border-0" />
      <div className={`${headerCls} bg-warning-500/10 border-warning-100`}>
        <Icon name="check-circle" className="h-3.5 w-3.5 text-warning-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-warning-600">Условие</span>
      </div>
      <div className="p-3">
        {data.subtype === "contains_word" && (
          <>
            <span className={labelCls}>Содержит слово</span>
            <input
              className={nodeInputCls}
              value={String(data.keyword ?? "")}
              onChange={(e) => updateNodeData(id, { keyword: e.target.value })}
              placeholder="Например: скидка"
            />
          </>
        )}
        {data.subtype === "client_type" && (
          <>
            <span className={labelCls}>Тип клиента</span>
            <select
              className={nodeInputCls}
              value={String(data.client_type ?? "new")}
              onChange={(e) => updateNodeData(id, { client_type: e.target.value })}
            >
              <option value="new">Новый клиент</option>
              <option value="returning">Повторный клиент</option>
            </select>
          </>
        )}
        <div className="mt-3 flex justify-between text-[10px] font-bold uppercase">
          <span className="text-error-500">Нет</span>
          <span className="text-success-500">Да</span>
        </div>
      </div>
      <div className="flex">
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="!h-3 !w-3 !bg-error-500 !border-0"
          style={{ left: "25%" }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="!h-3 !w-3 !bg-success-500 !border-0"
          style={{ left: "75%" }}
        />
      </div>
    </div>
  );
}

function ActionNode({ id, data }: NodeProps<ConstructorNode>) {
  const { updateNodeData } = useReactFlow();
  const label = data.subtype === "deliver_item"
    ? "Выдать товар"
    : data.subtype === "notify_tg"
    ? "Уведомить в Telegram"
    : "Отправить сообщение";
  return (
    <div className={`${nodeCls} border-success-400 bg-white dark:bg-gray-900`}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-success-400 !border-0" />
      <div className={`${headerCls} bg-success-500/10 border-success-100`}>
        <Icon name="arrow-right" className="h-3.5 w-3.5 text-success-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-success-600">{label}</span>
      </div>
      {data.subtype === "send_message" && (
        <div className="p-3">
          <span className={labelCls}>Текст сообщения</span>
          <textarea
            className={`${nodeInputCls} resize-none`}
            rows={3}
            value={String(data.text ?? "")}
            onChange={(e) => updateNodeData(id, { text: e.target.value })}
            placeholder="Введите текст..."
          />
        </div>
      )}
      {(data.subtype === "deliver_item" || data.subtype === "notify_tg") && (
        <div className="p-3">
          <p className="text-xs text-gray-400">Действие: {label}</p>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-success-400 !border-0" />
    </div>
  );
}

function AiNode({ id, data }: NodeProps<ConstructorNode>) {
  const { updateNodeData } = useReactFlow();
  const label = data.subtype === "ai_summary" ? "AI Резюме" : "AI Ответ";
  return (
    <div className={`${nodeCls} border-purple-400 bg-white dark:bg-gray-900`}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-purple-400 !border-0" />
      <div className={`${headerCls} border-purple-100 bg-purple-50`}>
        <Icon name="cpu" className="h-3.5 w-3.5 text-purple-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">{label}</span>
      </div>
      <div className="p-3">
        <span className={labelCls}>Промпт</span>
        <textarea
          className={`${nodeInputCls} resize-none`}
          rows={2}
          value={String(data.prompt ?? "")}
          onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
          placeholder="Инструкция для AI..."
        />
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-purple-400 !border-0" />
    </div>
  );
}

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  ai: AiNode,
} as const;

// ── Palette config ────────────────────────────────────────────────────────────

const PALETTE = [
  {
    id: "triggers",
    label: "Триггеры",
    icon: "bolt" as const,
    iconCls: "text-brand-500",
    items: [
      { label: "Новое сообщение", type: "trigger", data: { subtype: "new_message" } },
      { label: "Новый заказ", type: "trigger", data: { subtype: "new_order" } },
      { label: "Ручной запуск", type: "trigger", data: { subtype: "manual_start" } },
    ],
  },
  {
    id: "conditions",
    label: "Условия",
    icon: "check-circle" as const,
    iconCls: "text-warning-500",
    items: [
      { label: "Содержит слово", type: "condition", data: { subtype: "contains_word" } },
      { label: "Тип клиента", type: "condition", data: { subtype: "client_type" } },
    ],
  },
  {
    id: "actions",
    label: "Действия",
    icon: "arrow-right" as const,
    iconCls: "text-success-500",
    items: [
      { label: "Отправить сообщение", type: "action", data: { subtype: "send_message" } },
      { label: "Выдать товар", type: "action", data: { subtype: "deliver_item" } },
      { label: "Уведомить в Telegram", type: "action", data: { subtype: "notify_tg" } },
    ],
  },
  {
    id: "ai",
    label: "AI Узлы",
    icon: "cpu" as const,
    iconCls: "text-purple-500",
    items: [
      { label: "AI Ответ", type: "ai", data: { subtype: "ai_reply" } },
      { label: "AI Резюме", type: "ai", data: { subtype: "ai_summary" } },
    ],
  },
];

// ── Flow inner ────────────────────────────────────────────────────────────────

function FlowInner({
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  scenarios,
  setScenarios,
  selectedScenarioId,
  setSelectedScenarioId,
}: {
  accounts: ApiAccount[];
  selectedAccountId: number | null;
  setSelectedAccountId: (id: number) => void;
  scenarios: ApiScenario[];
  setScenarios: React.Dispatch<React.SetStateAction<ApiScenario[]>>;
  selectedScenarioId: string;
  setSelectedScenarioId: (id: string) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [logs, setLogs] = useState<ApiScenarioLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>("triggers");
  const { addNodes, screenToFlowPosition } = useReactFlow();

  // Load scenario flow data
  useEffect(() => {
    if (!selectedScenarioId) { setNodes([]); setEdges([]); return; }
    const scenario = scenarios.find((s) => s.id === selectedScenarioId);
    if (!scenario) return;
    const { nodes: n = [], edges: e = [] } = parseFlow(scenario.flow_data ?? "{}");
    setNodes(n);
    setEdges(e);
  }, [selectedScenarioId, scenarios]); // eslint-disable-line react-hooks/exhaustive-deps

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  async function handleSave() {
    if (!selectedScenarioId) return;
    const scenario = scenarios.find((s) => s.id === selectedScenarioId);
    if (!scenario) return;
    setSaving(true);
    try {
      await scenariosApi.update(selectedScenarioId, {
        name: scenario.name,
        flow_data: JSON.stringify({ nodes, edges }),
        is_active: scenario.is_active,
      });
      setScenarios((prev) => prev.map((s) =>
        s.id === selectedScenarioId
          ? { ...s, flow_data: JSON.stringify({ nodes, edges }) }
          : s
      ));
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!selectedAccountId || !newScenarioName.trim()) return;
    setCreating(true);
    try {
      const res = await scenariosApi.create(selectedAccountId, {
        name: newScenarioName.trim(),
        trigger_type: "new_message",
        flow_data: '{"nodes":[],"edges":[]}',
        is_active: false,
      });
      const newScenario = await scenariosApi.get(res.id);
      setScenarios((prev) => [...prev, newScenario]);
      setSelectedScenarioId(newScenario.id);
      setShowCreate(false);
      setNewScenarioName("");
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function loadLogs() {
    if (!selectedScenarioId) return;
    try {
      const data = await scenariosApi.getLogs(selectedScenarioId);
      setLogs(Array.isArray(data) ? data : []);
      setShowLogs(true);
    } catch {
      setLogs([]);
    }
  }

  function handleDragItem(
    e: React.DragEvent,
    type: string,
    data: Record<string, unknown>
  ) {
    e.dataTransfer.setData("nodeType", type);
    e.dataTransfer.setData("nodeData", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData("nodeType");
    const rawData = e.dataTransfer.getData("nodeData");
    if (!type) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newNode: ConstructorNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: rawData ? (JSON.parse(rawData) as NodeData) : {},
    };
    addNodes(newNode);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div
      className="-mx-4 -my-4 relative flex flex-col overflow-hidden md:-mx-6 md:-my-6"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* Top bar */}
      <div className="z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        {/* Account */}
        <select
          value={selectedAccountId ?? ""}
          onChange={(e) => setSelectedAccountId(Number(e.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
        </select>

        {/* Scenario */}
        <select
          value={selectedScenarioId}
          onChange={(e) => setSelectedScenarioId(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="">— Выберите сценарий —</option>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* New scenario */}
        {showCreate ? (
          <div className="flex items-center gap-2">
            <input
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              placeholder="Название"
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400"
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newScenarioName.trim()}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {creating ? "..." : "Создать"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            Новый
          </button>
        )}

        {/* Logs */}
        <button
          onClick={loadLogs}
          disabled={!selectedScenarioId}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
        >
          <Icon name="list" className="h-3.5 w-3.5" />
          Логи
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !selectedScenarioId}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Icon name="check-line" className="h-3.5 w-3.5" />
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      {/* Active badge */}
      {selectedScenario && (
        <div className="z-10 flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-1.5 dark:border-gray-800 dark:bg-gray-900">
          <span className={`inline-flex h-2 w-2 rounded-full ${selectedScenario.is_active ? "bg-success-500" : "bg-gray-300"}`} />
          <span className="text-xs text-gray-500">
            {selectedScenario.name}
            {selectedScenario.is_active ? " — активен" : " — неактивен"}
          </span>
        </div>
      )}

      {/* Main area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1" onDrop={handleDrop} onDragOver={handleDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={{ animated: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls />
            <MiniMap />

            {!selectedScenarioId && (
              <FlowPanel position="top-center">
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Выберите сценарий или создайте новый
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Перетащите узлы из палитры справа на холст
                  </p>
                </div>
              </FlowPanel>
            )}
          </ReactFlow>
        </div>

        {/* Palette */}
        <div className="flex w-56 shrink-0 flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Палитра</p>
          <div className="flex-1 overflow-y-auto">
            {PALETTE.map((group) => (
              <div key={group.id}>
                <button
                  onClick={() => setOpenGroup((prev) => prev === group.id ? null : group.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <Icon name={group.icon} className={`h-3.5 w-3.5 ${group.iconCls}`} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{group.label}</span>
                  </div>
                  <Icon
                    name={openGroup === group.id ? "chevron-up" : "chevron-down"}
                    className="h-3 w-3 text-gray-400"
                  />
                </button>
                {openGroup === group.id && (
                  <div className="border-t border-gray-100 py-1 dark:border-gray-800">
                    {group.items.map((item) => (
                      <div
                        key={item.label}
                        draggable
                        onDragStart={(e) => handleDragItem(e, item.type, item.data)}
                        className="flex cursor-grab items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 active:cursor-grabbing dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        <span className="text-gray-300">⠿</span>
                        {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Logs drawer */}
        {showLogs && (
          <div className="absolute right-56 top-0 z-20 flex h-full w-80 flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Логи выполнения</p>
              <button onClick={() => setShowLogs(false)} className="text-gray-400 hover:text-gray-600">
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <p className="text-sm text-gray-400">Логов нет</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border-b border-gray-50 px-4 py-3 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.status === "success"
                          ? "bg-success-500/10 text-success-600"
                          : log.status === "error"
                          ? "bg-error-500/10 text-error-500"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {log.status}
                      </span>
                      <p className="text-[10px] text-gray-400">
                        {new Date(log.started_at).toLocaleString("ru-RU")}
                      </p>
                    </div>
                    {log.error_message && (
                      <p className="mt-1 text-xs text-error-500">{log.error_message}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page (with ReactFlowProvider) ─────────────────────────────────────────────

export default function ConstructorPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");

  useEffect(() => {
    accountsApi.list().then((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      setAccounts(list);
      if (list.length > 0) setSelectedAccountId(list[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedAccountId === null) return;
    setScenarios([]);
    setSelectedScenarioId("");
    scenariosApi.list(selectedAccountId)
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        setScenarios(list);
        if (list.length > 0) setSelectedScenarioId(list[0].id);
      })
      .catch(() => {});
  }, [selectedAccountId]);

  return (
    <ReactFlowProvider>
      <FlowInner
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        scenarios={scenarios}
        setScenarios={setScenarios}
        selectedScenarioId={selectedScenarioId}
        setSelectedScenarioId={setSelectedScenarioId}
      />
    </ReactFlowProvider>
  );
}
