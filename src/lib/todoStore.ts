export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  /** 期限（ローカル日付 "YYYY-MM-DD"）。未設定なら null/undefined */
  dueDate?: string | null;
};

const STORAGE_KEY = "todo-app:v1";
const EMPTY: Todo[] = [];

let cache: Todo[] | null = null;
const listeners = new Set<() => void>();

function load(): Todo[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Todo[]) : [];
  } catch {
    return [];
  }
}

function save(next: Todo[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 容量超過やプライベートモードでも画面上の操作は継続させる
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  // 別タブでの変更も反映する
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): Todo[] {
  if (cache === null) cache = load();
  return cache;
}

export function getServerSnapshot(): Todo[] {
  return EMPTY;
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const todoActions = {
  add(title: string, dueDate: string | null = null) {
    const trimmed = title.trim();
    if (!trimmed) return;
    save([
      { id: newId(), title: trimmed, completed: false, createdAt: Date.now(), dueDate },
      ...getSnapshot(),
    ]);
  },
  setDue(id: string, dueDate: string | null) {
    save(getSnapshot().map((t) => (t.id === id ? { ...t, dueDate } : t)));
  },
  toggle(id: string) {
    save(
      getSnapshot().map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ),
    );
  },
  rename(id: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    save(getSnapshot().map((t) => (t.id === id ? { ...t, title: trimmed } : t)));
  },
  remove(id: string) {
    save(getSnapshot().filter((t) => t.id !== id));
  },
  restore(todo: Todo, index: number) {
    const next = [...getSnapshot()];
    next.splice(Math.min(index, next.length), 0, todo);
    save(next);
  },
  clearCompleted() {
    save(getSnapshot().filter((t) => !t.completed));
  },
};
