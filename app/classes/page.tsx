import { PlusIcon } from "lucide-react";
import Link from "next/link";

import { ClassesManager } from "@/components/classes/classes-manager";
import { buttonVariants } from "@/components/ui/button";
import { getClasses } from "@/lib/lending";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const classes = await getClasses();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">クラス管理</h1>
        <Link href="/classes/new" className={buttonVariants()}>
          <PlusIcon />
          新規登録
        </Link>
      </div>
      <ClassesManager classes={classes} />
    </div>
  );
}
