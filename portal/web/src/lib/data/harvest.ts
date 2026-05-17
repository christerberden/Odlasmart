import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HarvestEntryRow = {
  id: string;
  cropId: string | null;
  fieldId: string | null;
  personalSeedId: string | null;
  title: string;
  kg: number;
  areaM2: number | null;
  week: number | null;
  month: number | null;
  year: number;
  manual: boolean;
  moreToHarvest: boolean;
  createdAt: string;
  fieldName: string;
};

export type HarvestSummaryRow = {
  title: string;
  kg: number;
  entries: number;
  areaM2: number | null;
};

type HarvestEntryQueryRow = {
  id: string;
  crop_id: string | null;
  field_id: string | null;
  personal_seed_id: string | null;
  title: string;
  kg: number;
  area_m2: number | null;
  week: number | null;
  month: number | null;
  year: number;
  manual: boolean;
  more_to_harvest: boolean;
  created_at: string;
  fields: {
    name: string;
  } | null;
};

export async function getHarvestEntries(workspaceId: string): Promise<HarvestEntryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("harvest_entries")
    .select("id, crop_id, field_id, personal_seed_id, title, kg, area_m2, week, month, year, manual, more_to_harvest, created_at, fields(name)")
    .eq("workspace_id", workspaceId)
    .order("year", { ascending: false })
    .order("week", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data ?? []) as HarvestEntryQueryRow[]).map((entry) => ({
    id: entry.id,
    cropId: entry.crop_id,
    fieldId: entry.field_id,
    personalSeedId: entry.personal_seed_id,
    title: entry.title,
    kg: entry.kg,
    areaM2: entry.area_m2,
    week: entry.week,
    month: entry.month,
    year: entry.year,
    manual: entry.manual,
    moreToHarvest: entry.more_to_harvest,
    createdAt: entry.created_at,
    fieldName: entry.fields?.name ?? "",
  }));
}

export function summarizeHarvest(entries: HarvestEntryRow[]): HarvestSummaryRow[] {
  const rows = new Map<string, HarvestSummaryRow>();

  entries.forEach((entry) => {
    const existing = rows.get(entry.title) ?? {
      title: entry.title,
      kg: 0,
      entries: 0,
      areaM2: null,
    };

    existing.kg += entry.kg;
    existing.entries += 1;
    existing.areaM2 = entry.areaM2 ?? existing.areaM2;
    rows.set(entry.title, existing);
  });

  return [...rows.values()].sort((left, right) => right.kg - left.kg);
}
