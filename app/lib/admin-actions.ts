"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "./actions"

export async function toggleUserApproval(userId: string): Promise<ActionResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { approved: true },
    })
    if (!user) return { ok: false, error: "ユーザーが見つかりません。" }
    await prisma.user.update({
      where: { id: userId },
      data: { approved: !user.approved },
    })
  } catch {
    return { ok: false, error: "更新に失敗しました。" }
  }
  revalidatePath("/admin/users")
  return { ok: true }
}
