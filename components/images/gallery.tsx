"use client";

import { Download, ListChecks, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteImages } from "@/app/lib/image-actions";
import type { GalleryImage } from "@/lib/images";
import { Button, buttonVariants } from "@/components/ui/button";
import ImageModal from "./image-modal";

export default function Gallery({ images }: { images: GalleryImage[] }) {
  const router = useRouter();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalImage, setModalImage] = useState<GalleryImage | null>(null);
  const [zipping, setZipping] = useState(false);
  const [pending, startTransition] = useTransition();

  if (images.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        まだ画像がありません。
      </p>
    );
  }

  const allSelected = selected.size === images.length;
  const barVisible = selectMode || selected.size > 0;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(images.map((i) => i.id)));
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const handleTileClick = (image: GalleryImage) => {
    if (selectMode) toggleSelect(image.id);
    else setModalImage(image);
  };

  const handleBatchDelete = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`${ids.length} 件の画像を削除しますか？`)) return;
    startTransition(async () => {
      await deleteImages(ids);
      router.refresh();
      setSelected(new Set());
    });
  };

  const handleZip = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setZipping(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        toast.error("ダウンロードに失敗しました");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("ダウンロードに失敗しました");
    } finally {
      setZipping(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        {selectMode ? (
          <Button variant="secondary" size="sm" onClick={exitSelectMode}>
            選択解除
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setSelectMode(true)}>
            <ListChecks className="size-4" />
            選択
          </Button>
        )}
      </div>

      <div
        className={`columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4 ${
          barVisible ? "pb-24" : ""
        }`}
      >
        {images.map((image) => {
          const isSelected = selected.has(image.id);
          return (
            <figure
              key={image.id}
              onClick={() => handleTileClick(image)}
              className={`group relative block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-lg border bg-card ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.originalName}
                loading="lazy"
                className="block w-full"
              />

              {/* チェックボックス(左上): 選択モードでは常時表示、通常はホバー時のみ */}
              <div
                className={`absolute left-2 top-2 transition-opacity ${
                  selectMode
                    ? "pointer-events-none opacity-100"
                    : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly={selectMode}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleSelect(image.id)}
                  className="size-5 cursor-pointer accent-primary rounded bg-white/80 shadow"
                />
              </div>

              {/* 操作アイコン(右上): ホバー時のみ、選択モードでは非表示 */}
              {!selectMode && (
                <div className="pointer-events-none absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  <a
                    href={image.url}
                    download={image.originalName}
                    title="ダウンロード"
                    onClick={(e) => e.stopPropagation()}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "icon",
                    })}
                  >
                    <Download className="size-4" />
                  </a>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    title="削除"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!confirm("この画像を削除しますか？")) return;
                      startTransition(async () => {
                        await deleteImages([image.id]);
                        router.refresh();
                      });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}

              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {image.categoryName ?? "未分類"}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {barVisible && (
        <div className="fixed bottom-6 left-1/2 flex w-dvw -translate-x-1/2 items-center justify-center gap-2 px-4">
          <div className="flex items-center gap-2 rounded-full border bg-background/95 px-4 py-2 shadow-lg backdrop-blur">
            <span className="text-sm whitespace-nowrap">
              {selected.size} 件選択
            </span>
            <Button variant="ghost" size="sm" onClick={toggleAll}>
              {allSelected ? "解除" : "全選択"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZip}
              disabled={selected.size === 0 || zipping}
            >
              <Download className="size-4" />
              {zipping ? "作成中..." : "ZIP"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={selected.size === 0 || pending}
            >
              <Trash2 className="size-4" />
              削除
            </Button>
          </div>
        </div>
      )}

      {modalImage && (
        <ImageModal image={modalImage} onClose={() => setModalImage(null)} />
      )}
    </>
  );
}
