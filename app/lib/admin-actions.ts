"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdminUser } from "@/lib/session"
import type { ActionResult } from "./actions"

/**
 * 指定ユーザーの承認状態をトグルする(管理者のみ実行可)。
 * 承認を取り消す場合は管理者権限も併せて解除する。
 */
export async function toggleUserApproval(userId: string): Promise<ActionResult> {
  await requireAdminUser()
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { approved: true },
    })
    if (!user) return { ok: false, error: "ユーザーが見つかりません。" }
    const nextApproved = !user.approved
    await prisma.user.update({
      where: { id: userId },
      data: nextApproved
        ? { approved: true }
        : { approved: false, admin: false },
    })
  } catch {
    return { ok: false, error: "更新に失敗しました。" }
  }
  revalidatePath("/admin/users")
  return { ok: true }
}

/**
 * 指定ユーザーの管理者権限をトグルする(管理者のみ実行可)。
 * 管理者に指定する場合は承認済みにもする。
 */
export async function toggleUserAdmin(userId: string): Promise<ActionResult> {
  await requireAdminUser()
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { admin: true },
    })
    if (!user) return { ok: false, error: "ユーザーが見つかりません。" }
    const nextAdmin = !user.admin
    await prisma.user.update({
      where: { id: userId },
      data: nextAdmin ? { admin: true, approved: true } : { admin: false },
    })
  } catch {
    return { ok: false, error: "更新に失敗しました。" }
  }
  revalidatePath("/admin/users")
  return { ok: true }
}
