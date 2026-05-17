alter table public.crop_fields
add column if not exists seed_stock_batch_id uuid references public.seed_stock_batches(id) on delete set null;
