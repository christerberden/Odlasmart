create extension if not exists "pgcrypto";

create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.field_type as enum (
  'bed',
  'greenhouse',
  'path',
  'tree',
  'house',
  'fence',
  'wall',
  'hedge',
  'other'
);
create type public.task_status as enum ('open', 'done', 'archived');
create type public.task_source as enum ('manual', 'import', 'system');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.seed_templates (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  family text not null default '',
  latin_family text not null default '',
  crop text not null,
  variety text not null default '',
  method text not null default '',
  schedule jsonb not null default '{}'::jsonb,
  culture_time text not null default '',
  spacing text not null default '',
  row_spacing text not null default '',
  seed_per_75 numeric,
  seed_per_m2 numeric,
  harvest_interval integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.personal_seeds (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_id uuid references public.seed_templates(id) on delete set null,
  legacy_id text,
  family text not null default '',
  latin_family text not null default '',
  crop text not null,
  variety text not null default '',
  method text not null default '',
  schedule jsonb not null default '{}'::jsonb,
  culture_time text not null default '',
  spacing text not null default '',
  row_spacing text not null default '',
  seed_per_75 numeric,
  seed_per_m2 numeric,
  expiration_year integer,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, legacy_id)
);

create table public.seed_stock_batches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  personal_seed_id uuid references public.personal_seeds(id) on delete set null,
  legacy_id text,
  name text not null default '',
  crop text not null default '',
  variety text not null default '',
  quantity integer not null default 0 check (quantity >= 0),
  purchase_year integer,
  expiration_year integer,
  supplier text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, legacy_id)
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  legacy_id text,
  name text not null,
  description text not null default '',
  family text not null default '',
  rotation_enabled boolean not null default true,
  rotation_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, legacy_id)
);

create table public.fields (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  section_id uuid references public.sections(id) on delete set null,
  legacy_id text,
  name text not null,
  type public.field_type not null default 'bed',
  description text not null default '',
  width_m numeric,
  length_m numeric,
  rows integer,
  rotation_deg numeric not null default 0,
  position_x numeric,
  position_y numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, legacy_id)
);

create table public.crops (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  personal_seed_id uuid references public.personal_seeds(id) on delete set null,
  legacy_id text,
  title text not null,
  batch_name text not null default '',
  area_m2 numeric,
  note text not null default '',
  start_year integer not null,
  end_year integer not null,
  schedule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, legacy_id)
);

create table public.crop_fields (
  crop_id uuid not null references public.crops(id) on delete cascade,
  field_id uuid not null references public.fields(id) on delete cascade,
  planned_rows integer,
  planned_area_m2 numeric,
  primary key (crop_id, field_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  crop_id uuid references public.crops(id) on delete set null,
  field_id uuid references public.fields(id) on delete set null,
  title text not null,
  description text not null default '',
  status public.task_status not null default 'open',
  due_date date,
  completed_at timestamptz,
  source public.task_source not null default 'manual',
  legacy_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.harvest_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  crop_id uuid references public.crops(id) on delete set null,
  personal_seed_id uuid references public.personal_seeds(id) on delete set null,
  legacy_id text,
  legacy_event_id text,
  title text not null,
  kg numeric not null default 0 check (kg >= 0),
  area_m2 numeric,
  week integer check (week between 1 and 53),
  month integer check (month between 1 and 12),
  year integer not null,
  manual boolean not null default false,
  more_to_harvest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, legacy_id)
);

create table public.workspace_preferences (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  active_year integer,
  harvest_prices jsonb not null default '{}'::jsonb,
  weather_location jsonb,
  frost_window jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspace_members_user_id_idx on public.workspace_members(user_id);
create index personal_seeds_workspace_id_idx on public.personal_seeds(workspace_id);
create index seed_stock_batches_workspace_id_idx on public.seed_stock_batches(workspace_id);
create index sections_workspace_id_idx on public.sections(workspace_id);
create index fields_workspace_id_idx on public.fields(workspace_id);
create index crops_workspace_id_idx on public.crops(workspace_id);
create index tasks_workspace_id_status_idx on public.tasks(workspace_id, status);
create index harvest_entries_workspace_id_year_idx on public.harvest_entries(workspace_id, year);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger seed_templates_set_updated_at
before update on public.seed_templates
for each row execute function public.set_updated_at();

create trigger personal_seeds_set_updated_at
before update on public.personal_seeds
for each row execute function public.set_updated_at();

create trigger seed_stock_batches_set_updated_at
before update on public.seed_stock_batches
for each row execute function public.set_updated_at();

create trigger sections_set_updated_at
before update on public.sections
for each row execute function public.set_updated_at();

create trigger fields_set_updated_at
before update on public.fields
for each row execute function public.set_updated_at();

create trigger crops_set_updated_at
before update on public.crops
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create trigger harvest_entries_set_updated_at
before update on public.harvest_entries
for each row execute function public.set_updated_at();

create trigger workspace_preferences_set_updated_at
before update on public.workspace_preferences
for each row execute function public.set_updated_at();

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.seed_templates enable row level security;
alter table public.personal_seeds enable row level security;
alter table public.seed_stock_batches enable row level security;
alter table public.sections enable row level security;
alter table public.fields enable row level security;
alter table public.crops enable row level security;
alter table public.crop_fields enable row level security;
alter table public.tasks enable row level security;
alter table public.harvest_entries enable row level security;
alter table public.workspace_preferences enable row level security;
alter table public.user_preferences enable row level security;

create policy "Members can read workspaces"
on public.workspaces for select
using (public.is_workspace_member(id));

create policy "Admins can update workspaces"
on public.workspaces for update
using (public.is_workspace_admin(id))
with check (public.is_workspace_admin(id));

create policy "Users can create workspaces"
on public.workspaces for insert
with check (auth.uid() is not null);

create policy "Members can read workspace members"
on public.workspace_members for select
using (public.is_workspace_member(workspace_id));

create policy "Admins can manage workspace members"
on public.workspace_members for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

create policy "Seed templates are publicly readable"
on public.seed_templates for select
using (true);

create policy "Members can read personal seeds"
on public.personal_seeds for select
using (public.is_workspace_member(workspace_id));

create policy "Admins can manage personal seeds"
on public.personal_seeds for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

create policy "Members can read seed stock"
on public.seed_stock_batches for select
using (public.is_workspace_member(workspace_id));

create policy "Admins can manage seed stock"
on public.seed_stock_batches for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

create policy "Members can read sections"
on public.sections for select
using (public.is_workspace_member(workspace_id));

create policy "Admins can manage sections"
on public.sections for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

create policy "Members can read fields"
on public.fields for select
using (public.is_workspace_member(workspace_id));

create policy "Admins can manage fields"
on public.fields for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

create policy "Members can read crops"
on public.crops for select
using (public.is_workspace_member(workspace_id));

create policy "Admins can manage crops"
on public.crops for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

create policy "Members can read crop fields"
on public.crop_fields for select
using (
  exists (
    select 1
    from public.crops
    where crops.id = crop_fields.crop_id
      and public.is_workspace_member(crops.workspace_id)
  )
);

create policy "Admins can manage crop fields"
on public.crop_fields for all
using (
  exists (
    select 1
    from public.crops
    where crops.id = crop_fields.crop_id
      and public.is_workspace_admin(crops.workspace_id)
  )
)
with check (
  exists (
    select 1
    from public.crops
    where crops.id = crop_fields.crop_id
      and public.is_workspace_admin(crops.workspace_id)
  )
);

create policy "Members can read tasks"
on public.tasks for select
using (public.is_workspace_member(workspace_id));

create policy "Members can manage tasks"
on public.tasks for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Members can read harvest entries"
on public.harvest_entries for select
using (public.is_workspace_member(workspace_id));

create policy "Members can manage harvest entries"
on public.harvest_entries for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Members can read workspace preferences"
on public.workspace_preferences for select
using (public.is_workspace_member(workspace_id));

create policy "Admins can manage workspace preferences"
on public.workspace_preferences for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

create policy "Users can read their preferences"
on public.user_preferences for select
using (user_id = auth.uid());

create policy "Users can manage their preferences"
on public.user_preferences for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
