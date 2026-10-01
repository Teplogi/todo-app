"use client";

import { useMemo, useState } from "react";
import { toDateKey, WEEKDAYS } from "@/lib/date";
import type { Todo } from "@/lib/todoStore";

type Props = {
  todos: Todo[];
  today: string;
  selected: string;
  onSelect: (key: string) => void;
};

const navBtn =
  "rounded-lg p-2 text-muted transition hover:bg-track hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20";

export default function Calendar({ todos, today, selected, onSelect }: Props) {
  const [month, setMonth] = useState(() => selected.slice(0, 7));
  const [year, mon] = month.split("-").map(Number);

  const byDate = useMemo(() => {
    const map = new Map<string, Todo[]>();
    for (const t of todos) {
      if (!t.dueDate) continue;
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    // 未完了を先に表示する
    map.forEach((list) => list.sort((a, b) => Number(a.completed) - Number(b.completed)));
    return map;
  }, [todos]);

  const firstWeekday = new Date(year, mon - 1, 1).getDay();
  const daysInMonth = new Date(year, mon, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, i) =>
    toDateKey(new Date(year, mon - 1, 1 - firstWeekday + i)),
  );

  function shiftMonth(delta: number) {
    setMonth(toDateKey(new Date(year, mon - 1 + delta, 1)).slice(0, 7));
  }

  function select(key: string) {
    onSelect(key);
    if (key.slice(0, 7) !== month) setMonth(key.slice(0, 7));
  }

  return (
    <section aria-label="カレンダー" className="mb-6 rounded-2xl border border-line bg-surface p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold" aria-live="polite">
          {year}年 {mon}月
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={() => shiftMonth(-1)} aria-label="前の月" className={navBtn}>
            <Chevron dir="left" />
          </button>
          <button
            onClick={() => select(today)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:bg-track"
          >
            今日
          </button>
          <button onClick={() => shiftMonth(1)} aria-label="次の月" className={navBtn}>
            <Chevron dir="right" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`pb-2 ${i === 0 ? "text-danger" : i === 6 ? "text-accent" : ""}`}>
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
        {cells.map((key, i) => {
          const items = byDate.get(key) ?? [];
          const open = items.filter((t) => !t.completed);
          const inMonth = key.slice(0, 7) === month;
          const isToday = key === today;
          const isSelected = key === selected;
          const day = Number(key.slice(8));
          const weekday = i % 7;
          const hasOverdue = key < today && open.length > 0;

          return (
            <button
              key={key}
              onClick={() => select(key)}
              aria-pressed={isSelected}
              aria-label={`${Number(key.slice(5, 7))}月${day}日${
                items.length ? ` タスク${items.length}件（未完了${open.length}件）` : ""
              }`}
              className={`relative flex min-h-14 flex-col items-stretch gap-0.5 p-1 text-left transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-24 sm:p-1.5 ${
                isSelected ? "bg-accent/10" : "bg-surface hover:bg-track/60"
              } ${inMonth ? "" : "opacity-45"}`}
            >
              <span
                className={`mx-auto flex size-6 items-center justify-center rounded-full text-xs font-semibold sm:mx-0 sm:size-7 sm:text-sm ${
                  isToday
                    ? "bg-accent text-white"
                    : weekday === 0
                      ? "text-danger"
                      : weekday === 6
                        ? "text-accent"
                        : ""
                }`}
              >
                {day}
              </span>

              {/* PC：タイトルを最大2件表示 */}
              <span className="hidden flex-col gap-0.5 sm:flex">
                {items.slice(0, 2).map((t) => (
                  <span
                    key={t.id}
                    className={`truncate rounded px-1 py-px text-[11px] leading-4 ${
                      t.completed
                        ? "text-muted line-through"
                        : hasOverdue
                          ? "bg-danger/10 text-danger"
                          : "bg-accent/10 text-accent"
                    }`}
                  >
                    {t.title}
                  </span>
                ))}
                {items.length > 2 && (
                  <span className="px-1 text-[11px] text-muted">+{items.length - 2}件</span>
                )}
              </span>

              {/* スマホ：件数をドットで表示 */}
              {items.length > 0 && (
                <span className="flex justify-center gap-0.5 sm:hidden" aria-hidden>
                  {items.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className={`size-1.5 rounded-full ${
                        t.completed ? "bg-muted/40" : hasOverdue ? "bg-danger" : "bg-accent"
                      }`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}
