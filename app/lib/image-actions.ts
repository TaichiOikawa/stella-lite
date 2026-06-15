"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import { deleteUpload } from "@/lib/storage";

const nameSchema = z
  .string()
  .trim()
  .min(1, "カテゴリ名を入力してください")
  .max(50, "カテゴリ名は50文字以内で入力してください");

export type CategoryFormState = { error?: string; success?: boolean };

/** 収集画像・カテゴリ関連ページの再描画 */
function revalidate() {
  revalidatePath("/admin/categories");
  revalidatePath("/upload");
  revalidatePath("/images");
}

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdminUser();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.category.findUnique({
    where: { name: parsed.data },
  });
  if (existing) {
    return { error: "同じ名前のカテゴリが既に存在します" };
  }

  await prisma.category.create({ data: { name: parsed.data } });
  revalidate();
  return { success: true };
}

export async function renameCategory(
  id: string,
  formData: FormData,
): Promise<void> {
  await requireAdminUser();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return;
  }
  await prisma.category.update({
    where: { id },
    data: { name: parsed.data },
  });
  revalidate();
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdminUser();
  // Image.categoryId は ON DELETE SET NULL なので画像は「未分類」として残る。
  await prisma.category.delete({ where: { id } });
  revalidate();
}

export async function deleteImage(id: string): Promise<void> {
  await requireAdminUser();
  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) return;
  await deleteUpload(image.filename);
  await prisma.image.delete({ where: { id } });
  revalidate();
}

export async function deleteImages(ids: string[]): Promise<void> {
  await requireAdminUser();
  if (ids.length === 0) return;
  const images = await prisma.image.findMany({
    where: { id: { in: ids } },
    select: { id: true, filename: true },
  });
  await Promise.all(images.map((image) => deleteUpload(image.filename)));
  await prisma.image.deleteMany({
    where: { id: { in: images.map((image) => image.id) } },
  });
  revalidate();
}
