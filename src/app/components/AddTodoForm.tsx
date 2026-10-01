"use client";

import { useRef, useState } from "react";
import { addDays, formatLongDate } from "@/lib/date";
import { todoActions } from "@/lib/todoStore";

type Props = {
  today: string;
  /** 指定するとその日付で固定して追加する（カレンダー表示用） */
  fixedDate?: string;
  onAdded?: () => void;
};

const chip =
  "rounded-lg border px-2.5 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20";

export default function AddTodoForm({ today, fixedDate, onAdded }: Props) {
  const [draft, setDraft] = useState("");
  const [due, setDue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    todoActions.add(draft, fixedDate ?? (due || null));
    setDraft("");
    inputRef.current?.focus();
    onAdded?.();
  }

  const quick = [
    { label: "今日", value: today },
    { label: "明日", value: addDays(today, 1) },
    { label: "1週間後", value: addDays(today, 7) },
  ];

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-2">
      <div className="flex gap-2">
        <label htmlFor="new-todo" className="sr-only">
          新しいタスク
        </label>
        <input
          id="new-todo"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            fixedDate
              ? `${formatLongDate(fixedDate)} が期限のタスクを追加`
              : "新しいタスクを入力して Enter"
          }
          maxLength={200}
          autoComplete="off"
          autoFocus={!fixedDate}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-base shadow-sm outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="shrink-0 rounded-xl bg-accent px-5 py-3 font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          追加
        </button>
      </div>

      {!fixedDate && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="new-todo-due" className="text-muted">
            期限
          </label>
          <input
            id="new-todo-due"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20"
          />
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => setDue(due === q.value ? "" : q.value)}
              aria-pressed={due === q.value}
              className={`${chip} ${
                due === q.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line bg-surface text-muted hover:text-foreground"
              }`}
            >
              {q.label}
            </button>
          ))}
          {due && (
            <button
              type="button"
              onClick={() => setDue("")}
              className="px-1 text-muted underline-offset-2 transition hover:text-foreground hover:underline"
            >
              期限なしにする
            </button>
          )}
        </div>
      )}
    </form>
  );
}
