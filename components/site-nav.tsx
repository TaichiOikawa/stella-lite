"use client";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { LogOutIcon, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };

type System = {
  key: string;
  label: string;
  /** 系統トップへのリンク先 */
  href: string;
  /** この系統に属するパスのプレフィックス */
  prefixes: string[];
  links: NavLink[];
};

function buildSystems(isAdmin: boolean): System[] {
  return [
    {
      key: "lending",
      label: "物品貸し出し管理",
      href: "/lending",
      prefixes: ["/lending", "/items", "/classes"],
      links: [
        { href: "/lending", label: "貸し出し" },
        { href: "/items", label: "物品管理" },
        { href: "/classes", label: "クラス管理" },
      ],
    },
    {
      key: "images",
      label: "画像収集システム",
      href: "/upload",
      prefixes: ["/upload", "/images", "/admin/categories"],
      links: [
        { href: "/upload", label: "アップロード" },
        ...(isAdmin
          ? [
              { href: "/images", label: "収集画像" },
              { href: "/admin/categories", label: "カテゴリ管理" },
            ]
          : []),
      ],
    },
  ];
}

function matchesPath(pathname: string, target: string): boolean {
  return pathname === target || pathname.startsWith(target + "/");
}

export function SiteNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const systems = buildSystems(isAdmin);
  // どの系統にも属さないページ(例: ユーザー管理)では系統を選択状態にしない。
  const activeSystem =
    systems.find((s) => s.prefixes.some((p) => matchesPath(pathname, p))) ??
    null;

  function signOut() {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto w-full max-w-5xl px-4">
        {/* 上段: 系統切り替え + ユーザー */}
        <div className="flex items-center justify-between gap-2 py-3">
          <nav className="flex items-center gap-1 overflow-x-auto flex-wrap">
            {systems.map((system) => {
              const active = system.key === activeSystem?.key;
              return (
                <Link
                  key={system.key}
                  href={system.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {system.label}
                </Link>
              );
            })}
          </nav>

          {/* ユーザー管理(管理者のみ) + ユーザー情報 + サインアウト */}
          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin/users"
                aria-label="ユーザー管理"
                title="ユーザー管理"
                aria-current={
                  matchesPath(pathname, "/admin/users") ? "page" : undefined
                }
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  matchesPath(pathname, "/admin/users")
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Users size={18} />
              </Link>
            )}
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

        {/* 下段: 選択中の系統のサブナビ (横スクロール)。系統未選択時は非表示。 */}
        {activeSystem && (
          <nav className="flex gap-1 overflow-x-auto border-t pt-2 pb-2">
            {activeSystem.links.map((link) => {
              const active = matchesPath(pathname, link.href);
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
        )}
      </div>
    </header>
  );
}
