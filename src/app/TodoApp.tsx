"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  todoActions,
  type Todo,
} from "@/lib/todoStore";

type Filter = "all" | "active" | "completed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "active", label: "未完了" },
  { key: "completed", label: "完了" },
];

const isHydrated = () => true;
const noopSubscribe = () => () => {};

export default function TodoApp() {
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // サーバー描画中は localStorage が読めないので、空状態のちらつきを避ける
  const hydrated = useSyncExternalStore(noopSubscribe, isHydrated, () => false);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [undo, setUndo] = useState<{ todo: Todo; index: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 5000);
    return () => clearTimeout(timer);
  }, [undo]);

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - activeCount;
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;
  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.completed : t.completed,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    todoActions.add(draft);
    setDraft("");
    if (filter === "completed") setFilter("all");
    inputRef.current?.focus();
  }

  function handleRemove(todo: Todo) {
    const index = todos.findIndex((t) => t.id === todo.id);
    todoActions.remove(todo.id);
    setUndo({ todo, index });
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:py-16">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ToDo リスト</h1>
        <p className="mt-1 text-sm text-muted">
          {hydrated
            ? todos.length === 0
              ? "今日やることを書き出してみましょう"
              : `残り ${activeCount} 件 / 全 ${todos.length} 件`
            : "読み込み中…"}
        </p>
        {todos.length > 0 && (
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-track"
            role="progressbar"
            aria-label="完了率"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-success transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <label htmlFor="new-todo" className="sr-only">
          新しいタスク
        </label>
        <input
          id="new-todo"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="新しいタスクを入力して Enter"
          maxLength={200}
          autoComplete="off"
          autoFocus
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-base shadow-sm outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="shrink-0 rounded-xl bg-accent px-5 py-3 font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          追加
        </button>
      </form>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div role="tablist" aria-label="表示の絞り込み" className="flex gap-1 rounded-xl bg-track p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f.key
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {completedCount > 0 && (
          <button
            onClick={todoActions.clearCompleted}
            className="rounded-lg px-2 py-1.5 text-sm text-muted transition hover:text-danger"
          >
            完了済みを削除
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {visible.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onRemove={() => handleRemove(todo)} />
        ))}
      </ul>

      {hydrated && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-muted">
          <p className="text-4xl" aria-hidden>
            {filter === "completed" ? "📝" : "🎉"}
          </p>
          <p className="mt-2 text-sm">
            {todos.length === 0
              ? "タスクはまだありません"
              : filter === "active"
                ? "未完了のタスクはありません。お疲れさまでした！"
                : "完了したタスクはまだありません"}
          </p>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted">
        ダブルクリックでタスク名を編集 ・ データはこのブラウザに保存されます
      </p>

      {undo && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-6 mx-auto flex max-w-md items-center justify-between gap-4 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-lg"
        >
          <span className="truncate">「{undo.todo.title}」を削除しました</span>
          <button
            onClick={() => {
              todoActions.restore(undo.todo, undo.index);
              setUndo(null);
            }}
            className="shrink-0 font-semibold text-accent-soft hover:underline"
          >
            元に戻す
          </button>
        </div>
      )}
    </main>
  );
}

function TodoItem({ todo, onRemove }: { todo: Todo; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.title);

  function commit() {
    if (text.trim()) todoActions.rename(todo.id, text);
    else setText(todo.title);
    setEditing(false);
  }

  return (
    <li className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm transition hover:shadow-md">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => todoActions.toggle(todo.id)}
        aria-label={`「${todo.title}」を${todo.completed ? "未完了に戻す" : "完了にする"}`}
        className="size-5 shrink-0 cursor-pointer accent-success"
      />
      {editing ? (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setText(todo.title);
              setEditing(false);
            }
          }}
          maxLength={200}
          autoFocus
          aria-label="タスク名を編集"
          className="min-w-0 flex-1 rounded-md border border-accent bg-transparent px-2 py-0.5 outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => {
            setText(todo.title);
            setEditing(true);
          }}
          className={`min-w-0 flex-1 break-words transition ${
            todo.completed ? "text-muted line-through" : ""
          }`}
        >
          {todo.title}
        </span>
      )}
      <button
        onClick={onRemove}
        aria-label={`「${todo.title}」を削除`}
        title="削除"
        className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
        </svg>
      </button>
    </li>
  );
}
