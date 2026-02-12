"use client";

import { useRouter } from "next/navigation";
import type { Bookmark } from "@/types/bookmark";
import BookmarkItem from "./BookmarkItem";
import { BookmarkIcon, Wifi, WifiOff } from "lucide-react";

type BookmarkListProps = {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  deletingId: string | null;
  realtimeStatus?: "connected" | "error" | null;
};

export default function BookmarkList({
  bookmarks,
  onDelete,
  deletingId,
  realtimeStatus = null,
}: BookmarkListProps) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-xl backdrop-blur-lg sm:p-8">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-bold text-zinc-900">Your bookmarks</h2>
          {realtimeStatus === "connected" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <Wifi className="size-3" />
              Live
            </span>
          )}
          {realtimeStatus === "error" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              <WifiOff className="size-3" />
              Offline
            </span>
          )}
        </div>
        <p className="mt-1 text-zinc-500">
          {bookmarks.length === 0
            ? "Your saved links will appear here."
            : `${bookmarks.length} link${bookmarks.length === 1 ? "" : "s"} saved.`}
        </p>
    
        {realtimeStatus === "error" && (
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-2 text-sm font-medium text-amber-600 hover:text-amber-700 underline"
          >
            Refresh to sync
          </button>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-8">
            <BookmarkIcon className="mx-auto size-14 text-zinc-400" />
            <p className="mt-4 text-lg font-medium text-zinc-600">
              No bookmarks yet
            </p>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              Add your first link above and it will show up here. Your bookmarks
              sync across tabs in real time.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {bookmarks.map((bookmark, index) => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              onDelete={onDelete}
              deleting={deletingId === bookmark.id}
              index={index}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
