alter table public.harvest_entries
add column if not exists field_id uuid references public.fields(id) on delete set null;

create table if not exists public.crop_plantings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  crop_id uuid references public.crops(id) on delete set null,
  field_id uuid references public.fields(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  plant_count integer check (plant_count is null or plant_count >= 0),
  row_count integer check (row_count is null or row_count >= 0),
  area_m2 numeric,
  note text not null default '',
  planted_at timestamptz not null default now()
);

create index if not exists crop_plantings_workspace_id_idx
on public.crop_plantings(workspace_id);

create index if not exists crop_plantings_crop_id_idx
on public.crop_plantings(crop_id);

alter table public.crop_plantings enable row level security;

create policy "Members can read crop plantings"
on public.crop_plantings for select
using (public.is_workspace_member(workspace_id));

create policy "Members can manage crop plantings"
on public.crop_plantings for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
