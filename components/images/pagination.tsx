import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function Pagination({
  current,
  totalPages,
  category,
}: {
  current: number;
  totalPages: number;
  category: string;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/images?${qs}` : "/images";
  };

  const linkClass = buttonVariants({ variant: "outline", size: "sm" });
  const disabledClass = cn(linkClass, "pointer-events-none opacity-50");

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      {current > 1 ? (
        <Link href={hrefFor(current - 1)} className={linkClass}>
          <ChevronLeft className="size-4" />
          前へ
        </Link>
      ) : (
        <span className={disabledClass}>
          <ChevronLeft className="size-4" />
          前へ
        </span>
      )}

      <span className="text-sm text-muted-foreground">
        {current} / {totalPages}
      </span>

      {current < totalPages ? (
        <Link href={hrefFor(current + 1)} className={linkClass}>
          次へ
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={disabledClass}>
          次へ
          <ChevronRight className="size-4" />
        </span>
      )}
    </div>
  );
}
