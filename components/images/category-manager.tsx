"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  type CategoryFormState,
} from "@/app/lib/image-actions";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string; imageCount: number };

const initialState: CategoryFormState = {};

const inputClass =
  "rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const [state, formAction, pending] = useActionState(
    createCategory,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // 追加成功後に入力をクリアする。
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={formAction} className="flex flex-col gap-1">
        <div className="flex gap-2">
          <input
            name="name"
            placeholder="新しいカテゴリ名"
            maxLength={50}
            className={`flex-1 ${inputClass}`}
          />
          <Button type="submit" disabled={pending}>
            追加
          </Button>
        </div>
        {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      </form>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          カテゴリはまだありません。
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-2 px-3 py-2">
              <form
                action={renameCategory.bind(null, category.id)}
                className="flex flex-1 items-center gap-2"
              >
                <input
                  name="name"
                  defaultValue={category.name}
                  maxLength={50}
                  className={`flex-1 ${inputClass} border-transparent shadow-none hover:border-input`}
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {category.imageCount} 枚
                </span>
                <Button type="submit" variant="outline" size="sm">
                  保存
                </Button>
              </form>
              <form
                action={deleteCategory.bind(null, category.id)}
                onSubmit={(e) => {
                  if (
                    !confirm(
                      `カテゴリ「${category.name}」を削除しますか？画像は「未分類」に移動します。`,
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                <Button type="submit" variant="destructive" size="sm">
                  削除
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
