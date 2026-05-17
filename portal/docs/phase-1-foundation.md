# Portal Phase 1

## Purpose

This document defines phase 1 for rebuilding Odlingskalender as a `Next.js` web portal.

Phase 1 is about:

- understanding what the current app actually contains
- defining the first portal scope
- extracting the domain model
- deciding what we intentionally skip in v1

This phase does not include implementation. It is the foundation we build the new portal from.

## Current App Summary

The current application is a client-side app built from:

- `index.html`
- `app.js`
- `styles.css`
- `seed_catalog_full.js`
- `vendor/xlsx.full.min.js`

The app stores data locally in:

- IndexedDB database `frodatabas-global-db`
- IndexedDB database `frodatabas-personlig-db`
- IndexedDB database `egen-odling-db`
- `localStorage` for preferences and weather/frost cache

The current user data snapshot contains:

- personal seeds
- sections
- fields
- crops
- events
- harvests
- seed inventory
- seed stock
- preferences

## What Exists Today

The current app already contains these business areas:

- seed catalog and personal seed library
- seed stock and purchase planning
- cultivation areas, sections and beds
- crop planning
- generated crop events
- task handling based on cultivation events
- harvest logging and harvest summary
- weather and frost support
- import/export for seeds, cultivation data and full user snapshot

## V1 Portal Scope

We are explicitly skipping weekly planning in v1.

That means v1 should include:

- authentication
- one or more gardens/farms per user
- seed library
- personal seed stock
- sections and cultivation areas
- crop records
- simple task list
- harvest logging
- harvest summary
- import of historical/local data
- basic settings

V1 should not include:

- timeline or week-based planning UI
- drag-and-drop planning canvas for schedule blocks
- frost overlays in timeline
- advanced planning recommendations in the UI
- planning mini-timelines

## Domain Model From Current App

### 1. User

New portal entity. Does not exist as a first-class entity in the current app.

Needed for:

- login
- ownership
- permissions
- multi-user portal support

### 2. Workspace

Recommended new entity for the portal. Represents one garden, farm, or growing operation.

Why we need it:

- the current app is effectively single-workspace
- the portal should separate users from data ownership
- it allows future collaboration without redesigning the schema

### 3. Seed Template

Maps to the current global seed catalog.

Core fields from current app:

- `id`
- `family`
- `latinFamily`
- `crop`
- `variety`
- `method`
- `schedule.forsaddStart`
- `schedule.forsaddEnd`
- `schedule.directStart`
- `schedule.directEnd`
- `schedule.transplantStart`
- `schedule.transplantEnd`
- `schedule.harvestStart`
- `schedule.harvestEnd`
- `cultureTime`
- `spacing`
- `rowSpacing`
- `seedPer75`
- `seedPerM2`
- `harvestInterval`

Portal note:

- treat the built-in catalog as system data
- do not store user-specific stock on this entity

### 4. Personal Seed

Maps to the current personal seed store.

Core fields:

- `id`
- `workspaceId`
- `globalSeedId`
- `family`
- `latinFamily`
- `crop`
- `variety`
- `method`
- `schedule.*`
- `cultureTime`
- `spacing`
- `rowSpacing`
- `seedPer75`
- `seedPerM2`
- `expirationYear`
- `notes`

Portal note:

- this should be the user-owned seed record
- it may optionally reference a system seed template

### 5. Seed Stock Batch

Maps to `seedStock`.

Core fields:

- `id`
- `workspaceId`
- `personalSeedId`
- `name`
- `crop`
- `variety`
- `quantity`
- `year`
- `expirationYear`
- `supplier`
- `notes`

Portal note:

- use this as the real inventory layer
- do not overload personal seed records with stock data

### 6. Seed Inventory Override

Maps to `seedInventory`.

Core fields:

- `id`
- `workspaceId`
- `year`
- `key`
- `seedId`
- `manualKey`
- `manual`
- `title`
- `stockOverride`
- `needOverride`

Portal note:

- this is not a core v1 feature in the UI
- keep the concept in the schema only if needed for migration compatibility
- otherwise defer it until seed purchasing workflows are rebuilt

### 7. Section

Maps to `sections`, currently called `skifte`.

Core fields:

- `id`
- `workspaceId`
- `name`
- `description`
- `family`
- `rotationEnabled`
- `rotationOrder`

Portal note:

- keep crop rotation support in the schema
- we can expose it lightly in v1 even without weekly planning

### 8. Field

Maps to `fields`.

Core fields:

- `id`
- `workspaceId`
- `sectionId`
- `name`
- `type`
- `description`
- `width`
- `length`
- `rows`
- `rotation`
- `x`
- `y`

Portal note:

- v1 does not need the current freeform visual map editor
- keep dimensions and type
- make map position optional for the first release

### 9. Crop

Maps to `crops`.

Core fields:

- `id`
- `workspaceId`
- `seedId`
- `title`
- `batchName`
- `fieldIds`
- `area`
- `note`
- `startYear`
- `endYear`
- `schedule.forsaddStart`
- `schedule.forsaddEnd`
- `schedule.directStart`
- `schedule.directEnd`
- `schedule.transplantStart`
- `schedule.transplantEnd`
- `schedule.harvestStart`
- `schedule.harvestEnd`

Portal note:

- for the portal database, change `fieldIds` to a join table instead of an array
- keep schedule fields in the database even if the v1 UI does not show a week planner

### 10. Crop Event

Maps to `events`.

Core fields:

- `id`
- `workspaceId`
- `cropId`
- `type`
- `title`
- `week`
- `year`
- `completed`
- `moreToHarvest`

Portal note:

- current app generates events from crop schedule
- in the portal this should likely be derived server-side, not manually maintained as the source of truth
- for v1 we should prefer a simpler task model and only generate harvest-related reminders if needed

### 11. Task

The current app uses cultivation events as operational tasks.

Portal recommendation:

- introduce a real `Task` entity
- keep it independent from event generation

Suggested fields:

- `id`
- `workspaceId`
- `cropId`
- `fieldId`
- `title`
- `description`
- `status`
- `dueDate`
- `completedAt`
- `source`

This is a cleaner portal model than reusing generated event rows directly.

### 12. Harvest Entry

Maps to `harvests`.

Core fields:

- `id`
- `workspaceId`
- `cropId`
- `seedId`
- `eventId`
- `title`
- `kg`
- `area`
- `week`
- `month`
- `year`
- `manual`
- `moreToHarvest`

Portal note:

- this is a strong v1 feature and should be kept
- harvest summaries can be built directly from these records

### 13. Preference

Maps to `localStorage` state.

Current values include:

- `activeYear`
- `theme`
- `harvestPrices`
- `weatherLocation`
- `weatherLocationRequested`
- `frostWindow`

Portal note:

- move these to user and workspace settings
- treat frost and weather cache as non-critical support data

## Recommended V1 Database Direction

Use PostgreSQL with these main tables:

- `users`
- `workspaces`
- `workspace_members`
- `seed_templates`
- `personal_seeds`
- `seed_stock_batches`
- `sections`
- `fields`
- `crops`
- `crop_fields`
- `tasks`
- `harvest_entries`
- `user_preferences`
- `workspace_preferences`

Tables we should avoid in v1 unless needed for migration:

- `crop_events`
- `seed_inventory_overrides`
- weather cache tables
- frost cache tables

## Recommended Functional Boundaries

Split the new portal into these modules:

- `auth`
- `workspace`
- `seeds`
- `inventory`
- `fields`
- `crops`
- `tasks`
- `harvest`
- `settings`
- `import`

Do not start with a generic `planner` module, since we are skipping weekly planning.

## Migration Strategy From Current App

The safest migration path is:

1. Keep the current app intact as the reference system.
2. Build a fresh `Next.js` portal in a new folder.
3. Add import support for the current JSON snapshot format.
4. Map snapshot entities into the new relational schema.
5. Validate migrated data with test snapshots before real usage.

The best initial migration source is the current full snapshot payload:

- `personalSeeds`
- `cultivation.sections`
- `cultivation.fields`
- `cultivation.crops`
- `cultivation.events`
- `cultivation.harvests`
- `cultivation.seedInventory`
- `cultivation.seedStock`
- `preferences`

## V1 Product Decisions

These are the recommended product decisions for the rebuild:

- the portal is account-based from day one
- every record belongs to a workspace
- personal seeds and stock are separate concepts
- crops belong to one workspace and can be linked to multiple fields
- harvest stays as a first-class workflow
- tasks become explicit records, not only derived events
- weekly planning is postponed, not removed from the long-term model

## Risks To Avoid

- copying `app.js` behavior directly into React components
- using array fields in the database where join tables are better
- rebuilding the old timeline before the core data model is stable
- mixing seed catalog data with user-owned seed stock
- making weather/frost a blocking dependency for v1

## Deliverables Completed In Phase 1

Phase 1 is complete when we have:

- an agreed v1 scope
- an agreed domain model
- an agreed portal architecture direction
- a migration source defined
- clear non-goals for weekly planning

## Next Step

Phase 2 should produce the initial technical skeleton:

- scaffold the `Next.js` app
- choose `Supabase` project structure
- define the first SQL schema
- define route structure
- implement auth and workspace setup
