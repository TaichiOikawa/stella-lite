import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CategoryWithCount } from "@/lib/images";

export default function CategoryTabs({
  categories,
  uncategorizedCount,
  current,
}: {
  categories: CategoryWithCount[];
  uncategorizedCount: number;
  current: string;
}) {
  const tabs = [
    { key: "all", label: "全て" },
    ...categories.map((c) => ({
      key: c.id,
      label: `${c.name} (${c.imageCount})`,
    })),
    ...(uncategorizedCount > 0
      ? [{ key: "uncategorized", label: `未分類 (${uncategorizedCount})` }]
      : []),
  ];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = tab.key === current;
        const href =
          tab.key === "all"
            ? "/images"
            : `/images?category=${encodeURIComponent(tab.key)}`;
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
