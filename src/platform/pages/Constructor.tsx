'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { accountsApi, scenariosApi, ApiAccount, ApiScenario } from '@/lib/api';
import { Loader2, Save, Plus, GitMerge, Workflow, Zap, Play, Copy, Trash2, Bot, ChevronUp, Check, Settings } from 'lucide-react';
import { toast } from 'sonner';

// --- NODE COMPONENT DEFINITIONS ---

const TriggerNode = ({ id, data }: any) => {
  const { updateNodeData } = useReactFlow();
  const label = data.subtype === 'new_order' ? 'Новый заказ' : data.subtype === 'manual_start' ? 'Ручной запуск' : 'Новое сообщение';
  
  return (
    <div className="bg-[var(--pf-surface)] border border-[var(--pf-accent)] rounded-xl min-w-[220px] shadow-sm overflow-hidden group">
      <div className="bg-[color-mix(in_srgb,var(--pf-accent)_10%,transparent)] px-3 py-2 flex items-center gap-2 border-b border-[var(--pf-border)]">
        <Zap size={14} className="text-[var(--pf-accent)]" />
        <span className="text-[12px] font-bold text-[var(--pf-text)] uppercase tracking-wider">Триггер</span>
      </div>
      <div className="p-3 bg-[var(--pf-surface)]">
        <label className="text-[10px] uppercase font-bold text-[var(--pf-text-dim)] block mb-1">Событие</label>
        <div className="text-[12px] font-medium text-[var(--pf-text)]">{label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[var(--pf-accent)] border-none" />
    </div>
  );
};

const ConditionNode = ({ id, data }: any) => {
  const { updateNodeData } = useReactFlow();
  
  return (
    <div className="bg-[var(--pf-surface)] border border-[var(--pf-warning)] rounded-xl min-w-[220px] shadow-sm overflow-hidden">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[var(--pf-warning)] border-none" />
      <div className="bg-[color-mix(in_srgb,var(--pf-warning)_10%,transparent)] px-3 py-2 flex items-center gap-2 border-b border-[var(--pf-border)]">
        <GitMerge size={14} className="text-[var(--pf-warning)]" />
        <span className="text-[12px] font-bold text-[var(--pf-text)] uppercase tracking-wider">Условие</span>
      </div>
      <div className="p-3">
        {data.subtype === 'contains_word' && (
          <>
            <label className="text-[10px] uppercase font-bold text-[var(--pf-text-dim)] block mb-1">Содержит слово</label>
            <input 
              className="platform-input text-[12px] py-1 h-8 bg-[var(--pf-surface-2)] w-full"
              value={data.keyword || ''}
              onChange={(e) => updateNodeData(id, { keyword: e.target.value })}
              placeholder="Например: скидка"
            />
          </>
        )}
        {data.subtype === 'client_type' && (
          <>
            <label className="text-[10px] uppercase font-bold text-[var(--pf-text-dim)] block mb-1">Тип клиента</label>
            <select 
              className="platform-select text-[12px] py-1 h-8 bg-[var(--pf-surface-2)] w-full"
              value={data.client_type || 'new'}
              onChange={(e) => updateNodeData(id, { client_type: e.target.value })}
            >
              <option value="new">Новый клиент</option>
              <option value="returning">Повторный клиент</option>
            </select>
          </>
        )}
        <div className="flex justify-between mt-3 text-[10px] font-bold text-[var(--pf-text-dim)] uppercase">
          <span className="text-[var(--pf-danger)]">Нет</span>
          <span className="text-[var(--pf-success)]">Да</span>
        </div>
      </div>
      <Handle type="source" id="false" position={Position.Bottom} style={{ left: '25%' }} className="w-3 h-3 bg-[var(--pf-danger)] border-none" />
      <Handle type="source" id="true" position={Position.Bottom} style={{ left: '75%' }} className="w-3 h-3 bg-[var(--pf-success)] border-none" />
    </div>
  );
};

const ActionNode = ({ id, data }: any) => {
  const { updateNodeData } = useReactFlow();
  
  return (
    <div className="bg-[var(--pf-surface)] border border-[var(--pf-success)] rounded-xl min-w-[220px] shadow-sm overflow-hidden">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[var(--pf-success)] border-none" />
      <div className="bg-[color-mix(in_srgb,var(--pf-success)_10%,transparent)] px-3 py-2 flex items-center gap-2 border-b border-[var(--pf-border)]">
        <Play size={14} className="text-[var(--pf-success)]" />
        <span className="text-[12px] font-bold text-[var(--pf-text)] uppercase tracking-wider">Действие</span>
      </div>
      <div className="p-3">
        {data.subtype === 'send_message' && (
          <>
            <label className="text-[10px] uppercase font-bold text-[var(--pf-text-dim)] block mb-1">Отправить сообщение</label>
            <textarea 
              className="platform-textarea text-[12px] py-1 bg-[var(--pf-surface-2)] w-full resize-none min-h-[60px]"
              value={data.text || ''}
              onChange={(e) => updateNodeData(id, { text: e.target.value })}
              placeholder="Введите текст..."
            />
          </>
        )}
        {data.subtype === 'deliver_item' && (
          <div className="text-[12px] font-medium text-[var(--pf-text)]">Выдать оплаченный товар</div>
        )}
        {data.subtype === 'notify_tg' && (
          <div className="text-[12px] font-medium text-[var(--pf-text)]">Уведомление в Telegram</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[var(--pf-success)] border-none" />
    </div>
  );
};

const AiNode = ({ id, data }: any) => {
  const { updateNodeData } = useReactFlow();
  
  return (
    <div className="bg-[var(--pf-surface)] border border-[#a855f7] rounded-xl min-w-[220px] shadow-md shadow-purple-500/10 overflow-hidden">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[#a855f7] border-none" />
      <div className="bg-[color-mix(in_srgb,#a855f7_15%,transparent)] px-3 py-2 flex items-center gap-2 border-b border-[var(--pf-border)]">
        <Bot size={14} className="text-[#a855f7]" />
        <span className="text-[12px] font-bold text-[var(--pf-text)] uppercase tracking-wider">AI Узел</span>
      </div>
      <div className="p-3">
        {data.subtype === 'ai_reply' && (
          <>
             <label className="text-[10px] uppercase font-bold text-[var(--pf-text-dim)] block mb-1">Инструкция (Промпт)</label>
             <textarea 
                className="platform-textarea text-[12px] py-1 bg-[var(--pf-surface-2)] w-full resize-none min-h-[60px]"
                value={data.prompt || ''}
                onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
                placeholder="Инструкция для ответа..."
              />
          </>
        )}
        {data.subtype === 'ai_summary' && (
          <div className="text-[12px] font-medium text-[var(--pf-text)]">Суммаризация диалога</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[#a855f7] border-none" />
    </div>
  );
};

const nodeTypes = {
  triggerNode: TriggerNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode,
  aiNode: AiNode,
};

// --- MAIN COMPONENT ---

function ConstructorFlow() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);
  const [selectedScenarioID, setSelectedScenarioID] = useState<string | null>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Palette State
  const [activePalette, setActivePalette] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    accountsApi.list().then(accs => {
      setAccounts(accs);
      if (accs.length > 0) {
        setSelectedAccountID(accs[0].id);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      toast.error('Ошибка загрузки аккаунтов');
      setLoading(false);
    });
  }, []);

  // Fetch scenarios when account changes
  useEffect(() => {
    if (selectedAccountID) {
      setLoading(true);
      scenariosApi.list(selectedAccountID).then(scens => {
        setScenarios(scens);
        if (scens && scens.length > 0) {
          setSelectedScenarioID(scens[0].id);
        } else {
          setSelectedScenarioID(null);
          setNodes([]);
          setEdges([]);
        }
      }).catch(err => {
        console.error(err);
        toast.error('Ошибка загрузки сценариев');
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [selectedAccountID, setNodes, setEdges]);

  // Load flow data when scenario changes
  useEffect(() => {
    if (selectedScenarioID && scenarios.length > 0) {
      const scenario = scenarios.find(s => s.id === selectedScenarioID);
      if (scenario && scenario.flow_data) {
        try {
          const parsed = JSON.parse(scenario.flow_data);
          setNodes(parsed.nodes || []);
          setEdges(parsed.edges || []);
        } catch (err) {
          console.error(err);
          toast.error('Не удалось пропарсить данные графа');
        }
      } else {
        setNodes([]);
        setEdges([]);
      }
    } else if (!selectedScenarioID) {
      setNodes([]);
      setEdges([]);
    }
  }, [selectedScenarioID, scenarios, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params }, eds)),
    [setEdges],
  );

  const isValidConnection = useCallback((connection: Connection) => {
    if (connection.source === connection.target) return false;
    const sourceNode = nodes.find(n => n.id === connection.source);
    if (sourceNode?.type !== 'conditionNode') {
      const existingConnection = edges.find(e => e.source === connection.source && e.sourceHandle === connection.sourceHandle);
      if (existingConnection) return false;
    } else {
      const existingConnection = edges.find(e => e.source === connection.source && e.sourceHandle === connection.sourceHandle);
      if (existingConnection) return false;
    }
    
    const hasCycle = (target: string, visited: Set<string> = new Set()): boolean => {
      if (visited.has(target)) return true;
      if (target === connection.source) return true;
      visited.add(target);
      const outgoingEdges = edges.filter(e => e.source === target);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target, new Set(visited))) return true;
      }
      return false;
    };
    
    return !hasCycle(connection.target);
  }, [nodes, edges]);

  const handleSave = async () => {
    if (!selectedScenarioID) return;
    setSaving(true);
    const flowData = JSON.stringify({ nodes, edges });
    const scenario = scenarios.find(s => s.id === selectedScenarioID);
    if (!scenario) return;
    
    try {
      await scenariosApi.update(selectedScenarioID, {
        name: scenario.name,
        is_active: scenario.is_active,
        flow_data: flowData
      });
      toast.success('Сценарий успешно сохранён');
    } catch (err) {
      toast.error('Ошибка сохранения сценария');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateScenario = async () => {
    if (!selectedAccountID) return;
    const name = prompt('Введите название нового сценария:');
    if (!name) return;
    setLoading(true);
    try {
      const res = await scenariosApi.create(selectedAccountID, {
        name,
        trigger_type: 'chat_message',
        flow_data: '{}',
        is_active: true,
      });
      const newScenario: ApiScenario = {
        id: res.id,
        user_id: 0,
        funpay_account_id: selectedAccountID,
        name,
        trigger_type: 'chat_message',
        flow_data: '{}',
        is_active: true,
        created_at: '',
        updated_at: ''
      };
      setScenarios(prev => [...prev, newScenario]);
      setSelectedScenarioID(res.id);
      toast.success('Сценарий создан');
    } catch (err) {
      toast.error('Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  // Node Actions
  const handleDuplicateSelected = () => {
    const selected = nodes.filter(n => n.selected);
    if (selected.length === 0) return;
    const newNodes = selected.map(n => ({
      ...n,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      position: { x: n.position.x + 40, y: n.position.y + 40 },
      selected: false,
    }));
    setNodes(nds => [...nds, ...newNodes]);
  };

  const handleDeleteSelected = () => {
    const selectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
    if (selectedIds.size === 0) return;
    setNodes(nds => nds.filter(n => !selectedIds.has(n.id)));
    setEdges(eds => eds.filter(e => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
  };

  // Add Specific Node
  const handleAddNode = (type: string, subtype: string, initialData: any = {}) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { subtype, ...initialData },
    };
    setNodes(nds => [...nds, newNode]);
    setActivePalette(null);
  };

  const hasSelectedNodes = nodes.some(n => n.selected);
  const defaultEdgeOptions = { animated: true, style: { stroke: 'var(--pf-accent)', strokeWidth: 2 } };

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden bg-[var(--pf-surface-2)]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--pf-surface)]/50 backdrop-blur-sm z-50">
           <Loader2 size={32} className="animate-spin text-[var(--pf-accent)]" />
        </div>
      )}

      {/* REACT FLOW CANVAS */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Controls className="bg-[var(--pf-surface)] border border-[var(--pf-border)] shadow-lg rounded-lg overflow-hidden fill-[var(--pf-text)] text-[var(--pf-text)]" />
        <MiniMap 
          className="bg-[var(--pf-surface)] border border-[var(--pf-border)] rounded-lg overflow-hidden shadow-lg" 
          maskColor="color-mix(in srgb, var(--pf-surface) 80%, transparent)" 
          nodeColor="var(--pf-border-strong)"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="var(--pf-border-strong)" />

        {/* TOP LEFT: Selectors */}
        <FlowPanel position="top-left" className="m-4">
          <div className="flex bg-[var(--pf-surface)] border border-[var(--pf-border)] p-1.5 rounded-xl shadow-lg animate-in fade-in zoom-in-95">
            <select 
              className="platform-select text-[12px] h-9 border-none bg-transparent min-w-[150px] max-w-[200px]"
              value={selectedAccountID || ''}
              onChange={e => setSelectedAccountID(Number(e.target.value))}
            >
              <option value="" disabled>Выберите аккаунт</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.username || `Account #${acc.id}`}</option>
              ))}
            </select>
            <div className="w-[1px] bg-[var(--pf-border)] mx-1" />
            <select 
              className="platform-select text-[12px] h-9 border-none bg-transparent min-w-[150px] max-w-[200px]"
              value={selectedScenarioID || ''}
              onChange={e => setSelectedScenarioID(e.target.value)}
            >
              <option value="">Выберите сценарий</option>
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </FlowPanel>

        {/* TOP RIGHT: Actions */}
        <FlowPanel position="top-right" className="m-4">
          <div className="flex gap-2">
            <button className="platform-btn-secondary h-10 px-4 rounded-xl shadow-lg bg-[var(--pf-surface)] hover:bg-[var(--pf-surface-2)] border-[var(--pf-border)]" onClick={handleCreateScenario}>
              <Plus size={16} className="mr-2" /> Создать
            </button>
            <button 
              className="platform-btn-primary h-10 px-4 rounded-xl shadow-lg" 
              onClick={handleSave} 
              disabled={saving || !selectedScenarioID}
            >
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
              Сохранить
            </button>
          </div>
        </FlowPanel>

        {/* BOTTOM: Node Palette or Toolbar */}
        <FlowPanel position="bottom-center" className="mb-6">
          {hasSelectedNodes ? (
            // TOOLBAR (If nodes selected)
            <div className="flex gap-2 bg-[var(--pf-surface)] p-2 rounded-2xl border border-[var(--pf-border)] shadow-xl animate-in slide-in-from-bottom-4 fade-in">
              <button className="platform-btn-secondary h-10 px-4 text-[13px] rounded-xl hover:bg-[var(--pf-surface-2)]" onClick={handleDuplicateSelected}>
                <Copy size={16} className="mr-2" /> Дублировать
              </button>
              <button className="platform-btn-secondary h-10 px-4 text-[13px] rounded-xl text-[var(--pf-danger)] hover:bg-[color-mix(in_srgb,var(--pf-danger)_10%,transparent)] hover:border-[color-mix(in_srgb,var(--pf-danger)_20%,transparent)]" onClick={handleDeleteSelected}>
                <Trash2 size={16} className="mr-2" /> Удалить
              </button>
            </div>
          ) : (
            // PALETTE (If no nodes selected)
            <div className="relative flex flex-col items-center">
              
              {/* SUBMENUS */}
              {activePalette === 'trigger' && (
                <div className="absolute bottom-full mb-3 bg-[var(--pf-surface)] border border-[var(--pf-border)] shadow-2xl rounded-2xl p-2 min-w-[220px] animate-in slide-in-from-bottom-2 fade-in">
                  <div className="text-[10px] font-bold text-[var(--pf-text-dim)] uppercase px-3 py-1 mb-1">Типы триггеров</div>
                  <button className="w-full text-left px-3 py-2 text-[12px] font-medium text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)] rounded-lg transition-colors" onClick={() => handleAddNode('triggerNode', 'new_message')}>Входящее сообщение</button>
                  <button className="w-full text-left px-3 py-2 text-[12px] font-medium text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)] rounded-lg transition-colors" onClick={() => handleAddNode('triggerNode', 'new_order')}>Новый заказ</button>
                  <button className="w-full text-left px-3 py-2 text-[12px] font-medium text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)] rounded-lg transition-colors" onClick={() => handleAddNode('triggerNode', 'manual_start')}>Ручной запуск</button>
                </div>
              )}

              {activePalette === 'condition' && (
                <div className="absolute bottom-full mb-3 bg-[var(--pf-surface)] border border-[var(--pf-border)] shadow-2xl rounded-2xl p-2 min-w-[220px] animate-in slide-in-from-bottom-2 fade-in">
                  <div className="text-[10px] font-bold text-[var(--pf-text-dim)] uppercase px-3 py-1 mb-1">Условия</div>
                  <button className="w-full text-left px-3 py-2 text-[12px] font-medium text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)] rounded-lg transition-colors" onClick={() => handleAddNode('conditionNode', 'contains_word', { keyword: '' })}>Содержит слово</button>
                  <button className="w-full text-left px-3 py-2 text-[12px] font-medium text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)] rounded-lg transition-colors" onClick={() => handleAddNode('conditionNode', 'client_type', { client_type: 'new' })}>Тип клиента (Новый/Старый)</button>
                </div>
              )}

              {activePalette === 'action' && (
                <div className="absolute bottom-full mb-3 bg-[var(--pf-surface)] border border-[var(--pf-border)] shadow-2xl rounded-2xl p-2 min-w-[220px] animate-in slide-in-from-bottom-2 fade-in">
                  <div className="text-[10px] font-bold text-[var(--pf-text-dim)] uppercase px-3 py-1 mb-1">Действия</div>
                  <button className="w-full text-left px-3 py-2 text-[12px] font-medium text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)] rounded-lg transition-colors" onClick={() => handleAddNode('actionNode', 'send_message', { text: '' })}>Отправить сообщение в чат</button>
                  <button className="w-full text-left px-3 py-2 text-[12px] font-medium text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)] rounded-lg transition-colors" onClick={() => handleAddNode('actionNode', 'deliver_item')}>Выдать товар (Автовыдача)</button>
                  <button className="w-full text-left px-3 py-2 text-[12px] font-medium text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)] rounded-lg transition-colors" onClick={() => handleAddNode('actionNode', 'notify_tg')}>Уведомление в Telegram</button>
                </div>
              )}

              {activePalette === 'ai' && (
                <div className="absolute bottom-full mb-3 bg-[var(--pf-surface)] border border-[var(--pf-border)] shadow-2xl rounded-2xl p-2 min-w-[220px] animate-in slide-in-from-bottom-2 fade-in">
                  <div className="text-[10px] font-bold text-[var(--pf-text-dim)] uppercase px-3 py-1 mb-1">AI Функции (Premium)</div>
                  <button className="w-full flex items-center px-3 py-2 text-[12px] font-medium text-[var(--pf-text)] hover:bg-[color-mix(in_srgb,#a855f7_10%,transparent)] rounded-lg transition-colors" onClick={() => handleAddNode('aiNode', 'ai_reply')}>
                    <Bot size={14} className="mr-2 text-[#a855f7]" /> AI-Ответ клиенту
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-[12px] font-medium text-[var(--pf-text)] hover:bg-[color-mix(in_srgb,#a855f7_10%,transparent)] rounded-lg transition-colors" onClick={() => handleAddNode('aiNode', 'ai_summary')}>
                    <Bot size={14} className="mr-2 text-[#a855f7]" /> Суммаризация диалога
                  </button>
                </div>
              )}

              {/* MAIN HORIZONTAL BAR */}
              <div className="flex bg-[var(--pf-surface)] p-1.5 rounded-2xl border border-[var(--pf-border)] shadow-xl animate-in slide-in-from-bottom-8">
                <button 
                  className={`flex items-center h-10 px-4 rounded-xl text-[13px] font-medium transition-colors ${activePalette === 'trigger' ? 'bg-[color-mix(in_srgb,var(--pf-accent)_15%,transparent)] text-[var(--pf-accent)]' : 'text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)]'}`}
                  onClick={() => setActivePalette(activePalette === 'trigger' ? null : 'trigger')}
                >
                  <Zap size={16} className="mr-2" /> Триггеры <ChevronUp size={14} className={`ml-1 transition-transform ${activePalette === 'trigger' ? 'rotate-180' : ''}`} />
                </button>
                <div className="w-[1px] bg-[var(--pf-border)] mx-1 my-2" />
                <button 
                  className={`flex items-center h-10 px-4 rounded-xl text-[13px] font-medium transition-colors ${activePalette === 'condition' ? 'bg-[color-mix(in_srgb,var(--pf-warning)_15%,transparent)] text-[var(--pf-warning)]' : 'text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)]'}`}
                  onClick={() => setActivePalette(activePalette === 'condition' ? null : 'condition')}
                >
                  <GitMerge size={16} className="mr-2" /> Условия <ChevronUp size={14} className={`ml-1 transition-transform ${activePalette === 'condition' ? 'rotate-180' : ''}`} />
                </button>
                <div className="w-[1px] bg-[var(--pf-border)] mx-1 my-2" />
                <button 
                  className={`flex items-center h-10 px-4 rounded-xl text-[13px] font-medium transition-colors ${activePalette === 'action' ? 'bg-[color-mix(in_srgb,var(--pf-success)_15%,transparent)] text-[var(--pf-success)]' : 'text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)]'}`}
                  onClick={() => setActivePalette(activePalette === 'action' ? null : 'action')}
                >
                  <Play size={16} className="mr-2" /> Действия <ChevronUp size={14} className={`ml-1 transition-transform ${activePalette === 'action' ? 'rotate-180' : ''}`} />
                </button>
                <div className="w-[1px] bg-[var(--pf-border)] mx-1 my-2" />
                <button 
                  className={`flex items-center h-10 px-4 rounded-xl text-[13px] font-medium transition-colors ${activePalette === 'ai' ? 'bg-[color-mix(in_srgb,#a855f7_15%,transparent)] text-[#a855f7]' : 'text-[var(--pf-text)] hover:bg-[var(--pf-surface-2)]'}`}
                  onClick={() => setActivePalette(activePalette === 'ai' ? null : 'ai')}
                >
                  <Bot size={16} className="mr-2" /> AI Узлы <ChevronUp size={14} className={`ml-1 transition-transform ${activePalette === 'ai' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          )}
        </FlowPanel>
        
        {/* Placeholder if empty */}
        {!selectedScenarioID && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
             <Workflow size={64} className="text-[var(--pf-border-strong)] mb-4" />
             <p className="text-[var(--pf-text-muted)] font-medium text-[15px]">Выберите аккаунт и сценарий слева вверху</p>
          </div>
        )}

      </ReactFlow>
    </div>
  );
}

export default function Constructor() {
  return (
    <ReactFlowProvider>
      <ConstructorFlow />
    </ReactFlowProvider>
  );
}
