alter table public.seed_templates
  add column "forsaddStart" integer check ("forsaddStart" between 1 and 53),
  add column "forsaddEnd" integer check ("forsaddEnd" between 1 and 53),
  add column "transplantStart" integer check ("transplantStart" between 1 and 53),
  add column "transplantEnd" integer check ("transplantEnd" between 1 and 53),
  add column "directStart" integer check ("directStart" between 1 and 53),
  add column "directEnd" integer check ("directEnd" between 1 and 53),
  add column "harvestStart" integer check ("harvestStart" between 1 and 53),
  add column "harvestEnd" integer check ("harvestEnd" between 1 and 53);

update public.seed_templates
set
  "forsaddStart" = nullif(schedule->>'forsaddStart', '')::integer,
  "forsaddEnd" = nullif(schedule->>'forsaddEnd', '')::integer,
  "transplantStart" = nullif(schedule->>'transplantStart', '')::integer,
  "transplantEnd" = nullif(schedule->>'transplantEnd', '')::integer,
  "directStart" = nullif(schedule->>'directStart', '')::integer,
  "directEnd" = nullif(schedule->>'directEnd', '')::integer,
  "harvestStart" = nullif(schedule->>'harvestStart', '')::integer,
  "harvestEnd" = nullif(schedule->>'harvestEnd', '')::integer;

alter table public.seed_templates
  drop column schedule;
