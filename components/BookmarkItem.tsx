"use client";

import { useState } from "react";
import type { Bookmark } from "@/types/bookmark";
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
import { Trash2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

function getFaviconUrl(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch {
    return "";
  }
}

function getDisplayUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type BookmarkItemProps = {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  deleting?: boolean;
  index?: number;
};

export default function BookmarkItem({
  bookmark,
  onDelete,
  deleting,
  index = 0,
}: BookmarkItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const favicon = getFaviconUrl(bookmark.url);
  const displayUrl = getDisplayUrl(bookmark.url);

  function handleConfirmDelete() {
    onDelete(bookmark.id);
    setDeleteDialogOpen(false);
  }

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-zinc-200 bg-white shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bookmark?</AlertDialogTitle>
            <AlertDialogDescription>
              “{bookmark.title}” will be removed. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <li
        className={cn(
        "rounded-2xl border border-zinc-200 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-xl",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
      )}
      style={{ animationDelay: `${index * 40}ms`, animationDuration: "400ms" }}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
          {favicon ? (
            <img
              src={favicon}
              alt=""
              className="size-5"
              width={20}
              height={20}
            />
          ) : (
            <Link2 className="size-5 text-zinc-500" />
          )}
        </div>
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 group"
        >
          <p className="truncate font-medium text-zinc-900 group-hover:text-zinc-700 transition-colors">
            {bookmark.title}
          </p>
          <p className="truncate text-sm text-zinc-500">{displayUrl}</p>
        </a>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={deleting}
          aria-label="Delete bookmark"
          className="shrink-0 rounded-xl text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
    </>
  );
}
