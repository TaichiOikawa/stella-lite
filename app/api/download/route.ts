import JSZip from "jszip";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { readUpload } from "@/lib/storage";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.admin) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  let ids: unknown;
  try {
    ({ ids } = (await request.json()) as { ids?: unknown });
  } catch {
    ids = undefined;
  }

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json(
      { error: "画像が指定されていません" },
      { status: 400 },
    );
  }
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "画像が選択されていません" },
      { status: 400 },
    );
  }

  const images = await prisma.image.findMany({
    where: { id: { in: ids as string[] } },
    select: { filename: true, originalName: true },
  });
  if (images.length === 0) {
    return NextResponse.json({ error: "画像が見つかりません" }, { status: 404 });
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const image of images) {
    try {
      const buffer = await readUpload(image.filename);
      zip.file(uniqueName(image.originalName, usedNames), buffer);
    } catch (error) {
      console.error("Failed to read upload for zip", image.filename, error);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="images.zip"',
    },
  });
}

/** zip 内のエントリ名が重複しないよう、拡張子の前に " (n)" を付けて一意化する。 */
function uniqueName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dot = name.lastIndexOf(".");
  const base = dot === -1 ? name : name.slice(0, dot);
  const ext = dot === -1 ? "" : name.slice(dot);
  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;
  while (used.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${ext}`;
  }
  used.add(candidate);
  return candidate;
}
