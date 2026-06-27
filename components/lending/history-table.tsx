"use client";

import { useMemo } from "react";

import type { LendingRecord } from "@/lib/lending";
import { classLabel, formatDateTime, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  applyDir,
  SortableHead,
  useSort,
} from "@/components/lending/sortable-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function itemName(l: LendingRecord): string {
  return l.item?.name ?? l.customItemName ?? "(不明な物品)";
}

type SortKey = "class" | "item" | "amount" | "start" | "end" | "status";

/** 状態の並び順: 未返却(0) → 貸出中(1) → 返却済み(2) */
function statusRank(l: LendingRecord): number {
  if (l.endTime) return 2;
  return isOverdue(l) ? 0 : 1;
}

function time(d: Date | string | null): number {
  return d ? new Date(d).getTime() : Number.POSITIVE_INFINITY;
}

function compare(a: LendingRecord, b: LendingRecord, key: SortKey): number {
  switch (key) {
    case "class":
      return a.class.grade - b.class.grade || a.class.number - b.class.number;
    case "item":
      return itemName(a).localeCompare(itemName(b), "ja");
    case "amount":
      return a.amount - b.amount;
    case "start":
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    case "end":
      return time(a.endTime) - time(b.endTime);
    case "status":
      return statusRank(a) - statusRank(b);
  }
}

export function HistoryTable({ lendings }: { lendings: LendingRecord[] }) {
  const sort = useSort<SortKey>("start", "desc", "lending-history-sort");

  const sorted = useMemo(
    () =>
      [...lendings].sort((a, b) => applyDir(compare(a, b, sort.key), sort.dir)),
    [lendings, sort.key, sort.dir],
  );

  if (lendings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        貸し出し履歴はありません。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead sortKey="class" label="クラス" sort={sort} />
            <SortableHead sortKey="item" label="物品名" sort={sort} />
            <SortableHead
              sortKey="amount"
              label="個数"
              sort={sort}
              className="text-right"
            />
            <SortableHead
              sortKey="start"
              label="開始"
              sort={sort}
              className="hidden sm:table-cell"
            />
            <SortableHead
              sortKey="end"
              label="返却"
              sort={sort}
              className="hidden sm:table-cell"
            />
            <SortableHead
              sortKey="status"
              label="状態"
              sort={sort}
              className="text-right"
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((l) => {
            const overdue = isOverdue(l);
            return (
              <TableRow
                key={l.id}
                className={cn(
                  overdue && "bg-destructive/10 hover:bg-destructive/15",
                )}
              >
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    {l.class.color && (
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: l.class.color }}
                      />
                    )}
                    {classLabel(l.class)}
                  </span>
                </TableCell>
                <TableCell>{itemName(l)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {l.amount}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {formatDateTime(l.startTime)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {l.endTime ? formatDateTime(l.endTime) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {l.endTime ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      返却済み
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-xs font-medium",
                        overdue
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {overdue ? "未返却" : "貸出中"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
