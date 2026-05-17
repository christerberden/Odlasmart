import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SeedSchedule } from "@/lib/data/seeds";

export type CropRow = {
  id: string;
  personalSeedId: string | null;
  title: string;
  batchName: string;
  startYear: number;
  endYear: number;
  schedule: SeedSchedule;
  areaM2: number | null;
  note: string;
  fields: {
    fieldId: string;
    fieldName: string;
    plannedRows: number | null;
    plannedAreaM2: number | null;
    rowSpacingCm: number | null;
    plantSpacingCm: number | null;
    plannedSeedCount: number | null;
    seedStockBatchId: string | null;
  }[];
};

type CropQueryRow = {
  id: string;
  personal_seed_id: string | null;
  title: string;
  batch_name: string;
  start_year: number;
  end_year: number;
  schedule: unknown;
  area_m2: number | null;
  note: string;
};

type CropFieldQueryRow = {
  crop_id: string;
  field_id: string;
  planned_rows: number | null;
  planned_area_m2: number | null;
  row_spacing_cm: number | null;
  plant_spacing_cm: number | null;
  planned_seed_count: number | null;
  seed_stock_batch_id: string | null;
  fields: {
    name: string;
  } | null;
};

const EMPTY_SCHEDULE: SeedSchedule = {
  forsaddStart: null,
  forsaddEnd: null,
  transplantStart: null,
  transplantEnd: null,
  directStart: null,
  directEnd: null,
  harvestStart: null,
  harvestEnd: null,
};

function toOptionalNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSchedule(value: unknown): SeedSchedule {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...EMPTY_SCHEDULE };
  }

  const schedule = value as Record<string, unknown>;
  return {
    forsaddStart: toOptionalNumber(schedule.forsaddStart),
    forsaddEnd: toOptionalNumber(schedule.forsaddEnd),
    transplantStart: toOptionalNumber(schedule.transplantStart ?? schedule.transplant),
    transplantEnd: toOptionalNumber(schedule.transplantEnd ?? schedule.transplant),
    directStart: toOptionalNumber(schedule.directStart),
    directEnd: toOptionalNumber(schedule.directEnd),
    harvestStart: toOptionalNumber(schedule.harvestStart),
    harvestEnd: toOptionalNumber(schedule.harvestEnd),
  };
}

export async function getCrops(workspaceId: string): Promise<CropRow[]> {
  const supabase = await createSupabaseServerClient();
  const [{ data: crops, error: cropsError }, { data: cropFields }] =
    await Promise.all([
      supabase
        .from("crops")
        .select(
          "id, personal_seed_id, title, batch_name, start_year, end_year, schedule, area_m2, note",
        )
        .eq("workspace_id", workspaceId)
        .order("start_year", { ascending: false })
        .order("title", { ascending: true }),
      supabase
        .from("crop_fields")
        .select("crop_id, field_id, planned_rows, planned_area_m2, row_spacing_cm, plant_spacing_cm, planned_seed_count, seed_stock_batch_id, fields(name)"),
    ]);

  if (cropsError) {
    return [];
  }

  const fieldRows = (cropFields ?? []) as unknown as CropFieldQueryRow[];

  return ((crops ?? []) as CropQueryRow[]).map((crop) => ({
    id: crop.id,
    personalSeedId: crop.personal_seed_id,
    title: crop.title,
    batchName: crop.batch_name,
    startYear: crop.start_year,
    endYear: crop.end_year,
    schedule: parseSchedule(crop.schedule),
    areaM2: crop.area_m2,
    note: crop.note,
    fields: fieldRows
      .filter((row) => row.crop_id === crop.id)
      .map((row) => ({
        fieldId: row.field_id,
        fieldName: row.fields?.name ?? "Okänd yta",
        plannedRows: row.planned_rows,
        plannedAreaM2: row.planned_area_m2,
        rowSpacingCm: row.row_spacing_cm,
        plantSpacingCm: row.plant_spacing_cm,
        plannedSeedCount: row.planned_seed_count,
        seedStockBatchId: row.seed_stock_batch_id,
      })),
  }));
}
