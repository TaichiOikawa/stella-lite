import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { getClasses, getItemsWithRemaining } from "@/lib/lending";
import { requireApprovedUser } from "@/lib/session";
import { buttonVariants } from "@/components/ui/button";
import { ItemLentForm } from "@/components/lending/item-lent-form";

export const dynamic = "force-dynamic";

export default async function NewLendingPage() {
  await requireApprovedUser();
  const [classes, items] = await Promise.all([
    getClasses(),
    getItemsWithRemaining(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/lending"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label="戻る"
        >
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-xl font-semibold">新規貸し出し</h1>
      </div>
      <ItemLentForm classes={classes} items={items} />
    </div>
  );
}
