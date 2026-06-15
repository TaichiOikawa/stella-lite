"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import SendingDialog, { type SendingItem } from "./sending-dialog";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string };

const MAX_FILES = 100;

export default function UploadForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendingList, setSendingList] = useState<SendingItem[]>([]);

  // 選択が変わるたびに object-URL プレビューを生成し、不要になったら破棄する。
  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const merged = [...files, ...Array.from(incoming)].filter(
      (file, index, self) =>
        file.type.startsWith("image/") &&
        self.findIndex((f) => f.name === file.name) === index,
    );
    if (merged.length > MAX_FILES) {
      toast.error(`画像は最大 ${MAX_FILES} 件までです。`);
      merged.length = MAX_FILES;
    }
    setFiles(merged);
  };

  const removeAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSend = async () => {
    if (files.length === 0 || !categoryId) return;
    setDialogOpen(true);
    const initial: SendingItem[] = files.map((file) => ({
      filename: file.name,
      isSuccess: null,
    }));
    setSendingList(initial);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let success = false;
      try {
        const formData = new FormData();
        formData.set("categoryId", categoryId);
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as { created?: number };
        success = res.ok && (data.created ?? 0) > 0;
      } catch (e) {
        console.error(e);
        success = false;
      }
      setSendingList((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, isSuccess: success } : item,
        ),
      );
    }

    router.refresh();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    const failedNames = sendingList
      .filter((item) => item.isSuccess === false)
      .map((item) => item.filename);
    // 失敗したファイルだけ選択状態に残し、再送できるようにする。
    setFiles((prev) => prev.filter((f) => failedNames.includes(f.name)));
    if (failedNames.length === 0 && inputRef.current) {
      inputRef.current.value = "";
    }
    setSendingList([]);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-5 px-4 pt-2 pb-40">
        <div className="flex w-full max-w-xs flex-col gap-1 text-sm">
          <span className="font-medium">カテゴリ</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          className="text-lg"
          onClick={() => inputRef.current?.click()}
          size="lg"
          variant="outline"
        >
          ファイルを選択
        </Button>
        <input
          accept="image/*"
          className="hidden"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          ref={inputRef}
          type="file"
        />

        {files.length === 0 && <p>ファイルを選択してください</p>}

        <div className="mx-auto grid w-fit grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {files.map((file, index) => (
            <div
              className="relative flex flex-col items-center space-y-2 rounded border bg-card p-2"
              key={file.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={file.name}
                className="size-35 rounded border object-cover"
                src={previews[index]}
              />
              <span className="w-28 truncate text-center text-xs">
                {file.name}
              </span>
              <Button
                className="mx-auto px-4 text-sm"
                onClick={() => removeAt(index)}
                size="sm"
                variant="destructive"
              >
                削除
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 flex w-dvw -translate-x-1/2 justify-center gap-3 px-6 sm:px-20">
        <Button
          className="h-12 w-full max-w-60 text-lg"
          disabled={files.length === 0 || !categoryId}
          onClick={handleSend}
        >
          送信する ({files.length} 件)
        </Button>
        <Button
          className="h-12 w-12"
          disabled={files.length === 0}
          onClick={clearAll}
          variant="outline"
        >
          <Trash2 className="size-6 text-red-500" />
        </Button>
      </div>

      <SendingDialog
        open={dialogOpen}
        sendingList={sendingList}
        onClose={handleDialogClose}
      />
    </>
  );
}
