"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createItem } from "@/app/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ItemCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("1");
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
      const res = await createItem({ name: name.trim(), totalQuantity: qty });
      if (res.ok) {
        toast.success("追加しました。");
        router.push("/items");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
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
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/items")}
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
