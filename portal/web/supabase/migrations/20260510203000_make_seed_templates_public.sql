drop policy if exists "Seed templates are readable by authenticated users"
on public.seed_templates;

create policy "Seed templates are publicly readable"
on public.seed_templates for select
using (true);
