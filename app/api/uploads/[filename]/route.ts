import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { contentTypeForFilename, readUpload } from "@/lib/storage";

// 保存名は <uuid>.<ext> 形式。パストラバーサルや想定外の文字を弾く。
const FILENAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.approved) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { filename } = await params;
  if (!FILENAME_PATTERN.test(filename) || filename.includes("..")) {
    return NextResponse.json({ error: "不正なファイル名です" }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await readUpload(filename);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json(
        { error: "画像が見つかりません" },
        { status: 404 },
      );
    }
    throw error;
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentTypeForFilename(filename),
      // 認証付きのため共有キャッシュには載せず、ブラウザ private キャッシュのみ許可
      "Cache-Control": "private, max-age=3600",
    },
  });
}
