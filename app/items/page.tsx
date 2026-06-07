import { PlusIcon } from "lucide-react";
import Link from "next/link";

import { ItemsManager } from "@/components/items/items-manager";
import { buttonVariants } from "@/components/ui/button";
import { getItemsWithRemaining } from "@/lib/lending";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await getItemsWithRemaining();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">物品管理</h1>
        <Link href="/items/new" className={buttonVariants()}>
          <PlusIcon />
          新規登録
        </Link>
      </div>
      <ItemsManager items={items} />
    </div>
  );
}
