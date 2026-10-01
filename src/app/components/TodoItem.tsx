"use client";

import { useRef, useState } from "react";
import { describeDue, type DueTone } from "@/lib/date";
import { todoActions, type Todo } from "@/lib/todoStore";

const TONE_CLASS: Record<DueTone, string> = {
  overdue: "bg-danger/10 text-danger",
  today: "bg-warning/15 text-warning",
  soon: "bg-accent/10 text-accent",
  normal: "bg-track text-muted",
};

type Props = {
  todo: Todo;
  today: string;
  onRemove: () => void;
};

export default function TodoItem({ todo, today, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.title);
  const dateRef = useRef<HTMLInputElement>(null);

  function commit() {
    if (text.trim()) todoActions.rename(todo.id, text);
    else setText(todo.title);
    setEditing(false);
  }

  function openDatePicker() {
    const el = dateRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  }

  const due = todo.dueDate ? describeDue(todo.dueDate, today) : null;
  const dueClass = !due
    ? "border border-dashed border-line text-muted hover:text-foreground"
    : todo.completed
      ? "bg-track text-muted"
      : TONE_CLASS[due.tone];

  return (
    <li className="group flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm transition hover:shadow-md">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => todoActions.toggle(todo.id)}
        aria-label={`「${todo.title}」を${todo.completed ? "未完了に戻す" : "完了にする"}`}
        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-success"
      />

      <div className="min-w-0 flex-1">
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
            className="w-full rounded-md border border-accent bg-transparent px-2 py-0.5 outline-none"
          />
        ) : (
          <span
            onDoubleClick={() => {
              setText(todo.title);
              setEditing(true);
            }}
            className={`block break-words transition ${
              todo.completed ? "text-muted line-through" : ""
            }`}
          >
            {todo.title}
          </span>
        )}

        <div className="relative mt-1.5 inline-flex items-center gap-1">
          <button
            type="button"
            onClick={openDatePicker}
            title="クリックで期限を変更"
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition ${dueClass}`}
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
            {due ? due.label : "期限を設定"}
          </button>
          {/* ネイティブの日付ピッカーをバッジの位置に開くため、透明な input を重ねておく */}
          <input
            ref={dateRef}
            type="date"
            value={todo.dueDate ?? ""}
            onChange={(e) => todoActions.setDue(todo.id, e.target.value || null)}
            tabIndex={-1}
            aria-label={`「${todo.title}」の期限`}
            className="pointer-events-none absolute inset-0 opacity-0"
          />
          {due && (
            <button
              type="button"
              onClick={() => todoActions.setDue(todo.id, null)}
              aria-label={`「${todo.title}」の期限を外す`}
              title="期限を外す"
              className="rounded px-1 text-xs text-muted transition hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              ×
            </button>
          )}
        </div>
      </div>

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
