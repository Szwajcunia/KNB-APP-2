-- Supabase SQL for Panel 3 (Kommissionierung)
create table if not exists public.picking_lists (
  id uuid primary key default gen_random_uuid(),
  list_no text not null,
  list_name text not null,
  unload_place text not null,
  planned_time timestamptz,
  planned_qty int,
  actual_qty int,
  notes text,
  status text not null default 'open',
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.picking_lists enable row level security;

-- Open RLS for authenticated users (adjust later with roles)
create policy "read_picking_lists_auth"
  on public.picking_lists for select
  to authenticated using (true);

create policy "ins_picking_lists_auth"
  on public.picking_lists for insert
  to authenticated with check (true);

create policy "upd_picking_lists_auth"
  on public.picking_lists for update
  to authenticated using (true);

create policy "del_picking_lists_auth"
  on public.picking_lists for delete
  to authenticated using (true);
