create table public.career_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_number smallint not null check (slot_number between 1 and 5),
  fighter_id text not null,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, slot_number)
);

alter table public.career_saves enable row level security;

create policy "Users can read their own career saves"
on public.career_saves for select
using (auth.uid() = user_id);

create policy "Users can create their own career saves"
on public.career_saves for insert
with check (auth.uid() = user_id);

create policy "Users can update their own career saves"
on public.career_saves for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own career saves"
on public.career_saves for delete
using (auth.uid() = user_id);
