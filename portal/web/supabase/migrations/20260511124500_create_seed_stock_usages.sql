create table if not exists public.seed_stock_usages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  seed_stock_batch_id uuid references public.seed_stock_batches(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  crop_id uuid references public.crops(id) on delete set null,
  seed_count integer not null check (seed_count > 0),
  note text not null default '',
  used_at timestamptz not null default now()
);

create index if not exists seed_stock_usages_workspace_id_idx
on public.seed_stock_usages(workspace_id);

create index if not exists seed_stock_usages_seed_stock_batch_id_idx
on public.seed_stock_usages(seed_stock_batch_id);

alter table public.seed_stock_usages enable row level security;

create policy "Members can read seed stock usages"
on public.seed_stock_usages for select
using (public.is_workspace_member(workspace_id));

create policy "Members can manage seed stock usages"
on public.seed_stock_usages for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
