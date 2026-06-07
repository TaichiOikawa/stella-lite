import { format } from "date-fns";

/** クラス表示ラベル(例: 1-2) */
export function classLabel(c: { grade: number; number: number }): string {
  return `${c.grade}-${c.number}`;
}

/** 日時を「M/d HH:mm」で表示 */
export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "M/d HH:mm");
}
