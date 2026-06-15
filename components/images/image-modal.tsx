"use client";

import { Download, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteImage } from "@/app/lib/image-actions";
import type { GalleryImage } from "@/lib/images";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ImageModal({
  image,
  onClose,
}: {
  image: GalleryImage;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("この画像を削除しますか？")) return;
    startTransition(async () => {
      await deleteImage(image.id);
      router.refresh();
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="truncate text-sm font-medium">
            {image.categoryName ?? "未分類"}
          </span>
          <div className="flex items-center gap-1">
            <a
              href={image.url}
              download={image.originalName}
              title="ダウンロード"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
            >
              <Download className="size-5" />
            </a>
            <Button
              variant="ghost"
              size="icon"
              title="削除"
              disabled={pending}
              onClick={handleDelete}
            >
              <Trash2 className="size-5 text-red-500" />
            </Button>
            <Button variant="ghost" size="icon" title="閉じる" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-auto bg-black/5 p-2 dark:bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.originalName}
            className="max-h-[75vh] w-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}
