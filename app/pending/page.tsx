import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { ApplyButton } from "@/components/apply-button";

export default async function PendingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.approved) redirect("/lending");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">アカウント未承認</h1>
        <p className="text-sm text-muted-foreground">
          {user.applied
            ? "このアカウントの承認を申請済みです。"
            : "このアカウントはまだ承認されていません。利用するには承認の申請が必要です。"}
        </p>
        <ApplyButton applied={user.applied} />
      </div>
    </div>
  );
}
