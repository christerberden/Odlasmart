alter table public.crop_fields
add column if not exists planned_rows integer,
add column if not exists planned_area_m2 numeric;
