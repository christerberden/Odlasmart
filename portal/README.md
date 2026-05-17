# Odlingsportal

This folder contains the planning and future implementation for the new `Next.js` web portal.

The current app remains in the project root as the reference implementation while the portal is rebuilt in stages.

## Contents

- `docs/phase-1-foundation.md` - domain inventory, v1 scope and first portal model
- `web/` - the new Next.js application

## Current Direction

The portal rebuild is planned around:

- `Next.js`
- `TypeScript`
- `Vercel`
- `Supabase`
- account-based access
- workspace-based garden data

## Current V1 Scope

V1 focuses on:

- users and workspaces
- seed library
- seed stock
- sections and cultivation areas
- crops
- tasks
- harvest logging
- data import from the current local app

Weekly planning is intentionally deferred.

## Local Development

The portal app lives in `web/`.

```powershell
cd portal\web
& "C:\Program Files\nodejs\npm.cmd" run dev
```

## Supabase

The first database migration lives in:

- `web/supabase/migrations/20260510180000_initial_portal_schema.sql`

Local secrets are stored in:

- `web/.env.local`

Do not commit `.env.local`.
