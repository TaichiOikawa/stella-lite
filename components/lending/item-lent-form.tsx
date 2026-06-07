"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ClassRow, ItemWithRemaining } from "@/lib/lending";
import { classLabel } from "@/lib/format";
import { createLending } from "@/app/lib/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CUSTOM = "custom";

export function ItemLentForm({
  classes,
  items,
}: {
  classes: ClassRow[];
  items: ItemWithRemaining[];
}) {
  const router = useRouter();
  const [classId, setClassId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [customItemName, setCustomItemName] = useState("");
  const [amount, setAmount] = useState("1");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === classId) ?? null,
    [classes, classId]
  );
  const isCustom = itemId === CUSTOM;
  const selectedItem = useMemo(
    () => (isCustom ? null : items.find((i) => i.id === itemId) ?? null),
    [items, itemId, isCustom]
  );
  const maxAmount = selectedItem?.remaining;

  const displayItemName = isCustom
    ? customItemName.trim() || "(カスタム物品)"
    : selectedItem?.name ?? "";

  function validate(): string | null {
    if (!classId) return "クラスを選択してください。";
    if (!itemId) return "物品を選択してください。";
    if (isCustom && !customItemName.trim()) return "物品名を入力してください。";
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 1) return "数量は1以上で入力してください。";
    if (maxAmount !== undefined && n > maxAmount)
      return `残数(${maxAmount}個)を超えています。`;
    return null;
  }

  function handleOpenConfirm() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setConfirmOpen(true);
  }

  function handleSubmit() {
    startTransition(async () => {
      const t = toast.loading("貸し出し処理中...");
      const res = await createLending({
        classId: classId!,
        itemId: isCustom ? null : itemId,
        customItemName: isCustom ? customItemName.trim() : undefined,
        amount: Number(amount),
      });
      toast.dismiss(t);
      if (res.ok) {
        toast.success("貸し出しが完了しました。");
        setConfirmOpen(false);
        router.push("/lending");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* クラス選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            1. クラスを選択
            {selectedClass && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                選択中: {classLabel(selectedClass)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <EmptyHint href="/classes" label="クラスを登録" />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {classes.map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  variant={c.id === classId ? "default" : "outline"}
                  onClick={() => setClassId(c.id)}
                >
                  {c.color && (
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                  )}
                  {classLabel(c)}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 物品選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. 物品を選択</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((i) => {
              const disabled = i.remaining <= 0;
              return (
                <Button
                  key={i.id}
                  type="button"
                  variant={i.id === itemId ? "default" : "outline"}
                  disabled={disabled}
                  className="h-auto flex-col items-start py-2"
                  onClick={() => {
                    setItemId(i.id);
                    setAmount("1");
                  }}
                >
                  <span className="font-medium">{i.name}</span>
                  <span className="text-xs text-muted-foreground">
                    残 {i.remaining} / {i.totalQuantity}
                  </span>
                </Button>
              );
            })}
            <Button
              type="button"
              variant={isCustom ? "default" : "outline"}
              className={cn(!isCustom && "text-amber-600")}
              onClick={() => setItemId(CUSTOM)}
            >
              カスタム
            </Button>
          </div>

          {isCustom && (
            <div className="grid gap-1.5">
              <Label htmlFor="custom-item">物品名(カスタム)</Label>
              <Input
                id="custom-item"
                value={customItemName}
                placeholder="物品名を入力"
                onChange={(e) => setCustomItemName(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 数量 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. 数量を入力</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid max-w-xs gap-1.5">
            <Label htmlFor="amount">
              数量
              {maxAmount !== undefined && (
                <span className="text-xs font-normal text-muted-foreground">
                  (最大 {maxAmount} 個)
                </span>
              )}
            </Label>
            <Input
              id="amount"
              type="number"
              min={1}
              max={maxAmount}
              value={amount}
              disabled={!itemId}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleOpenConfirm} disabled={isPending}>
          確認する
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>貸し出し確認</DialogTitle>
            <DialogDescription>
              以下の内容で貸し出します。よろしいですか？
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-muted-foreground">クラス</div>
            <div className="col-span-2">
              {selectedClass ? classLabel(selectedClass) : "-"}
            </div>
            <div className="text-muted-foreground">物品</div>
            <div className="col-span-2">{displayItemName}</div>
            <div className="text-muted-foreground">数量</div>
            <div className="col-span-2">{amount} 個</div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              いいえ
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              はい
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyHint({ href, label }: { href: string; label: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      まだ登録がありません。
      <a href={href} className="ml-1 underline underline-offset-2">
        {label}
      </a>
    </p>
  );
}
