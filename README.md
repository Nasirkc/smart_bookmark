# Bookmark Manager

A simple bookmark app built with Next.js and Supabase. You can add links, see them in a list, and delete them. Realtime sync keeps multiple tabs in sync when you add or remove bookmarks.

## Setup

1. Clone the repo and run `npm install`.
2. Copy `.env.example` to `.env` and add your Supabase URL and anon key.
3. Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor to create the table, RLS, and realtime publication.
4. Run `npm run dev` and open the app.

---

## Problems we ran into (and how we solved them)

Here are the main issues we hit while building this app and what we did to fix them.

### 1. Supabase client was not shared — realtime was flaky

**What was wrong**  
Every time we called `createClient()` (in the dashboard, the form, the navbar, inside effects), we got a **new** Supabase client. So we had:

- Different clients in different parts of the app
- Different WebSocket connections
- Realtime channels not really shared
- Realtime sometimes not syncing or failing quietly

**What we did**  
We made the browser Supabase client a **singleton** in `lib/supabaseClient.ts`. We create the client once and reuse the same instance everywhere. So there is one client per tab, one WebSocket, and one set of channels. Realtime then behaves consistently.

---

### 2. Realtime effect was using `supabase` without defining it

**What was wrong**  
In `DashboardContent`, the `useEffect` that sets up the realtime channel was calling `supabase.channel(...)` and `supabase.removeChannel(...)`, but we never declared `supabase` in that effect. So the code was broken and would throw at runtime.

**What we did**  
We added `const supabase = createClient();` at the start of that effect. Now the effect uses the shared client and cleans up correctly.

---

### 3. DELETE realtime stopped working after adding a filter

**What was wrong**  
We added a filter like `user_id=eq.${userId}` so we only get events for the current user. After that, **DELETE** events stopped showing up in other tabs.

**Why it happened**  
For DELETE events, PostgreSQL only sends the **primary key** in the “old” row by default. So the payload had `id` but not `user_id`. The Realtime server couldn’t apply the filter `user_id=eq.${userId}` because it didn’t have `user_id`, so it dropped those events.

**What we did**  
We set the table to send the full row on delete by running in Supabase:

```sql
ALTER TABLE public.bookmarks REPLICA IDENTITY FULL;
```

After that, the “old” row in DELETE events includes `user_id`, so the filter works and DELETE sync works again.

---

### 4. INSERT realtime never showed in the other tab

**What was wrong**  
When we added a bookmark in one tab, the **other** tab didn’t show it. DELETE worked across tabs, but INSERT didn’t. Even after removing the INSERT filter, the other tab still didn’t get the new bookmark (and nothing showed up in the console there).

**Why it happened**  
Supabase Realtime doesn’t always deliver **INSERT** events to other tabs (depending on publication setup or Realtime behavior). So we couldn’t rely on postgres_changes alone for “new bookmark in Tab A → show in Tab B”.

**What we did**  
We did three things:

1. **Channel name** — The channel was created with `"bookmarks-${userId}"` (a normal string), so the name was literally `bookmarks-${userId}` instead of including the actual user id. We changed it to a template literal: `` `bookmarks-${userId}` `` so each user has their own channel.

2. **No server-side filter for INSERT** — We removed the `filter` for INSERT and instead, in the INSERT handler, we only update state when `payload.new.user_id === userId`. That way we don’t depend on the server filter for INSERT.

3. **BroadcastChannel fallback** — When a tab successfully adds a bookmark, it also sends a message on a **BroadcastChannel** (e.g. `bookmarks-sync-${userId}`). Every tab for the same user listens on that channel. When they receive “BOOKMARK_ADDED”, they add the bookmark to the list and show a toast. So even if Realtime never sends the INSERT to the other tab, that tab still updates right away. This works for same-origin tabs in the same browser.

With that, adding a bookmark in one tab reliably shows it in the other tab.

---

## Summary

| Problem                         | Cause                                      | Fix                                                                 |
|--------------------------------|--------------------------------------------|---------------------------------------------------------------------|
| Realtime flaky / not syncing   | New Supabase client every time             | Singleton client in `lib/supabaseClient.ts`                         |
| Effect using undefined client  | Missing `const supabase = createClient()`  | Added that line at the start of the realtime effect                 |
| DELETE not working with filter | Old row only had primary key              | `ALTER TABLE ... REPLICA IDENTITY FULL`                             |
| INSERT not showing in other tab| Realtime not delivering INSERT + bad name  | Template literal channel name, client-side filter, BroadcastChannel |
