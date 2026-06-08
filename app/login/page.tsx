"use client";

import { Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";

function LoginButton() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/lending";

  return (
    <button
      onClick={() =>
        authClient.signIn.social({
          provider: "line",
          callbackURL: callbackUrl,
        })
      }
      className="rounded-md bg-[#06C755] px-6 py-2 font-medium text-white"
    >
      LINE でログイン
    </button>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-xl font-semibold">物品貸し出し管理</h1>
        <Suspense>
          <LoginButton />
        </Suspense>
      </div>
    </div>
  );
}
