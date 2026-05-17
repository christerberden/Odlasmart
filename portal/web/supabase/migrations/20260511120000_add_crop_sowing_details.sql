alter table public.crop_fields
add column if not exists row_spacing_cm numeric,
add column if not exists plant_spacing_cm numeric,
add column if not exists planned_seed_count integer;
