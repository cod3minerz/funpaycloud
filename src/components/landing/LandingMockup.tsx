'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  Cable,
  CheckCircle,
  Filter,
  FolderKanban,
  MessageSquare,
  Package,
  Send,
  ShoppingCart,
  Sparkles,
  Tag,
  Zap,
} from 'lucide-react';

type NodeID = 'trigger' | 'filter' | 'ai' | 'deliver' | 'notify';
type Pos = { x: number; y: number };
type DragState = { id: NodeID; ox: number; oy: number } | null;

const NODE_W = 200;
const NODE_H = 82;

const DESKTOP_POS: Record<NodeID, Pos> = {
  trigger:  { x: 20,  y: 60  },
  filter:   { x: 260, y: 20  },
  ai:       { x: 260, y: 148 },
  deliver:  { x: 500, y: 20  },
  notify:   { x: 500, y: 148 },
};

const EDGES: [NodeID, NodeID][] = [
  ['trigger', 'filter'],
  ['trigger', 'ai'],
  ['filter',  'deliver'],
  ['ai',      'notify'],
];

const NODES: { id: NodeID; title: string; sub: string; color: string; Icon: React.ElementType }[] = [
  { id: 'trigger',  title: 'Новое сообщение',     sub: 'Событие: chat_message',         color: 'node-blue',   Icon: MessageSquare },
  { id: 'filter',   title: 'Фильтр по словам',    sub: 'содержит: «беру», «покупаю»',   color: 'node-orange', Icon: Filter },
  { id: 'ai',       title: 'ИИ-ассистент',         sub: 'Ответить по инструкции',        color: 'node-purple', Icon: Bot },
  { id: 'deliver',  title: 'Автовыдача товара',    sub: 'Отправить ключ из склада',      color: 'node-green',  Icon: Package },
  { id: 'notify',   title: 'Telegram-уведомление', sub: 'Уведомить об ИИ-ответе',        color: 'node-teal',   Icon: Send },
];

const NAV = [
  { Icon: BarChart3,     label: 'Главная' },
  { Icon: ShoppingCart,  label: 'Заказы' },
  { Icon: MessageSquare, label: 'Чаты', badge: '8' },
  { Icon: Tag,           label: 'Лоты' },
  { Icon: Boxes,         label: 'Склад' },
];
const NAV2 = [
  { Icon: Activity,      label: 'Аналитика' },
  { Icon: FolderKanban,  label: 'Конструктор', active: true },
  { Icon: Zap,           label: 'Автоматизация' },
];

function edgePath(from: Pos, to: Pos, nw: number, nh: number) {
  const x1 = from.x + nw;
  const y1 = from.y + nh / 2;
  const x2 = to.x;
  const y2 = to.y + nh / 2;
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

export default function LandingMockup() {
  const [positions, setPositions] = useState<Record<NodeID, Pos>>(DESKTOP_POS);
  const [compact, setCompact] = useState(false);
  const [drag, setDrag] = useState<DragState>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 680px)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (compact || !canvasRef.current) return;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    setPositions((p) => {
      const next = { ...p } as Record<NodeID, Pos>;
      (Object.keys(next) as NodeID[]).forEach((id) => {
        next[id] = {
          x: clamp(next[id].x, 8, width - NODE_W - 8),
          y: clamp(next[id].y, 8, height - NODE_H - 8),
        };
      });
      return next;
    });
  }, [compact]);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      if (!canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      setPositions((p) => ({
        ...p,
        [drag.id]: {
          x: clamp(e.clientX - r.left - drag.ox, 8, r.width - NODE_W - 8),
          y: clamp(e.clientY - r.top - drag.oy, 8, r.height - NODE_H - 8),
        },
      }));
    };
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag]);

  return (
    <div className="wrap">
      <div className="mock-frame">
        {/* browser chrome */}
        <div className="mock-top">
          <div className="dots"><i /><i /><i /></div>
          <div className="url mono">funpay.cloud/constructor</div>
          <div className="mono mock-version">v2.4.1</div>
        </div>

        <div className="mock-body">
          {/* sidebar */}
          <aside className="mock-side">
            <div className="side-title">Операции</div>
            {NAV.map((item) => (
              <div key={item.label} className="side-item">
                <item.Icon size={14} className="ico" />
                {item.label}
                {item.badge && <span className="badge">{item.badge}</span>}
              </div>
            ))}
            <div className="side-title side-title-gap">Управление</div>
            {NAV2.map((item) => (
              <div key={item.label} className={`side-item${item.active ? ' active' : ''}`}>
                <item.Icon size={14} className="ico" />
                {item.label}
              </div>
            ))}
          </aside>

          {/* main */}
          <div className="mock-main constructor-main">
            <div className="mock-head">
              <h3>Конструктор сценариев</h3>
              <span className="period mono">5 узлов · 4 связи</span>
            </div>

            {/* desktop: draggable canvas */}
            {!compact && (
              <div className="mock-constructor-canvas" ref={canvasRef}>
                <svg className="mock-constructor-lines" viewBox="0 0 1000 360" preserveAspectRatio="none">
                  {EDGES.map(([a, b]) => (
                    <path key={`${a}-${b}`} d={edgePath(positions[a], positions[b], NODE_W, NODE_H)} />
                  ))}
                </svg>
                {NODES.map((n) => {
                  const pos = positions[n.id];
                  return (
                    <div
                      key={n.id}
                      className={`mock-flow-node ${n.color}`}
                      style={{ left: pos.x, top: pos.y, width: NODE_W, minHeight: NODE_H }}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        const r = e.currentTarget.getBoundingClientRect();
                        setDrag({ id: n.id, ox: e.clientX - r.left, oy: e.clientY - r.top });
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                    >
                      <div className="mock-flow-node-head">
                        <n.Icon size={13} />
                        <span>{n.title}</span>
                      </div>
                      <div className="mock-flow-node-sub">{n.sub}</div>
                    </div>
                  );
                })}
                <div className="mock-constructor-tip">
                  <Sparkles size={12} />
                  Перетаскивайте узлы, чтобы почувствовать механику
                </div>
                <div className="mock-constructor-brand">
                  <Cable size={11} /> FLOW
                </div>
              </div>
            )}

            {/* mobile: static vertical flow */}
            {compact && (
              <div className="mock-flow-mobile">
                {NODES.map((n, i) => (
                  <React.Fragment key={n.id}>
                    <div className={`mfn ${n.color}`}>
                      <div className="mfn-head">
                        <n.Icon size={13} />
                        <span>{n.title}</span>
                      </div>
                      <div className="mfn-sub">{n.sub}</div>
                    </div>
                    {i < NODES.length - 1 && (
                      <div className="mock-flow-mobile-arrow">
                        <ArrowRight size={12} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
