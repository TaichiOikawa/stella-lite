import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ClassCreateForm } from "@/components/classes/class-create-form";
import { requireApprovedUser } from "@/lib/session";

export default async function NewClassPage() {
  await requireApprovedUser();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/classes"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label="戻る"
        >
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-xl font-semibold">クラスを追加</h1>
      </div>
      <ClassCreateForm />
    </div>
  );
}
