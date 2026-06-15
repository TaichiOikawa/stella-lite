import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  approved: boolean;
  admin: boolean;
  applied: boolean;
};

/**
 * 現在のセッションユーザーを承認状態(approved/applied)込みで返す。
 * セッションが無ければ null。
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      approved: true,
      admin: true,
      applied: true,
    },
  });
  return user;
}

/**
 * 保護ページ用ガード。
 * 未ログイン→/login、未承認→/pending、承認済みなら user を返す。
 */
export async function requireApprovedUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.approved) redirect("/pending");
  return user;
}

/**
 * 管理者専用ページ用ガード(収集画像 / カテゴリ管理 / ユーザー管理)。
 * 未ログイン→/login、未承認→/pending、承認済みだが管理者でない→/lending。
 */
export async function requireAdminUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.approved) redirect("/pending");
  if (!user.admin) redirect("/lending");
  return user;
}
