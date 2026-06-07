"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClass } from "@/app/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ClassCreateForm() {
  const router = useRouter();
  const [grade, setGrade] = useState("1");
  const [number, setNumber] = useState("1");
  const [color, setColor] = useState("");
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
      const res = await createClass({
        grade: g,
        number: n,
        color: color.trim() || undefined,
      });
      if (res.ok) {
        toast.success("追加しました。");
        router.push("/classes");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
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
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/classes")}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
