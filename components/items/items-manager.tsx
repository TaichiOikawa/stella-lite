"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import type { ItemWithRemaining } from "@/lib/lending";
import { updateItem, deleteItem } from "@/app/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ItemsManager({ items }: { items: ItemWithRemaining[] }) {
  const [editing, setEditing] = useState<ItemWithRemaining | null>(null);
  const [deleting, setDeleting] = useState<ItemWithRemaining | null>(null);

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        物品が登録されていません。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>物品名</TableHead>
              <TableHead className="text-right">在庫数</TableHead>
              <TableHead className="text-right">残数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {i.totalQuantity}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {i.remaining}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="編集"
                      onClick={() => setEditing(i)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="削除"
                      onClick={() => setDeleting(i)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <ItemEditDialog
          key={editing.id}
          item={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteItemDialog item={deleting} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}

function ItemEditDialog({
  item,
  onClose,
}: {
  item: ItemWithRemaining;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [totalQuantity, setTotalQuantity] = useState(String(item.totalQuantity));
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const qty = Number(totalQuantity);
    if (!name.trim()) {
      toast.error("物品名を入力してください。");
      return;
    }
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error("在庫数は1以上で入力してください。");
      return;
    }

    startTransition(async () => {
      const res = await updateItem({
        id: item.id,
        name: name.trim(),
        totalQuantity: qty,
      });
      if (res.ok) {
        toast.success("更新しました。");
        onClose();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>物品を編集</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="item-name">物品名</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="item-qty">在庫数</Label>
            <Input
              id="item-qty"
              type="number"
              min={1}
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteItemDialog({
  item,
  onClose,
}: {
  item: ItemWithRemaining;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteItem({ id: item.id });
      if (res.ok) {
        toast.success("削除しました。");
        onClose();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>「{item.name}」を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            削除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
