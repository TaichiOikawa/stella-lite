import { getLendingHistory } from "@/lib/lending";
import { requireApprovedUser } from "@/lib/session";
import { HistoryTable } from "@/components/lending/history-table";

export const dynamic = "force-dynamic";

export default async function LendingHistoryPage() {
  await requireApprovedUser();
  const lendings = await getLendingHistory();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">貸し出し履歴</h1>
      <HistoryTable lendings={lendings} />
    </div>
  );
}
