"use client";

import { toggleUserApproval } from "@/app/lib/admin-actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import Image from "next/image";
import { useTransition } from "react";
import { toast } from "sonner";

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  approved: boolean;
  applied: boolean;
  createdAt: Date;
};

function statusLabel(user: User) {
  if (user.approved) return "承認済み";
  if (user.applied) return "申請中";
  return "未申請";
}

export function UsersTable({ users }: { users: User[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名前</TableHead>
          <TableHead className="hidden sm:table-cell">登録日時</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              {user.image && (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="mr-2 inline-block rounded-full"
                />
              )}
              {user.name}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{formatDateTime(user.createdAt)}</TableCell>
            <TableCell>
              <span
                className={
                  user.approved
                    ? "text-foreground"
                    : user.applied
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                }
              >
                {statusLabel(user)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant={user.approved ? "outline" : "default"}
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await toggleUserApproval(user.id);
                    if (!result.ok) toast.error(result.error);
                  })
                }
              >
                {user.approved ? "承認取り消し" : "承認する"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
