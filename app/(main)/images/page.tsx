import CategoryTabs from "@/components/images/category-tabs";
import Gallery from "@/components/images/gallery";
import Pagination from "@/components/images/pagination";
import {
  GALLERY_PAGE_SIZE,
  getCategories,
  getImagesPage,
  getUncategorizedCount,
} from "@/lib/images";
import { requireAdminUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ImagesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  await requireAdminUser();
  const sp = await searchParams;
  const category = sp.category ?? "all";
  const page = Math.max(1, Number(sp.page) || 1);

  const [categories, uncategorizedCount, { images, total }] = await Promise.all([
    getCategories(),
    getUncategorizedCount(),
    getImagesPage(category, page, GALLERY_PAGE_SIZE),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE));

  return (
    <div className="pb-16">
      <h1 className="mb-4 text-lg font-semibold">収集画像</h1>
      <CategoryTabs
        categories={categories}
        uncategorizedCount={uncategorizedCount}
        current={category}
      />
      <Gallery images={images} />
      <Pagination current={page} totalPages={totalPages} category={category} />
    </div>
  );
}
