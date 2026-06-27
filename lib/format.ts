import { format, isBefore, startOfDay } from "date-fns";

/** クラス表示ラベル(例: 1-2) */
export function classLabel(c: { grade: number; number: number }): string {
  return `${c.grade}-${c.number}`;
}

/** 日時を「M/d HH:mm」で表示 */
export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "M/d HH:mm");
}

/** 貸出中かつ貸出開始日が前日以前なら true(＝当日中に返却されなかった) */
export function isOverdue(l: {
  startTime: Date | string;
  endTime: Date | string | null;
}): boolean {
  if (l.endTime) return false; // 返却済みは対象外
  const start =
    typeof l.startTime === "string" ? new Date(l.startTime) : l.startTime;
  return isBefore(start, startOfDay(new Date()));
}
