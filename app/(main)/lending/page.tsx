import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { getActiveLendings } from "@/lib/lending";
import { requireApprovedUser } from "@/lib/session";
import { buttonVariants } from "@/components/ui/button";
import { LentTable } from "@/components/lending/lent-table";

export const dynamic = "force-dynamic";

export default async function LendingPage() {
  await requireApprovedUser();
  const lendings = await getActiveLendings();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">貸し出し中の物品</h1>
        <Link href="/lending/new" className={buttonVariants()}>
          <PlusIcon />
          新規貸し出し
        </Link>
      </div>
      <LentTable lendings={lendings} />
    </div>
  );
}
