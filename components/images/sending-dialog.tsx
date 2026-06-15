"use client";

import { Button } from "@/components/ui/button";

export type SendingItem = { filename: string; isSuccess: boolean | null };

export default function SendingDialog({
  open,
  sendingList,
  onClose,
}: {
  open: boolean;
  sendingList: SendingItem[];
  onClose: () => void;
}) {
  if (!open) return null;

  const done = sendingList.filter((item) => item.isSuccess !== null).length;
  const total = sendingList.length;
  const failed = sendingList.filter((item) => item.isSuccess === false).length;
  const allDone = total > 0 && done === total;
  const progress = total === 0 ? 0 : (done / total) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">送信中</h2>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary/20">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {total > 0 && (
            <p>
              {allDone ? "処理が終了しました" : `${done} / ${total} 送信中...`}
            </p>
          )}
          {failed > 0 && (
            <p className="text-red-500">送信に失敗しました: {failed} 件</p>
          )}
        </div>

        {allDone && (
          <Button className="mt-4 w-full" variant="secondary" onClick={onClose}>
            閉じる
          </Button>
        )}
      </div>
    </div>
  );
}
