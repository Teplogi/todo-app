"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { formatLongDate, todayKey } from "@/lib/date";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  todoActions,
  type Todo,
} from "@/lib/todoStore";
import AddTodoForm from "./components/AddTodoForm";
import Calendar from "./components/Calendar";
import TodoItem from "./components/TodoItem";

type View = "list" | "calendar";
type Filter = "all" | "active" | "completed";
type Sort = "created" | "due";

const VIEWS: { key: View; label: string }[] = [
  { key: "list", label: "リスト" },
  { key: "calendar", label: "カレンダー" },
];

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "active", label: "未完了" },
  { key: "completed", label: "完了" },
];

const isHydrated = () => true;
const noopSubscribe = () => () => {};

function segmentClass(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    active ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
  }`;
}

/** 期限が近い順。期限なしは最後、同じ期限なら追加順を保つ */
function byDue(a: Todo, b: Todo) {
  if (a.dueDate === b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

export default function TodoApp() {
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // サーバー描画中は localStorage や「今日」が確定しないので、描画をクライアントに任せる
  const hydrated = useSyncExternalStore(noopSubscribe, isHydrated, () => false);
  const [view, setView] = useState<View>("list");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("created");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ todo: Todo; index: number } | null>(null);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 5000);
    return () => clearTimeout(timer);
  }, [undo]);

  if (!hydrated) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight">ToDo リスト</h1>
        <p className="mt-1 text-sm text-muted">読み込み中…</p>
      </main>
    );
  }

  const today = todayKey();
  const selected = selectedDate ?? today;
  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - activeCount;
  const overdueCount = todos.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length;
  const dueTodayCount = todos.filter((t) => !t.completed && t.dueDate === today).length;
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  function handleRemove(todo: Todo) {
    const index = todos.findIndex((t) => t.id === todo.id);
    todoActions.remove(todo.id);
    setUndo({ todo, index });
  }

  const renderItems = (items: Todo[]) => (
    <ul className="space-y-2">
      {items.map((todo) => (
        <TodoItem key={todo.id} todo={todo} today={today} onRemove={() => handleRemove(todo)} />
      ))}
    </ul>
  );

  return (
    <main
      className={`mx-auto w-full px-4 py-10 sm:py-16 ${view === "calendar" ? "max-w-4xl" : "max-w-2xl"}`}
    >
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">ToDo リスト</h1>
          <div role="tablist" aria-label="表示の切り替え" className="flex gap-1 rounded-xl bg-track p-1">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                role="tab"
                aria-selected={view === v.key}
                onClick={() => setView(v.key)}
                className={segmentClass(view === v.key)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          {todos.length === 0 ? (
            <span>今日やることを書き出してみましょう</span>
          ) : (
            <>
              <span>
                残り {activeCount} 件 / 全 {todos.length} 件
              </span>
              {overdueCount > 0 && (
                <span className="font-semibold text-danger">期限切れ {overdueCount} 件</span>
              )}
              {dueTodayCount > 0 && (
                <span className="font-semibold text-warning">今日まで {dueTodayCount} 件</span>
              )}
            </>
          )}
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

      {view === "list" ? (
        <ListView
          todos={todos}
          today={today}
          filter={filter}
          sort={sort}
          completedCount={completedCount}
          onFilter={setFilter}
          onSort={setSort}
          renderItems={renderItems}
        />
      ) : (
        <>
          <Calendar todos={todos} today={today} selected={selected} onSelect={setSelectedDate} />
          <section aria-label={`${formatLongDate(selected)}のタスク`}>
            <h2 className="mb-3 text-lg font-bold">
              {formatLongDate(selected)}
              {selected === today && <span className="ml-2 text-sm font-medium text-accent">今日</span>}
              <span className="ml-2 text-sm font-normal text-muted">が期限のタスク</span>
            </h2>
            <AddTodoForm key={selected} today={today} fixedDate={selected} />
            {(() => {
              const items = todos.filter((t) => t.dueDate === selected);
              return items.length ? (
                renderItems(items)
              ) : (
                <EmptyState icon="🗓️" message="この日が期限のタスクはありません" />
              );
            })()}
          </section>
        </>
      )}

      <p className="mt-8 text-center text-xs text-muted">
        ダブルクリックでタスク名を編集 ・ 期限バッジをクリックで日付を変更 ・ データはこのブラウザに保存されます
      </p>

      {undo && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-6 z-20 mx-auto flex max-w-md items-center justify-between gap-4 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-lg"
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

function ListView({
  todos,
  today,
  filter,
  sort,
  completedCount,
  onFilter,
  onSort,
  renderItems,
}: {
  todos: Todo[];
  today: string;
  filter: Filter;
  sort: Sort;
  completedCount: number;
  onFilter: (f: Filter) => void;
  onSort: (s: Sort) => void;
  renderItems: (items: Todo[]) => React.ReactNode;
}) {
  const filtered = todos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.completed : t.completed,
  );
  const visible = sort === "due" ? [...filtered].sort(byDue) : filtered;

  return (
    <>
      <AddTodoForm today={today} onAdded={() => filter === "completed" && onFilter("all")} />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="表示の絞り込み" className="flex gap-1 rounded-xl bg-track p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => onFilter(f.key)}
              className={segmentClass(filter === f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="sort">
            並び順
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => onSort(e.target.value as Sort)}
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
          >
            <option value="created">追加が新しい順</option>
            <option value="due">期限が近い順</option>
          </select>
          {completedCount > 0 && (
            <button
              onClick={todoActions.clearCompleted}
              className="rounded-lg px-2 py-1.5 text-sm text-muted transition hover:text-danger"
            >
              完了済みを削除
            </button>
          )}
        </div>
      </div>

      {visible.length > 0 ? (
        renderItems(visible)
      ) : (
        <EmptyState
          icon={filter === "completed" ? "📝" : "🎉"}
          message={
            todos.length === 0
              ? "タスクはまだありません"
              : filter === "active"
                ? "未完了のタスクはありません。お疲れさまでした！"
                : "完了したタスクはまだありません"
          }
        />
      )}
    </>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-muted">
      <p className="text-4xl" aria-hidden>
        {icon}
      </p>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}
