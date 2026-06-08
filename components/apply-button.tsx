"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { applyForApproval } from "@/app/lib/actions";
import { Button } from "@/components/ui/button";

export function ApplyButton({ applied }: { applied: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (applied) {
    return (
      <p className="text-sm text-muted-foreground">
        申請を受け付けました。承認をお待ちください。
      </p>
    );
  }

  function handleApply() {
    startTransition(async () => {
      const res = await applyForApproval();
      if (res.ok) {
        toast.success("申請しました。");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button onClick={handleApply} disabled={isPending}>
      申請する
    </Button>
  );
}
