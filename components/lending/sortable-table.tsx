"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { TableHead } from "@/components/ui/table";

export type SortDir = "asc" | "desc";

export type Sort<K extends string> = {
  key: K;
  dir: SortDir;
  toggle: (k: K) => void;
};

type SortState<K extends string> = { key: K; dir: SortDir };

/**
 * クリックで昇順/降順をトグルする並び替え状態。
 * `storageKey` を渡すと選択した列・方向を localStorage に保存し、再読み込み後も復元する。
 */
export function useSort<K extends string>(
  initialKey: K,
  initialDir: SortDir = "asc",
  storageKey?: string,
): Sort<K> {
  // SSR・初回クライアントレンダーは常に初期値(ハイドレーション不一致を避ける)。
  const [state, setState] = useState<SortState<K>>({
    key: initialKey,
    dir: initialDir,
  });
  // 復元が完了するまで保存しない(初期値で上書きしないため)
  const restored = useRef(false);

  // 保存済みの並び替えをマウント後に復元する。
  useEffect(() => {
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const saved = JSON.parse(raw) as { key?: string; dir?: string };
          // eslint-disable-next-line react-hooks/set-state-in-effect -- 保存済みUI設定の復元(マウント後一度きり)
          setState((prev) => ({
            key: (saved.key as K) ?? prev.key,
            dir:
              saved.dir === "asc" || saved.dir === "desc"
                ? saved.dir
                : prev.dir,
          }));
        }
      } catch {
        // 壊れた値は無視
      }
    }
    restored.current = true;
  }, [storageKey]);

  // 変更を保存
  useEffect(() => {
    if (!storageKey || !restored.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // 保存失敗は無視
    }
  }, [storageKey, state]);

  const toggle = useCallback((k: K) => {
    setState((prev) =>
      k === prev.key
        ? { key: k, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key: k, dir: "asc" },
    );
  }, []);

  return { key: state.key, dir: state.dir, toggle };
}

/** dir に応じて比較結果の符号を反転する */
export function applyDir(cmp: number, dir: SortDir): number {
  return dir === "asc" ? cmp : -cmp;
}

/** クリックで並び替えできるテーブルヘッダーセル */
export function SortableHead<K extends string>({
  sortKey,
  label,
  sort,
  className,
}: {
  sortKey: K;
  label: string;
  sort: Sort<K>;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const Icon = !active
    ? ChevronsUpDown
    : sort.dir === "asc"
      ? ChevronUp
      : ChevronDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => sort.toggle(sortKey)}
        aria-label={`${label}で並び替え`}
        className={cn(
          "inline-flex select-none items-center gap-1 transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className="size-3.5 shrink-0" />
      </button>
    </TableHead>
  );
}
