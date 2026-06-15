import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

function extensionFor(file: File): string {
  const fromMime = MIME_EXTENSIONS[file.type];
  if (fromMime) return fromMime;
  const fromName = path.extname(file.name).toLowerCase();
  return fromName || ".bin";
}

/**
 * アップロードされた File を public/uploads に保存し、保存名と公開 URL を返す。
 */
export async function saveUpload(
  file: File,
): Promise<{ filename: string; url: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}${extensionFor(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { filename, url: `/uploads/${filename}` };
}

/** 保存済みのアップロードを Buffer として読み込む。 */
export async function readUpload(filename: string): Promise<Buffer> {
  return readFile(path.join(UPLOAD_DIR, filename));
}

/**
 * 保存済みのアップロードをディスクから削除する。
 * 既に存在しないファイルは無視し、DB レコード削除がファイル欠損で失敗しないようにする。
 */
export async function deleteUpload(filename: string): Promise<void> {
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
