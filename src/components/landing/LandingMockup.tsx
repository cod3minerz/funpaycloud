'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  Cable,
  CircleDashed,
  FolderKanban,
  MessageSquare,
  Send,
  ShoppingCart,
  Sparkles,
  Tags,
} from 'lucide-react';

type MockNodeID = 'message' | 'ai' | 'telegram';

type NodePosition = {
  x: number;
  y: number;
};

type DragState = {
  id: MockNodeID;
  offsetX: number;
  offsetY: number;
} | null;

const NODE_WIDTH = 206;
const NODE_HEIGHT = 86;

const INITIAL_POSITIONS: Record<MockNodeID, NodePosition> = {
  message: { x: 34, y: 78 },
  ai: { x: 298, y: 66 },
  telegram: { x: 560, y: 158 },
};

const SIDEBAR_ITEMS = [
  { icon: BarChart3, label: 'Главная' },
  { icon: ShoppingCart, label: 'Заказы' },
  { icon: MessageSquare, label: 'Чаты', badge: '31' },
  { icon: Tags, label: 'Лоты' },
  { icon: Boxes, label: 'Склад' },
];

const MANAGEMENT_ITEMS = [
  { icon: Activity, label: 'Аналитика' },
  { icon: FolderKanban, label: 'Конструктор', active: true },
  { icon: CircleDashed, label: 'Статус системы' },
];

const NODES = [
  {
    id: 'message' as const,
    title: 'Новое сообщение',
    subtitle: 'chat_message',
    accent: 'is-blue',
    icon: MessageSquare,
  },
  {
    id: 'ai' as const,
    title: 'ИИ-ассистент',
    subtitle: 'Короткий ответ по инструкции',
    accent: 'is-purple',
    icon: Bot,
  },
  {
    id: 'telegram' as const,
    title: 'Отправить в Telegram',
    subtitle: 'Уведомить о важном диалоге',
    accent: 'is-green',
    icon: Send,
  },
];

export default function LandingMockup() {
  const [positions, setPositions] = useState<Record<MockNodeID, NodePosition>>(INITIAL_POSITIONS);
  const [dragState, setDragState] = useState<DragState>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncBounds = () => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setPositions((current) => {
        const next = { ...current };
        (Object.keys(next) as MockNodeID[]).forEach((id) => {
          next[id] = {
            x: Math.max(12, Math.min(current[id].x, rect.width - NODE_WIDTH - 12)),
            y: Math.max(12, Math.min(current[id].y, rect.height - NODE_HEIGHT - 12)),
          };
        });
        return next;
      });
    };

    syncBounds();
    window.addEventListener('resize', syncBounds);
    return () => window.removeEventListener('resize', syncBounds);
  }, []);

  useEffect(() => {
    if (!dragState) return;

    const onPointerMove = (event: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const nextX = event.clientX - rect.left - dragState.offsetX;
      const nextY = event.clientY - rect.top - dragState.offsetY;

      const clampedX = Math.max(12, Math.min(nextX, rect.width - NODE_WIDTH - 12));
      const clampedY = Math.max(12, Math.min(nextY, rect.height - NODE_HEIGHT - 12));

      setPositions((current) => ({
        ...current,
        [dragState.id]: { x: clampedX, y: clampedY },
      }));
    };

    const onPointerUp = () => setDragState(null);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragState]);

  const handlePointerDown = (id: MockNodeID, event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setDragState({
      id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
  };

  const messageCenterX = positions.message.x + NODE_WIDTH;
  const messageCenterY = positions.message.y + NODE_HEIGHT / 2;
  const aiCenterX = positions.ai.x;
  const aiCenterY = positions.ai.y + NODE_HEIGHT / 2;

  const aiOutX = positions.ai.x + NODE_WIDTH;
  const aiOutY = positions.ai.y + NODE_HEIGHT / 2;
  const tgInX = positions.telegram.x;
  const tgInY = positions.telegram.y + NODE_HEIGHT / 2;

  return (
    <div className="wrap">
      <div className="mock-frame">
        <div className="mock-top">
          <div className="dots">
            <i />
            <i />
            <i />
          </div>
          <div className="url mono">funpay.cloud - самый быстрый облачный сервис</div>
          <div className="mono mock-version">v2.4.1</div>
        </div>

        <div className="mock-body">
          <aside className="mock-side">
            <div className="side-title">Операции</div>
            {SIDEBAR_ITEMS.map((item) => (
              <div key={item.label} className="side-item">
                <item.icon size={14} className="ico" />
                {item.label}
                {item.badge ? <span className="badge">{item.badge}</span> : null}
              </div>
            ))}
            <div className="side-title side-title-gap">Управление</div>
            {MANAGEMENT_ITEMS.map((item) => (
              <div key={item.label} className={`side-item ${item.active ? 'active' : ''}`}>
                <item.icon size={14} className="ico" />
                {item.label}
              </div>
            ))}
          </aside>

          <div className="mock-main constructor-main">
            <div className="mock-head">
              <h3>Конструктор сценариев</h3>
              <span className="period mono">режим демо</span>
            </div>

            <div className="mock-constructor-canvas" ref={canvasRef}>
              <svg className="mock-constructor-lines" viewBox="0 0 1000 420" preserveAspectRatio="none">
                <path
                  d={`M ${messageCenterX} ${messageCenterY} C ${messageCenterX + 70} ${messageCenterY}, ${aiCenterX - 70} ${aiCenterY}, ${aiCenterX} ${aiCenterY}`}
                />
                <path
                  d={`M ${aiOutX} ${aiOutY} C ${aiOutX + 70} ${aiOutY}, ${tgInX - 70} ${tgInY}, ${tgInX} ${tgInY}`}
                />
              </svg>

              {NODES.map((node) => {
                const Icon = node.icon;
                const pos = positions[node.id];
                return (
                  <div
                    key={node.id}
                    className={`mock-flow-node ${node.accent}`}
                    style={{ left: pos.x, top: pos.y }}
                    onPointerDown={(event) => handlePointerDown(node.id, event)}
                  >
                    <div className="mock-flow-node-head">
                      <Icon size={14} />
                      <span>{node.title}</span>
                    </div>
                    <div className="mock-flow-node-sub">{node.subtitle}</div>
                  </div>
                );
              })}

              <div className="mock-constructor-tip">
                <Sparkles size={13} />
                Перетаскивайте узлы, чтобы почувствовать механику конструктора
              </div>
              <div className="mock-constructor-brand">
                <Cable size={12} />
                Flow
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
