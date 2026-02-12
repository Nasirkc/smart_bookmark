create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  url text not null,
  created_at timestamptz default now()
);

-- RLS: users can only CRUD their own rows
alter table public.bookmarks enable row level security;

create policy "Users can CRUD own bookmarks"
  on public.bookmarks
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table bookmarks;
