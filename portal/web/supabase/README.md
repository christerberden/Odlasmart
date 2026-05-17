# Supabase

This folder contains database setup for the portal.

## Initial Schema

Run the SQL in:

`supabase/migrations/20260510180000_initial_portal_schema.sql`

For now, the easiest path is:

1. Open the Supabase project.
2. Go to SQL Editor.
3. Paste the migration SQL.
4. Run it once.

Later we can switch to the Supabase CLI and apply migrations from the terminal.

## Environment Variables

Local values live in `.env.local`.

Committed examples live in `.env.example`.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `DATABASE_URL`

## Import Seed Templates

After the initial schema has been applied, import the old seed catalog with:

```powershell
cd portal\web
& "C:\Program Files\nodejs\npm.cmd" run seed:templates
```

If the local database connection cannot reach Supabase directly, generate a SQL file instead:

```powershell
cd portal\web
& "C:\Program Files\nodejs\npm.cmd" run seed:templates:sql
```

Then run the generated SQL in Supabase SQL Editor:

`supabase/seed/seed_templates.sql`

## Public System Catalog Read

The system seed catalog should be readable before login. If the initial schema was already applied with authenticated-only read access, run:

`supabase/migrations/20260510203000_make_seed_templates_public.sql`

## Workspace Bootstrap

Run this migration to let an authenticated user create their first workspace and owner membership in one safe database function:

`supabase/migrations/20260510210000_create_workspace_rpc.sql`
