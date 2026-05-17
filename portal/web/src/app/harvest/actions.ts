"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CropLookupClient = {
  from(table: "crops"): {
    select(columns: "id, personal_seed_id, title, area_m2"): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): {
          maybeSingle(): Promise<{
            data: {
              id: string;
              personal_seed_id: string | null;
              title: string;
              area_m2: number | null;
            } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

type CropFieldLookupClient = {
  from(table: "crop_fields"): {
    select(columns: "field_id"): {
      eq(column: "crop_id", value: string): {
        limit(count: 1): Promise<{
          data: { field_id: string }[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

type HarvestInsertClient = {
  from(table: "harvest_entries"): {
    insert(values: {
      workspace_id: string;
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
    }): Promise<{ error: { message: string } | null }>;
  };
};

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getFormString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function getIsoWeek(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));

  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

async function getActiveWorkspaceOrRedirect() {
  const authState = await getCurrentAuthState();
  const workspace = authState.workspaces[0];

  if (!authState.user) {
    redirect("/login");
  }

  if (!workspace) {
    redirect("/onboarding");
  }

  return workspace;
}

export async function createHarvestEntry(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const cropId = getFormString(formData, "cropId") || null;
  const selectedFieldId = getFormString(formData, "fieldId") || null;
  const kg = getOptionalNumber(formData, "kg");
  const now = new Date();
  const year = Math.floor(getOptionalNumber(formData, "year") ?? now.getFullYear());
  const week = Math.floor(getOptionalNumber(formData, "week") ?? getIsoWeek(now));
  const month = Math.floor(getOptionalNumber(formData, "month") ?? now.getMonth() + 1);

  if (kg == null || kg <= 0) {
    redirect("/harvest?error=Ange skörd i kilo");
  }

  if (week < 1 || week > 53) {
    redirect("/harvest?error=Vecka måste vara mellan 1 och 53");
  }

  if (month < 1 || month > 12) {
    redirect("/harvest?error=Månad måste vara mellan 1 och 12");
  }

  const supabase = await createSupabaseServerClient();
  const cropClient = supabase as unknown as CropLookupClient;
  const { data: crop } = cropId
    ? await cropClient
        .from("crops")
        .select("id, personal_seed_id, title, area_m2")
        .eq("workspace_id", workspace.id)
        .eq("id", cropId)
        .maybeSingle()
    : { data: null };
  const cropFieldClient = supabase as unknown as CropFieldLookupClient;
  const { data: cropFields } = crop?.id && !selectedFieldId
    ? await cropFieldClient
        .from("crop_fields")
        .select("field_id")
        .eq("crop_id", crop.id)
        .limit(1)
    : { data: null };
  const title = crop?.title ?? getFormString(formData, "title");

  if (!title) {
    redirect("/harvest?error=Välj gröda eller ange titel");
  }

  const harvestClient = supabase as unknown as HarvestInsertClient;
  const { error } = await harvestClient.from("harvest_entries").insert({
    workspace_id: workspace.id,
    crop_id: crop?.id ?? null,
    field_id: selectedFieldId ?? cropFields?.[0]?.field_id ?? null,
    personal_seed_id: crop?.personal_seed_id ?? null,
    title,
    kg,
    area_m2: getOptionalNumber(formData, "areaM2") ?? crop?.area_m2 ?? null,
    week,
    month,
    year,
    manual: !crop,
    more_to_harvest: getFormString(formData, "moreToHarvest") === "on",
  });

  if (error) {
    redirect(`/harvest?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/harvest");
  revalidatePath("/");
  redirect("/harvest");
}
