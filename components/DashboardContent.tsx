"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "sonner";
import type { Bookmark } from "@/types/bookmark";
import BookmarkForm from "./BookmarkForm";
import BookmarkList from "./BookmarkList";

type DashboardContentProps = {
  userId: string;
  initialBookmarks: Bookmark[];
};

function sortByNewest(bookmarks: Bookmark[]): Bookmark[] {
  return [...bookmarks].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export default function DashboardContent({
  userId,
  initialBookmarks,
}: DashboardContentProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() =>
    sortByNewest(initialBookmarks)
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connected" | "error" | null
  >(null);

  useEffect(() => {
    const supabase = createClient();

    function toBookmark(raw: Record<string, unknown> | null): Bookmark | null {
      if (!raw || raw.id == null) return null;
      return {
        id: String(raw.id),
        user_id: String(raw.user_id ?? ""),
        title: String(raw.title ?? ""),
        url: String(raw.url ?? ""),
        created_at:
          raw.created_at != null
            ? new Date(raw.created_at as string).toISOString()
            : new Date().toISOString(),
      };
    }

    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
        },
        (payload: { new?: Record<string, unknown> }) => {
          const newRow = toBookmark((payload.new ?? {}) as Record<string, unknown>);
          if (!newRow || newRow.user_id !== userId) return;
          setBookmarks((prev) => {
            if (prev.some((b) => b.id === newRow.id)) return prev;
            toast.info("New bookmark added");
            return sortByNewest([newRow, ...prev]);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", 
          schema: "public", 
          table: "bookmarks" ,
          filter: `user_id=eq.${userId}`
        },
        (payload: { old?: { id?: string } }) => {
          const oldRow = payload.old as { id?: string };
          const id = oldRow?.id != null ? String(oldRow.id) : null;
          if (!id) return;
          setBookmarks((prev) => {
            return prev.filter((b) => b.id !== id);
          });
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
          return;
        }
        if (
          status === "CHANNEL_ERROR" ||
          status === "CLOSED" ||
          status === "TIMED_OUT"
        ) {
          setRealtimeStatus("error");
        }
      });

    const broadcastChannel = new BroadcastChannel(`bookmarks-sync-${userId}`);
    broadcastChannel.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type?: string; payload?: Record<string, unknown> } | null;
      if (msg?.type !== "BOOKMARK_ADDED" || !msg.payload) return;
      const newRow = toBookmark(msg.payload);
      if (!newRow || newRow.user_id !== userId) return;
      setBookmarks((prev) => {
        if (prev.some((b) => b.id === newRow.id)) return prev;
        toast.info("New bookmark added");
        return sortByNewest([newRow, ...prev]);
      });
    };

    return () => {
      broadcastChannel.close();
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchBookmarks = useCallback(async () => {
    const supabase = createClient();
    const { data: rows, error } = await supabase
      .from("bookmarks")
      .select("id, user_id, title, url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) return;
    const fetched = (rows ?? []).map((raw: Record<string, unknown>) => ({
      id: String(raw.id),
      user_id: String(raw.user_id ?? ""),
      title: String(raw.title ?? ""),
      url: String(raw.url ?? ""),
      created_at:
        raw.created_at != null
          ? new Date(raw.created_at as string).toISOString()
          : new Date().toISOString(),
    }));
    setBookmarks((prev) => {
      const byId = new Map(prev.map((b: Bookmark) => [b.id, b]));
      fetched.forEach((b: Bookmark) => byId.set(b.id, b));
      return sortByNewest(Array.from(byId.values()));
    });
  }, [userId]);

  // Fallback: when Supabase realtime fails, poll every 5s so the list still stays in sync
  useEffect(() => {
    if (realtimeStatus !== "error") return;
    const interval = setInterval(fetchBookmarks, 5000);
    return () => clearInterval(interval);
  }, [realtimeStatus, fetchBookmarks]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast.error("Failed to delete bookmark. Please try again.");
      return;
    }
    toast.success("Bookmark removed successfully");
  }

  function handleBookmarkAdded(bookmark: Bookmark) {
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === bookmark.id)) return prev;
      return sortByNewest([bookmark, ...prev]);
    });
  }

  return (
    <>
      <BookmarkForm userId={userId} onBookmarkAdded={handleBookmarkAdded} />
      <BookmarkList
        bookmarks={bookmarks}
        onDelete={handleDelete}
        deletingId={deletingId}
        realtimeStatus={realtimeStatus}
      />
    </>
  );
}
