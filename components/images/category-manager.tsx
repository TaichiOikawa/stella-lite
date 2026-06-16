"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  reorderCategories,
  type CategoryFormState,
} from "@/app/lib/image-actions";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string; imageCount: number };

const initialState: CategoryFormState = {};

const inputClass =
  "rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** 並び替え可能なカテゴリ1行。grip ハンドルのみドラッグ操作を受け付ける。 */
function SortableRow({ category }: { category: Category }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 bg-background px-3 py-2 ${
        isDragging ? "relative z-10 opacity-80 shadow" : ""
      }`}
    >
      <button
        type="button"
        aria-label={`${category.name} を並び替え`}
        className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
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
  );
}

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

  // 並び替え用のローカル順序。サーバーから新しい一覧が来たら同期する。
  const [items, setItems] = useState(categories);
  const [prevCategories, setPrevCategories] = useState(categories);
  if (categories !== prevCategories) {
    setPrevCategories(categories);
    setItems(categories);
  }

  // 追加成功後に入力をクリアする。
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  // タッチ端末でもドラッグできるよう PointerSensor に加え TouchSensor を使う。
  // ハンドルを長押し(250ms)してからドラッグ開始することで、スクロールと区別する。
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((c) => c.id === active.id);
    const newIndex = items.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const prev = items;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next); // 楽観的に並びを反映する。
    // サーバーへ保存。失敗したら元の並びへ戻す。
    reorderCategories(next.map((c) => c.id)).catch(() => {
      setItems(prev);
      toast.error("並び順の保存に失敗しました");
    });
  };

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

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          カテゴリはまだありません。
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col divide-y divide-border rounded-lg border">
              {items.map((category) => (
                <SortableRow key={category.id} category={category} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
