import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { saveUpload } from "@/lib/storage";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB per file

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.approved) {
    return NextResponse.json(
      { success: false, error: "権限がありません" },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const categoryId = formData.get("categoryId");
  const files = formData
    .getAll("file")
    .filter((entry): entry is File => entry instanceof File);

  if (typeof categoryId !== "string" || categoryId.length === 0) {
    return NextResponse.json(
      { success: false, error: "カテゴリを選択してください" },
      { status: 400 },
    );
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return NextResponse.json(
      { success: false, error: "カテゴリが見つかりません" },
      { status: 400 },
    );
  }

  if (files.length === 0) {
    return NextResponse.json(
      { success: false, error: "画像が選択されていません" },
      { status: 400 },
    );
  }

  const results: { name: string; success: boolean; error?: string }[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      results.push({
        name: file.name,
        success: false,
        error: "画像ファイルではありません",
      });
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      results.push({
        name: file.name,
        success: false,
        error: "ファイルサイズが大きすぎます",
      });
      continue;
    }

    try {
      const { filename, url } = await saveUpload(file);
      await prisma.image.create({
        data: {
          filename,
          originalName: file.name,
          url,
          categoryId: category.id,
        },
      });
      results.push({ name: file.name, success: true });
    } catch (error) {
      console.error("Failed to store upload", file.name, error);
      results.push({
        name: file.name,
        success: false,
        error: "保存に失敗しました",
      });
    }
  }

  const created = results.filter((r) => r.success).length;
  return NextResponse.json({ success: created > 0, created, results });
}
