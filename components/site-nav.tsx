"use client";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { LogOutIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/lending", label: "貸し出し" },
  { href: "/items", label: "物品管理" },
  { href: "/classes", label: "クラス管理" },
  { href: "/admin/users", label: "ユーザー管理" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  function signOut() {
    authClient.signOut({
      fetchOptions: { onSuccess: () => { window.location.href = "/login"; } },
    });
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto w-full max-w-5xl px-4">
        {/* タイトル行 + ユーザー */}
        <div className="flex items-center justify-between py-3">
          <Link href="/lending" className="shrink-0 font-semibold">
            物品貸し出し管理
          </Link>

          {/* デスクトップナビ */}
          <div className="mx-4 hidden items-center gap-1 sm:flex">
            {links.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ユーザー情報 + サインアウト */}
          <div className="flex shrink-0 items-center gap-2">
            {session?.user && (
              <>
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                )}
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {session.user.name}
                </span>
              </>
            )}
            <button
              onClick={signOut}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="サインアウト"
            >
              <LogOutIcon size={18} />
            </button>
          </div>
        </div>

        {/* モバイルナビ (横スクロール) */}
        <nav className="flex gap-1 overflow-x-auto pb-2 sm:hidden">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
