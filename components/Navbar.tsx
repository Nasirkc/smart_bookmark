"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookmarkIcon, LogOut } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setLogoutDialogOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-zinc-200 bg-white shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your bookmarks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-zinc-900 hover:text-zinc-700 transition-colors min-w-0"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <BookmarkIcon className="size-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight truncate">
              Smart Bookmarks
            </span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLogoutDialogOpen(true)}
            className="shrink-0 h-9 px-4 rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-300 transition-all duration-200 font-medium"
          >
            <LogOut className="size-4 mr-2" />
            Log out
          </Button>
        </div>
      </header>
    </>
  );
}
