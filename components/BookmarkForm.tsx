"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Bookmark } from "@/types/bookmark";

type BookmarkFormProps = {
  userId: string;
  onBookmarkAdded?: (bookmark: Bookmark) => void;
};

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function BookmarkForm({
  userId,
  onBookmarkAdded,
}: BookmarkFormProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const titleVal = title.trim();
    const urlVal = url.trim();

    const newErrors: { title?: string; url?: string } = {};

    if (!titleVal) {
      newErrors.title = "Title is required";
    }

    if (!urlVal) {
      newErrors.url = "URL is required";
    } else if (!isValidUrl(urlVal)) {
      newErrors.url = "Please enter a valid URL (e.g. https://example.com)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the form errors");
      return;
    }

    setErrors({});
    setLoading(true);

    const supabase = createClient();
    const { data: inserted, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: userId,
        title: titleVal,
        url: urlVal,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast.error("Failed to add bookmark. Please try again.");
      return;
    }

    if (inserted) {
      const bookmark = inserted as Bookmark;
      onBookmarkAdded?.(bookmark);
      // Notify other tabs (same user) so they show the new bookmark even if postgres_changes INSERT doesn't deliver
      try {
        const bc = new BroadcastChannel(`bookmarks-sync-${userId}`);
        bc.postMessage({ type: "BOOKMARK_ADDED", payload: bookmark });
        bc.close();
      } catch {
        // BroadcastChannel not supported (e.g. old browser)
      }
    }
    toast.success("Bookmark added successfully");
    setTitle("");
    setUrl("");
  }

  return (
    <div className="mb-8 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-xl backdrop-blur-lg sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-900">Add bookmark</h2>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-2">
          <Label
            htmlFor="title"
            className={cn(
              "text-zinc-700 font-medium",
              errors.title && "text-red-600"
            )}
          >
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder="My link"
            disabled={loading}
            className={cn(
              "rounded-xl border-zinc-200 bg-white/80 h-11 transition-shadow focus:ring-2 focus:ring-zinc-900/20",
              errors.title && "border-red-300 focus:ring-red-200"
            )}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          {errors.title && (
            <p id="title-error" className="text-sm text-red-600">
              {errors.title}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label
            htmlFor="url"
            className={cn(
              "text-zinc-700 font-medium",
              errors.url && "text-red-600"
            )}
          >
            URL
          </Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (errors.url) setErrors((prev) => ({ ...prev, url: undefined }));
            }}
            placeholder="https://example.com"
            disabled={loading}
            className={cn(
              "rounded-xl border-zinc-200 bg-white/80 h-11 transition-shadow focus:ring-2 focus:ring-zinc-900/20",
              errors.url && "border-red-300 focus:ring-red-200"
            )}
            aria-invalid={!!errors.url}
            aria-describedby={errors.url ? "url-error" : undefined}
          />
          {errors.url && (
            <p id="url-error" className="text-sm text-red-600">
              {errors.url}
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-11 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 hover:scale-[1.02] hover:shadow-lg transition-all duration-200 font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Adding…
            </>
          ) : (
            "Add bookmark"
          )}
        </Button>
      </form>
    </div>
  );
}
