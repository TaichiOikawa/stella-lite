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
