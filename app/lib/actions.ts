"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** ログイン中の本人が承認申請する。userId はセッションから取得する。 */
export async function applyForApproval(): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "ログインが必要です。" };
  if (user.approved) return { ok: true };
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { applied: true },
    });
  } catch {
    return { ok: false, error: "申請に失敗しました。" };
  }
  revalidatePath("/pending");
  revalidatePath("/admin/users");
  return { ok: true };
}

/** 貸し出し・物品ページの再描画 */
function revalidateLending() {
  revalidatePath("/lending");
  revalidatePath("/lending/new");
  revalidatePath("/items");
}

// ---------------------------------------------------------------------------
// 貸し出し
// ---------------------------------------------------------------------------

const createLendingSchema = z.object({
  classId: z.string().min(1, "クラスを選択してください。"),
  itemId: z.string().nullable(),
  customItemName: z.string().optional(),
  amount: z.number().int().positive("数量は1以上で入力してください。"),
});

export async function createLending(
  input: z.infer<typeof createLendingSchema>,
): Promise<ActionResult> {
  const parsed = createLendingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "入力が不正です。",
    };
  }
  const { classId, itemId, customItemName, amount } = parsed.data;

  if (!itemId && !customItemName?.trim()) {
    return { ok: false, error: "物品名を入力してください。" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // クラスの存在確認
      const klass = await tx.class.findUnique({ where: { id: classId } });
      if (!klass) throw new Error("クラスが見つかりません。");

      // カタログ物品の場合は残数を再計算して検証(サーバ側の信頼できる検証)
      if (itemId) {
        const item = await tx.item.findUnique({ where: { id: itemId } });
        if (!item) throw new Error("物品が見つかりません。");
        const agg = await tx.lending.aggregate({
          where: { itemId, endTime: null },
          _sum: { amount: true },
        });
        const remaining = item.totalQuantity - (agg._sum.amount ?? 0);
        if (amount > remaining) {
          throw new Error(`残数(${remaining}個)を超えています。`);
        }
      }

      await tx.lending.create({
        data: {
          classId,
          itemId: itemId ?? null,
          customItemName: itemId ? null : customItemName?.trim(),
          amount,
        },
      });
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "貸し出しに失敗しました。",
    };
  }

  revalidateLending();
  return { ok: true };
}

const returnLendingSchema = z.object({ lendingId: z.string().min(1) });

/** 全返却: endTime を設定して貸出を完了する */
export async function returnLending(
  input: z.infer<typeof returnLendingSchema>,
): Promise<ActionResult> {
  const parsed = returnLendingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力が不正です。" };

  try {
    const lending = await prisma.lending.findUnique({
      where: { id: parsed.data.lendingId },
    });
    if (!lending || lending.endTime) {
      return { ok: false, error: "対象の貸し出しが見つかりません。" };
    }
    await prisma.lending.update({
      where: { id: lending.id },
      data: { endTime: new Date() },
    });
  } catch {
    return { ok: false, error: "返却に失敗しました。" };
  }

  revalidateLending();
  return { ok: true };
}

const partialReturnSchema = z.object({
  lendingId: z.string().min(1),
  returnAmount: z.number().int().positive("返却数は1以上で入力してください。"),
});

/** 部分返却: 返却数だけ amount を減らす。0になる場合は全返却として endTime を設定 */
export async function partialReturnLending(
  input: z.infer<typeof partialReturnSchema>,
): Promise<ActionResult> {
  const parsed = partialReturnSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "入力が不正です。",
    };
  }
  const { lendingId, returnAmount } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const lending = await tx.lending.findUnique({ where: { id: lendingId } });
      if (!lending || lending.endTime) {
        throw new Error("対象の貸し出しが見つかりません。");
      }
      if (returnAmount > lending.amount) {
        throw new Error(`貸出中(${lending.amount}個)を超えて返却できません。`);
      }
      if (returnAmount >= lending.amount) {
        await tx.lending.update({
          where: { id: lendingId },
          data: { endTime: new Date() },
        });
      } else {
        await tx.lending.update({
          where: { id: lendingId },
          data: { amount: lending.amount - returnAmount },
        });
      }
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "返却に失敗しました。",
    };
  }

  revalidateLending();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// 物品管理
// ---------------------------------------------------------------------------

const itemSchema = z.object({
  name: z.string().trim().min(1, "物品名を入力してください。"),
  totalQuantity: z.number().int().positive("在庫数は1以上で入力してください。"),
});

export async function createItem(
  input: z.infer<typeof itemSchema>,
): Promise<ActionResult> {
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "入力が不正です。",
    };
  }
  try {
    await prisma.item.create({ data: parsed.data });
  } catch (e) {
    if (isUniqueError(e)) {
      return { ok: false, error: "同じ名前の物品が既に登録されています。" };
    }
    return { ok: false, error: "物品の追加に失敗しました。" };
  }
  revalidateLending();
  return { ok: true };
}

const updateItemSchema = itemSchema.extend({ id: z.string().min(1) });

export async function updateItem(
  input: z.infer<typeof updateItemSchema>,
): Promise<ActionResult> {
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "入力が不正です。",
    };
  }
  const { id, name, totalQuantity } = parsed.data;
  try {
    await prisma.item.update({ where: { id }, data: { name, totalQuantity } });
  } catch (e) {
    if (isUniqueError(e)) {
      return { ok: false, error: "同じ名前の物品が既に登録されています。" };
    }
    return { ok: false, error: "物品の更新に失敗しました。" };
  }
  revalidateLending();
  return { ok: true };
}

export async function deleteItem(input: { id: string }): Promise<ActionResult> {
  if (!input?.id) return { ok: false, error: "入力が不正です。" };
  try {
    const count = await prisma.lending.count({ where: { itemId: input.id } });
    if (count > 0) {
      return {
        ok: false,
        error: "この物品には貸し出し履歴があるため削除できません。",
      };
    }
    await prisma.item.delete({ where: { id: input.id } });
  } catch {
    return { ok: false, error: "物品の削除に失敗しました。" };
  }
  revalidateLending();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// クラス管理
// ---------------------------------------------------------------------------

const classSchema = z.object({
  grade: z.number().int().positive("学年を入力してください。"),
  number: z.number().int().positive("組を入力してください。"),
  color: z.string().trim().optional(),
});

export async function createClass(
  input: z.infer<typeof classSchema>,
): Promise<ActionResult> {
  const parsed = classSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "入力が不正です。",
    };
  }
  const { grade, number, color } = parsed.data;
  try {
    await prisma.class.create({
      data: { grade, number, color: color || null },
    });
  } catch (e) {
    if (isUniqueError(e)) {
      return { ok: false, error: "同じ学年・組のクラスが既に存在します。" };
    }
    return { ok: false, error: "クラスの追加に失敗しました。" };
  }
  revalidateLending();
  return { ok: true };
}

const updateClassSchema = classSchema.extend({ id: z.string().min(1) });

export async function updateClass(
  input: z.infer<typeof updateClassSchema>,
): Promise<ActionResult> {
  const parsed = updateClassSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "入力が不正です。",
    };
  }
  const { id, grade, number, color } = parsed.data;
  try {
    await prisma.class.update({
      where: { id },
      data: { grade, number, color: color || null },
    });
  } catch (e) {
    if (isUniqueError(e)) {
      return { ok: false, error: "同じ学年・組のクラスが既に存在します。" };
    }
    return { ok: false, error: "クラスの更新に失敗しました。" };
  }
  revalidateLending();
  return { ok: true };
}

export async function deleteClass(input: {
  id: string;
}): Promise<ActionResult> {
  if (!input?.id) return { ok: false, error: "入力が不正です。" };
  try {
    const count = await prisma.lending.count({ where: { classId: input.id } });
    if (count > 0) {
      return {
        ok: false,
        error: "このクラスには貸し出し履歴があるため削除できません。",
      };
    }
    await prisma.class.delete({ where: { id: input.id } });
  } catch {
    return { ok: false, error: "クラスの削除に失敗しました。" };
  }
  revalidateLending();
  return { ok: true };
}

/** Prisma の一意制約違反(P2002)か判定 */
function isUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}
