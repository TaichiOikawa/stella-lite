import { SiteNav } from "@/components/site-nav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteNav />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </div>
    </>
  );
}
