import CategoryManager from "@/components/images/category-manager";
import { getCategories } from "@/lib/images";
import { requireAdminUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdminUser();
  const categories = await getCategories();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">カテゴリ管理</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
