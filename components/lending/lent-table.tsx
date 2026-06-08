"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { ActiveLending } from "@/lib/lending";
import { classLabel, formatDateTime } from "@/lib/format";
import { partialReturnLending } from "@/app/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function itemName(l: ActiveLending): string {
  return l.item?.name ?? l.customItemName ?? "(不明な物品)";
}

export function LentTable({ lendings }: { lendings: ActiveLending[] }) {
  const [target, setTarget] = useState<ActiveLending | null>(null);

  if (lendings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        貸し出し中の物品はありません。
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>クラス</TableHead>
              <TableHead>物品名</TableHead>
              <TableHead className="text-right">個数</TableHead>
              <TableHead className="hidden sm:table-cell">開始時間</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lendings.map((l) => (
              <TableRow key={l.id}>
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
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTarget(l)}
                  >
                    返却
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {target && (
        <ReturnDialog
          key={target.id}
          lending={target}
          onClose={() => setTarget(null)}
        />
      )}
    </>
  );
}

function ReturnDialog({
  lending,
  onClose,
}: {
  lending: ActiveLending;
  onClose: () => void;
}) {
  const max = lending.amount;
  const [amount, setAmount] = useState(String(max));
  const [isPending, startTransition] = useTransition();

  function handleReturn() {
    const returnAmount = Number(amount);
    if (!Number.isInteger(returnAmount) || returnAmount < 1) {
      toast.error("返却数は1以上で入力してください。");
      return;
    }
    if (returnAmount > max) {
      toast.error(`貸出中(${max}個)を超えて返却できません。`);
      return;
    }

    startTransition(async () => {
      const t = toast.loading("返却処理中...");
      const res = await partialReturnLending({
        lendingId: lending.id,
        returnAmount,
      });
      toast.dismiss(t);
      if (res.ok) {
        toast.success("返却が完了しました。");
        onClose();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>返却確認</DialogTitle>
          <DialogDescription>
            返却する数量を入力してください。全数返却すると一覧から消えます。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-muted-foreground">クラス</div>
            <div className="col-span-2">{classLabel(lending.class)}</div>
            <div className="text-muted-foreground">物品</div>
            <div className="col-span-2">{itemName(lending)}</div>
            <div className="text-muted-foreground">貸出中</div>
            <div className="col-span-2">{lending.amount} 個</div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="return-amount">返却数</Label>
            <Input
              id="return-amount"
              type="number"
              min={1}
              max={max}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            キャンセル
          </Button>
          <Button onClick={handleReturn} disabled={isPending}>
            返却
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
