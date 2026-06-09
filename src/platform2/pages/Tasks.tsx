"use client";
import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Modal } from "@/platform2/components/ui/modal";
import { Button } from "@/platform2/components/ui/button";
import Icon from "@/platform2/icons";
import Input from "@/platform2/components/form/input/InputField";
import TextArea from "@/platform2/components/form/input/TextArea";
import Select from "@/platform2/components/form/Select";

// ── Types ────────────────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high";
type ColumnId = "todo" | "inprogress" | "done";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  account: string;
  createdAt: string;
  column: ColumnId;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS: { id: ColumnId; label: string; accent: string; dot: string }[] = [
  { id: "todo",       label: "К выполнению", accent: "bg-gray-100 dark:bg-gray-800",   dot: "bg-gray-400" },
  { id: "inprogress", label: "В процессе",   accent: "bg-brand-500/8 dark:bg-brand-500/10", dot: "bg-brand-500" },
  { id: "done",       label: "Готово",        accent: "bg-success-500/8 dark:bg-success-500/10", dot: "bg-success-500" },
];

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  low:    { label: "Низкий",   cls: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  medium: { label: "Средний",  cls: "bg-warning-500/10 text-warning-600 dark:text-warning-400" },
  high:   { label: "Высокий",  cls: "bg-error-500/10 text-error-600 dark:text-error-400" },
};

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Добавить новые лоты в Minecraft", description: "Java Edition, 3 варианта цен", priority: "high",   account: "tonminerz",  createdAt: "12 мая", column: "todo" },
  { id: "t2", title: "Проверить прокси на аккаунте",   description: "",                              priority: "medium", account: "PaidInFull", createdAt: "12 мая", column: "todo" },
  { id: "t3", title: "Ответить на отзывы покупателей", description: "Есть 3 отзыва без ответа",     priority: "low",    account: "tonminerz",  createdAt: "11 мая", column: "inprogress" },
  { id: "t4", title: "Настроить Telegram-уведомления", description: "Подключить бота к каналу",     priority: "medium", account: "tonminerz",  createdAt: "10 мая", column: "inprogress" },
  { id: "t5", title: "Обновить описание ChatGPT лота", description: "",                              priority: "low",    account: "PaidInFull", createdAt: "09 мая", column: "done" },
];

// ── Draggable card ────────────────────────────────────────────────────────────

function TaskCard({ task, isDragging = false, onDelete }: { task: Task; isDragging?: boolean; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative cursor-grab touch-none rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow active:cursor-grabbing dark:border-gray-700 dark:bg-gray-900 ${
        isDragging ? "opacity-0" : "hover:shadow-md"
      }`}
    >
      {/* Delete button — stops drag propagation */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-lg text-gray-300 opacity-0 transition-all hover:bg-error-50 hover:text-error-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-error-500/10 dark:hover:text-error-400"
      >
        <Icon name="close" className="h-3.5 w-3.5" />
      </button>

      {/* Priority */}
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_META[task.priority].cls}`}>
        {PRIORITY_META[task.priority].label}
      </span>

      {/* Title */}
      <p className="mt-2 pr-4 text-sm font-semibold leading-snug text-gray-800 dark:text-white">
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="mt-1 text-xs text-gray-400 line-clamp-2">{task.description}</p>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Icon name="group" className="h-3 w-3" />
          {task.account}
        </span>
        <span className="text-xs text-gray-300 dark:text-gray-600">{task.createdAt}</span>
      </div>
    </div>
  );
}

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="rotate-2 cursor-grabbing rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_META[task.priority].cls}`}>
        {PRIORITY_META[task.priority].label}
      </span>
      <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-white">{task.title}</p>
    </div>
  );
}

// ── Droppable column ──────────────────────────────────────────────────────────

function Column({
  col,
  tasks,
  onAdd,
  onDelete,
}: {
  col: typeof COLUMNS[number];
  tasks: Task[];
  onAdd: (colId: ColumnId) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Column header */}
      <div className={`mb-3 flex items-center justify-between rounded-2xl px-4 py-3 ${col.accent}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${col.dot}`} />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{col.label}</span>
          <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-xs font-bold text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(col.id)}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/60 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <Icon name="plus" className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-3 rounded-2xl p-1 transition-colors ${
          isOver ? "bg-brand-500/5 ring-2 ring-brand-500/20" : ""
        }`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onDelete={onDelete} />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center dark:border-gray-700">
            <p className="text-xs text-gray-300 dark:text-gray-600">Перетащите задачу сюда</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Create modal ──────────────────────────────────────────────────────────────


function CreateModal({
  isOpen,
  defaultColumn,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  defaultColumn: ColumnId;
  onClose: () => void;
  onCreate: (task: Omit<Task, "id" | "createdAt">) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [account, setAccount] = useState("tonminerz");
  const [column, setColumn] = useState<ColumnId>(defaultColumn);

  // sync defaultColumn when it changes
  useState(() => { setColumn(defaultColumn); });

  function handleSubmit() {
    if (!title.trim()) return;
    onCreate({ title: title.trim(), description: description.trim(), priority, account, column });
    setTitle("");
    setDescription("");
    setPriority("medium");
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md p-8">
      <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Новая задача</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Название <span className="text-error-500">*</span></label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="Что нужно сделать?" autoFocus />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
          <TextArea value={description} onChange={(val) => setDescription(val)} rows={2} placeholder="Подробности..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Приоритет</label>
            <div className="flex flex-col gap-2">
              {(["high", "medium", "low"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    priority === p
                      ? "border-brand-500 bg-brand-500/5 font-semibold text-brand-600 dark:bg-brand-500/10"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
                  }`}
                >
                  <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                    p === "high" ? "bg-error-500" : p === "medium" ? "bg-warning-500" : "bg-gray-400"
                  }`} />
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Аккаунт</label>
              <Select value={account} onChange={(val) => setAccount(val)}>
                <option value="tonminerz">tonminerz</option>
                <option value="PaidInFull">PaidInFull</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Колонка</label>
              <Select value={column} onChange={(val) => setColumn(val as ColumnId)}>
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="primary" onClick={handleSubmit} disabled={!title.trim()}>Создать</Button>
        <Button variant="outline" onClick={onClose}>Отмена</Button>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalColumn, setModalColumn] = useState<ColumnId>("todo");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const targetCol = over.id as ColumnId;
    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, column: targetCol } : t))
    );
  }

  function openAdd(colId: ColumnId) {
    setModalColumn(colId);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleCreate(data: Omit<Task, "id" | "createdAt">) {
    const now = new Date();
    const createdAt = now.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }).replace(" г.", "");
    setTasks((prev) => [
      { ...data, id: `t${Date.now()}`, createdAt },
      ...prev,
    ]);
  }

  const totalDone = tasks.filter((t) => t.column === "done").length;

  return (
    <div className="flex h-full flex-col space-y-5 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Задачи</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            {totalDone} из {tasks.length} выполнено
          </p>
        </div>
        <Button variant="primary" onClick={() => openAdd("todo")}>
          <Icon name="plus" className="mr-2 h-4 w-4" />
          Новая задача
        </Button>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              col={col}
              tasks={tasks.filter((t) => t.column === col.id)}
              onAdd={openAdd}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCardOverlay task={activeTask} />}
        </DragOverlay>
      </DndContext>

      {/* Create modal */}
      <CreateModal
        isOpen={modalOpen}
        defaultColumn={modalColumn}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
