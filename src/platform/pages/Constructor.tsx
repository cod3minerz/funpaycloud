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
import { PageHeader, PageShell, PageTitle, SectionCard } from '@/platform/components/primitives';
import { accountsApi, scenariosApi, ApiAccount, ApiScenario } from '@/lib/api';
import { Loader2, Save, Plus, GitMerge, Workflow, Zap, Play, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Custom Nodes
const TriggerNode = ({ id, data }: any) => {
  return (
    <div className="bg-[var(--pf-surface)] border border-[var(--pf-accent)] rounded-xl min-w-[200px] shadow-sm overflow-hidden">
      <div className="bg-[var(--pf-surface-2)] px-3 py-2 border-b border-[var(--pf-border)] flex items-center gap-2">
        <Zap size={14} className="text-[var(--pf-accent)]" />
        <span className="text-[12px] font-bold text-[var(--pf-text)] uppercase tracking-wider">Триггер</span>
      </div>
      <div className="p-3">
        <label className="text-[11px] text-[var(--pf-text-muted)] block mb-1">Событие</label>
        <select className="platform-select text-[12px] py-1 h-8 bg-[var(--pf-surface-2)]" disabled>
          <option>Входящее сообщение</option>
        </select>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[var(--pf-accent)] border-none" />
    </div>
  );
};

const ConditionNode = ({ id, data }: any) => {
  const { updateNodeData } = useReactFlow();
  
  return (
    <div className="bg-[var(--pf-surface)] border border-[var(--pf-warning)] rounded-xl min-w-[200px] shadow-sm overflow-hidden">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[var(--pf-warning)] border-none" />
      <div className="bg-[var(--pf-surface-2)] px-3 py-2 border-b border-[var(--pf-border)] flex items-center gap-2">
        <GitMerge size={14} className="text-[var(--pf-warning)]" />
        <span className="text-[12px] font-bold text-[var(--pf-text)] uppercase tracking-wider">Условие</span>
      </div>
      <div className="p-3">
        <label className="text-[11px] text-[var(--pf-text-muted)] block mb-1">Ключевое слово</label>
        <input 
          className="platform-input text-[12px] py-1 h-8 bg-[var(--pf-surface-2)] w-full"
          value={data.keyword || ''}
          onChange={(e) => updateNodeData(id, { keyword: e.target.value })}
          placeholder="Например: скидка"
        />
        <div className="flex justify-between mt-3 text-[11px] font-bold text-[var(--pf-text-dim)]">
          <span>НЕТ (False)</span>
          <span>ДА (True)</span>
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
    <div className="bg-[var(--pf-surface)] border border-[var(--pf-success)] rounded-xl min-w-[200px] shadow-sm overflow-hidden">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[var(--pf-success)] border-none" />
      <div className="bg-[var(--pf-surface-2)] px-3 py-2 border-b border-[var(--pf-border)] flex items-center gap-2">
        <Play size={14} className="text-[var(--pf-success)]" />
        <span className="text-[12px] font-bold text-[var(--pf-text)] uppercase tracking-wider">Действие</span>
      </div>
      <div className="p-3">
        <label className="text-[11px] text-[var(--pf-text-muted)] block mb-1">Отправить сообщение</label>
        <textarea 
          className="platform-textarea text-[12px] py-1 bg-[var(--pf-surface-2)] w-full resize-none"
          rows={3}
          value={data.text || ''}
          onChange={(e) => updateNodeData(id, { text: e.target.value })}
          placeholder="Введите ответ..."
        />
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[var(--pf-success)] border-none" />
    </div>
  );
};

const nodeTypes = {
  triggerNode: TriggerNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode,
};

function ConstructorFlow() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);
  const [selectedScenarioID, setSelectedScenarioID] = useState<string | null>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    accountsApi.list().then(accs => {
      setAccounts(accs);
      if (accs.length > 0) {
        setSelectedAccountID(accs[0].id);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      toast.error('Failed to load accounts');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedAccountID) {
      setLoading(true);
      scenariosApi.list(selectedAccountID).then(scens => {
        setScenarios(scens);
        if (scens.length > 0) {
          setSelectedScenarioID(scens[0].id);
        } else {
          setSelectedScenarioID(null);
          setNodes([]);
          setEdges([]);
        }
      }).catch(err => {
        toast.error('Failed to load scenarios');
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [selectedAccountID, setNodes, setEdges]);

  useEffect(() => {
    if (selectedScenarioID) {
      const scenario = scenarios.find(s => s.id === selectedScenarioID);
      if (scenario && scenario.flow_data) {
        try {
          const parsed = JSON.parse(scenario.flow_data);
          setNodes(parsed.nodes || []);
          setEdges(parsed.edges || []);
        } catch (err) {
          toast.error('Failed to parse flow data');
        }
      } else {
        setNodes([]);
        setEdges([]);
      }
    }
  }, [selectedScenarioID, scenarios, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params }, eds)),
    [setEdges],
  );

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
      toast.success('Сценарий сохранён успешно');
    } catch (err) {
      toast.error('Ошибка сохранения сценария');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNode = (type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: type,
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: {},
    };
    
    if (type === 'conditionNode') {
      newNode.data.condition_type = 'contains';
      newNode.data.keyword = 'купить';
    } else if (type === 'actionNode') {
      newNode.data.action_type = 'send_message';
      newNode.data.text = 'Здравствуйте!';
    }
    
    setNodes(nds => [...nds, newNode]);
  };

  const handleCreateScenario = async () => {
    if (!selectedAccountID) return;
    const name = prompt('Название сценария:');
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

  const handleDuplicateSelected = () => {
    const selected = nodes.filter(n => n.selected);
    if (selected.length === 0) return;
    
    const newNodes = selected.map(n => ({
      ...n,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      position: { x: n.position.x + 30, y: n.position.y + 30 },
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

  const isValidConnection = useCallback((connection: Connection) => {
    // Prevent self-connections
    if (connection.source === connection.target) return false;
    
    // Prevent multiple connections from the same source handle (unless it's a ConditionNode which has true/false handles)
    const sourceNode = nodes.find(n => n.id === connection.source);
    if (sourceNode?.type !== 'conditionNode') {
      const existingConnection = edges.find(e => e.source === connection.source && e.sourceHandle === connection.sourceHandle);
      if (existingConnection) return false;
    } else {
      // Condition nodes have specific source handles 'true' and 'false'
      const existingConnection = edges.find(e => e.source === connection.source && e.sourceHandle === connection.sourceHandle);
      if (existingConnection) return false;
    }
    
    // Check for cycles
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

  const defaultEdgeOptions = {
    animated: true,
    style: { stroke: 'var(--pf-accent)', strokeWidth: 2 },
  };

  return (
    <PageShell>
      <PageHeader>
        <PageTitle title="Визуальный Конструктор" />
        <div className="flex flex-wrap items-center gap-2">
           <select 
            className="platform-select w-[200px]"
            value={selectedAccountID || ''}
            onChange={e => setSelectedAccountID(Number(e.target.value))}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.username}</option>
            ))}
          </select>
          <select 
            className="platform-select w-[200px]"
            value={selectedScenarioID || ''}
            onChange={e => setSelectedScenarioID(e.target.value)}
          >
            <option value="">Выберите сценарий...</option>
            {scenarios.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button className="platform-btn-secondary" onClick={handleCreateScenario}>
            <Plus size={16} /> Создать
          </button>
          <button className="platform-btn-primary" onClick={handleSave} disabled={saving || !selectedScenarioID}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Сохранить
          </button>
        </div>
      </PageHeader>
      
      <SectionCard className="h-[75vh] p-0 flex flex-col relative overflow-hidden rounded-2xl border-[var(--pf-border)]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--pf-surface)]/50 backdrop-blur-sm z-10">
             <Loader2 size={32} className="animate-spin text-[var(--pf-accent)]" />
          </div>
        ) : null}
        
        {!selectedScenarioID && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--pf-surface-2)] z-10">
             <Workflow size={48} className="text-[var(--pf-text-dim)] mb-4" />
             <p className="text-[var(--pf-text-muted)] font-medium">Создайте или выберите сценарий для редактирования</p>
          </div>
        )}
        
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
          className="bg-[var(--pf-surface-2)]"
        >
          <FlowPanel position="top-left" className="flex flex-col gap-2 bg-[var(--pf-surface)] p-2 rounded-xl border border-[var(--pf-border)] shadow-md m-4">
            <div className="text-[10px] font-bold tracking-wider text-[var(--pf-text-dim)] uppercase px-2 py-1">Узлы</div>
            <button className="platform-btn-secondary text-[12px] flex items-center justify-start h-8 px-3" onClick={() => handleAddNode('triggerNode')}>
              <Zap size={13} className="mr-2 text-[var(--pf-accent)]"/> Триггер
            </button>
            <button className="platform-btn-secondary text-[12px] flex items-center justify-start h-8 px-3" onClick={() => handleAddNode('conditionNode')}>
              <GitMerge size={13} className="mr-2 text-[var(--pf-warning)]"/> Условие
            </button>
            <button className="platform-btn-secondary text-[12px] flex items-center justify-start h-8 px-3" onClick={() => handleAddNode('actionNode')}>
              <Play size={13} className="mr-2 text-[var(--pf-success)]"/> Действие
            </button>
          </FlowPanel>
          
          {nodes.some(n => n.selected) && (
            <FlowPanel position="bottom-center" className="mb-4">
              <div className="flex gap-2 bg-[var(--pf-surface)] p-2 rounded-xl border border-[var(--pf-border)] shadow-lg animate-in slide-in-from-bottom-2">
                <button className="platform-btn-secondary h-9 px-3 text-[12px]" onClick={handleDuplicateSelected}>
                  <Copy size={14} className="mr-1.5" /> Дублировать
                </button>
                <button className="platform-btn-secondary h-9 px-3 text-[12px] text-[var(--pf-danger)] hover:bg-[color-mix(in_srgb,var(--pf-danger)_10%,transparent)] hover:border-[color-mix(in_srgb,var(--pf-danger)_20%,transparent)]" onClick={handleDeleteSelected}>
                  <Trash2 size={14} className="mr-1.5" /> Удалить
                </button>
              </div>
            </FlowPanel>
          )}

          <Controls className="bg-[var(--pf-surface)] border-[var(--pf-border)] shadow-md rounded-lg overflow-hidden" />
          <MiniMap className="bg-[var(--pf-surface)] border-[var(--pf-border)] rounded-lg overflow-hidden shadow-md" maskColor="var(--pf-surface-2)" nodeColor="var(--pf-accent)" />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} color="var(--pf-border-strong)" />
        </ReactFlow>
      </SectionCard>
    </PageShell>
  );
}

export default function Constructor() {
  return (
    <ReactFlowProvider>
      <ConstructorFlow />
    </ReactFlowProvider>
  );
}
