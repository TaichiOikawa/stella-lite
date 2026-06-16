import { prisma } from "@/lib/prisma";

export type CategoryWithCount = {
  id: string;
  name: string;
  imageCount: number;
};

/** 全カテゴリを表示順(order)で、画像枚数込みで返す。 */
export async function getCategories(): Promise<CategoryWithCount[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { images: true } } },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    imageCount: c._count.images,
  }));
}

export type GalleryImage = {
  id: string;
  url: string;
  originalName: string;
  categoryName: string | null;
};

export const GALLERY_PAGE_SIZE = 30;

export type GalleryPage = { images: GalleryImage[]; total: number };

function toGalleryImage(image: {
  id: string;
  url: string;
  originalName: string;
  category: { name: string } | null;
}): GalleryImage {
  return {
    id: image.id,
    url: image.url,
    originalName: image.originalName,
    categoryName: image.category?.name ?? null,
  };
}

/**
 * ギャラリー用の1ページ分の画像を新しい順で返す。
 * `category` はカテゴリ id、`"uncategorized"`、または `"all"`。
 */
export async function getImagesPage(
  category: string,
  page: number,
  pageSize: number = GALLERY_PAGE_SIZE,
): Promise<GalleryPage> {
  const where =
    category === "all"
      ? {}
      : category === "uncategorized"
        ? { categoryId: null }
        : { categoryId: category };

  const [total, images] = await Promise.all([
    prisma.image.count({ where }),
    prisma.image.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: { select: { name: true } } },
    }),
  ]);

  return { total, images: images.map(toGalleryImage) };
}

/** カテゴリが削除された画像(「未分類」タブに表示)の枚数。 */
export async function getUncategorizedCount(): Promise<number> {
  return prisma.image.count({ where: { categoryId: null } });
}
