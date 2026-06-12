import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ItemCreateForm } from "@/components/items/item-create-form";
import { requireApprovedUser } from "@/lib/session";

export default async function NewItemPage() {
  await requireApprovedUser();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/items"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label="戻る"
        >
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-xl font-semibold">物品を追加</h1>
      </div>
      <ItemCreateForm />
    </div>
  );
}
