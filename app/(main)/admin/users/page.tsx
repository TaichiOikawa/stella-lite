import { prisma } from "@/lib/prisma"
import { UsersTable } from "@/components/admin/users-table"
import { requireApprovedUser } from "@/lib/session"

export default async function AdminUsersPage() {
  await requireApprovedUser()
  const users = await prisma.user.findMany({
    orderBy: [{ approved: "asc" }, { applied: "desc" }, { createdAt: "asc" }],
  })
  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">ユーザー管理</h1>
      <UsersTable users={users} />
    </div>
  )
}
