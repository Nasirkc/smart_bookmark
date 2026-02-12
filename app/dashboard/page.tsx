import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabaseServer";
import Navbar from "@/components/Navbar";
import DashboardContent from "@/components/DashboardContent";
import type { Bookmark } from "@/types/bookmark";

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: initialBookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        <DashboardContent
          userId={user.id}
          initialBookmarks={(initialBookmarks ?? []) as Bookmark[]}
        />
      </main>
    </div>
  );
}
