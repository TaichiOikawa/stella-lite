"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import type { ClassRow } from "@/lib/lending";
import { classLabel } from "@/lib/format";
import { updateClass, deleteClass } from "@/app/lib/actions";
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

export function ClassesManager({ classes }: { classes: ClassRow[] }) {
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [deleting, setDeleting] = useState<ClassRow | null>(null);

  if (classes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        クラスが登録されていません。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>クラス</TableHead>
              <TableHead>カラー</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{classLabel(c)}</TableCell>
                <TableCell>
                  {c.color ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-3 rounded-full border"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-muted-foreground">{c.color}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="編集"
                      onClick={() => setEditing(c)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="削除"
                      onClick={() => setDeleting(c)}
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
        <ClassEditDialog
          key={editing.id}
          klass={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteClassDialog klass={deleting} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}

function ClassEditDialog({
  klass,
  onClose,
}: {
  klass: ClassRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [grade, setGrade] = useState(String(klass.grade));
  const [number, setNumber] = useState(String(klass.number));
  const [color, setColor] = useState(klass.color ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const g = Number(grade);
    const n = Number(number);
    if (!Number.isInteger(g) || g < 1) {
      toast.error("学年は1以上で入力してください。");
      return;
    }
    if (!Number.isInteger(n) || n < 1) {
      toast.error("組は1以上で入力してください。");
      return;
    }

    startTransition(async () => {
      const res = await updateClass({
        id: klass.id,
        grade: g,
        number: n,
        color: color.trim() || undefined,
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
          <DialogTitle>クラスを編集</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="grade">学年</Label>
              <Input
                id="grade"
                type="number"
                min={1}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="number">組</Label>
              <Input
                id="number"
                type="number"
                min={1}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="color">カラー(任意)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color || "#000000"}
                onChange={(e) => setColor(e.target.value)}
                className="size-8 cursor-pointer rounded border bg-transparent"
                aria-label="カラー選択"
              />
              <Input
                id="color"
                value={color}
                placeholder="#000000 (空欄可)"
                onChange={(e) => setColor(e.target.value)}
              />
              {color && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setColor("")}
                >
                  クリア
                </Button>
              )}
            </div>
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

function DeleteClassDialog({
  klass,
  onClose,
}: {
  klass: ClassRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteClass({ id: klass.id });
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
          <AlertDialogTitle>
            「{classLabel(klass)}」を削除しますか？
          </AlertDialogTitle>
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
