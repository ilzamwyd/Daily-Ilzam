import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="print:hidden">
          <TopBar email={user.email} />
        </div>
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 print:p-0">{children}</main>
        <div className="print:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
