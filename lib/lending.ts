import { prisma } from "@/lib/prisma";

/** 残数(= 総在庫数 - 貸出中合計)を付与した物品 */
export type ItemWithRemaining = {
  id: string;
  name: string;
  totalQuantity: number;
  remaining: number;
};

/** 物品一覧に残数を付けて返す。残数 = totalQuantity - (endTime が null の貸出 amount 合計) */
export async function getItemsWithRemaining(): Promise<ItemWithRemaining[]> {
  const [items, grouped] = await Promise.all([
    prisma.item.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.lending.groupBy({
      by: ["itemId"],
      where: { endTime: null, itemId: { not: null } },
      _sum: { amount: true },
    }),
  ]);

  const lentMap = new Map<string, number>();
  for (const g of grouped) {
    if (g.itemId) lentMap.set(g.itemId, g._sum.amount ?? 0);
  }

  return items.map((i) => ({
    id: i.id,
    name: i.name,
    totalQuantity: i.totalQuantity,
    remaining: i.totalQuantity - (lentMap.get(i.id) ?? 0),
  }));
}

/** 貸出中(endTime が null)の記録を、物品・クラス情報付きで返す */
export async function getActiveLendings() {
  return prisma.lending.findMany({
    where: { endTime: null },
    orderBy: { startTime: "desc" },
    include: { item: true, class: true },
  });
}

export type ActiveLending = Awaited<ReturnType<typeof getActiveLendings>>[number];

/** 全貸し出し記録(貸出中・返却済み)を物品・クラス付きで返す */
export async function getLendingHistory() {
  return prisma.lending.findMany({
    orderBy: { startTime: "desc" },
    include: { item: true, class: true },
  });
}

export type LendingRecord = Awaited<ReturnType<typeof getLendingHistory>>[number];

/** クラス一覧(学年・組 昇順) */
export async function getClasses() {
  return prisma.class.findMany({
    orderBy: [{ grade: "asc" }, { number: "asc" }],
  });
}

export type ClassRow = Awaited<ReturnType<typeof getClasses>>[number];

/** 物品管理一覧 */
export async function getItems() {
  return prisma.item.findMany({ orderBy: { createdAt: "asc" } });
}

export type ItemRow = Awaited<ReturnType<typeof getItems>>[number];
