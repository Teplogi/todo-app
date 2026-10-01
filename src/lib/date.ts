// 期限はタイムゾーンのずれを避けるため、ローカル日付の "YYYY-MM-DD" 文字列で扱う

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number) {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function diffDays(key: string, base: string) {
  return Math.round(
    (parseDateKey(key).getTime() - parseDateKey(base).getTime()) / 86_400_000,
  );
}

export function formatMonthDay(key: string) {
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}

export function formatLongDate(key: string) {
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS[d.getDay()]})`;
}

export type DueTone = "overdue" | "today" | "soon" | "normal";

export function describeDue(key: string, today: string): { label: string; tone: DueTone } {
  const diff = diffDays(key, today);
  if (diff < 0) return { label: `${formatMonthDay(key)}・${-diff}日超過`, tone: "overdue" };
  if (diff === 0) return { label: "今日まで", tone: "today" };
  if (diff === 1) return { label: "明日まで", tone: "soon" };
  return { label: `${formatMonthDay(key)}まで`, tone: diff <= 3 ? "soon" : "normal" };
}
