import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SeedSchedule = {
  forsaddStart: number | null;
  forsaddEnd: number | null;
  transplantStart: number | null;
  transplantEnd: number | null;
  directStart: number | null;
  directEnd: number | null;
  harvestStart: number | null;
  harvestEnd: number | null;
};

export type PersonalSeedRow = {
  id: string;
  templateId: string | null;
  crop: string;
  variety: string;
  family: string;
  latinFamily: string;
  method: string;
  schedule: SeedSchedule;
  cultureTime: string;
  spacing: string;
  rowSpacing: string;
  seedPer75: number | null;
  seedPerM2: number | null;
  expirationYear: number | null;
  notes: string;
};

export type SeedTemplateOption = {
  id: string;
  crop: string;
  variety: string;
  family: string;
  latinFamily: string;
  method: string;
  schedule: SeedSchedule;
  cultureTime: string;
  spacing: string;
  rowSpacing: string;
  seedPer75: number | null;
  seedPerM2: number | null;
};

type PersonalSeedQueryRow = {
  id: string;
  template_id: string | null;
  crop: string;
  variety: string;
  family: string;
  latin_family: string;
  method: string;
  schedule: unknown;
  culture_time: string;
  spacing: string;
  row_spacing: string;
  seed_per_75: number | null;
  seed_per_m2: number | null;
  expiration_year: number | null;
  notes: string;
};

type SeedTemplateOptionQueryRow = {
  id: string;
  crop: string;
  variety: string;
  family: string;
  latin_family: string;
  method: string;
  forsaddStart: number | null;
  forsaddEnd: number | null;
  transplantStart: number | null;
  transplantEnd: number | null;
  directStart: number | null;
  directEnd: number | null;
  harvestStart: number | null;
  harvestEnd: number | null;
  culture_time: string;
  spacing: string;
  row_spacing: string;
  seed_per_75: number | null;
  seed_per_m2: number | null;
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
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

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
    transplantStart: toOptionalNumber(schedule.transplantStart),
    transplantEnd: toOptionalNumber(schedule.transplantEnd),
    directStart: toOptionalNumber(schedule.directStart),
    directEnd: toOptionalNumber(schedule.directEnd),
    harvestStart: toOptionalNumber(schedule.harvestStart),
    harvestEnd: toOptionalNumber(schedule.harvestEnd),
  };
}

export async function getPersonalSeeds(workspaceId: string): Promise<PersonalSeedRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("personal_seeds")
    .select("id, template_id, crop, variety, family, latin_family, method, schedule, culture_time, spacing, row_spacing, seed_per_75, seed_per_m2, expiration_year, notes")
    .eq("workspace_id", workspaceId)
    .order("crop", { ascending: true })
    .order("variety", { ascending: true });

  if (error) {
    return [];
  }

  return ((data ?? []) as PersonalSeedQueryRow[]).map((seed) => ({
    id: seed.id,
    templateId: seed.template_id,
    crop: seed.crop,
    variety: seed.variety,
    family: seed.family,
    latinFamily: seed.latin_family,
    method: seed.method,
    schedule: parseSchedule(seed.schedule),
    cultureTime: seed.culture_time,
    spacing: seed.spacing,
    rowSpacing: seed.row_spacing,
    seedPer75: seed.seed_per_75,
    seedPerM2: seed.seed_per_m2,
    expirationYear: seed.expiration_year,
    notes: seed.notes,
  }));
}

export async function getSeedTemplateOptions(): Promise<SeedTemplateOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("seed_templates")
    .select("id, crop, variety, family, latin_family, method, forsaddStart, forsaddEnd, transplantStart, transplantEnd, directStart, directEnd, harvestStart, harvestEnd, culture_time, spacing, row_spacing, seed_per_75, seed_per_m2")
    .order("crop", { ascending: true })
    .order("variety", { ascending: true });

  if (error) {
    return [];
  }

  return ((data ?? []) as SeedTemplateOptionQueryRow[]).map((seed) => ({
    id: seed.id,
    crop: seed.crop,
    variety: seed.variety,
    family: seed.family,
    latinFamily: seed.latin_family,
    method: seed.method,
    schedule: parseSchedule(seed),
    cultureTime: seed.culture_time,
    spacing: seed.spacing,
    rowSpacing: seed.row_spacing,
    seedPer75: seed.seed_per_75,
    seedPerM2: seed.seed_per_m2,
  }));
}
