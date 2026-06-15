import Link from "next/link";
import { Button } from "@/components/ui/button";
import UploadForm from "@/components/images/upload-form";
import { getCategories } from "@/lib/images";
import { requireApprovedUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const user = await requireApprovedUser();
  const categories = await getCategories();

  if (categories.length === 0) {
    return (
      <div className="mx-auto mt-10 max-w-md px-4 text-center">
        <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
          <p>カテゴリがまだありません。</p>
          {user.admin ? (
            <>
              <p className="mt-1">まずカテゴリ管理でカテゴリを追加してください。</p>
              <Link href="/admin/categories" className="mt-4 inline-block">
                <Button variant="outline">カテゴリ管理へ</Button>
              </Link>
            </>
          ) : (
            <p className="mt-1">管理者にカテゴリの追加を依頼してください。</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <UploadForm
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
