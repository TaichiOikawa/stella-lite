import { SiteNav } from "@/components/site-nav";
import { getSessionUser } from "@/lib/session";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  return (
    <>
      <SiteNav isAdmin={user?.admin ?? false} />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </div>
    </>
  );
}
