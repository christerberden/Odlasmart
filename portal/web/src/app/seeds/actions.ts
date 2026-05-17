"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAuthState } from "@/lib/auth/workspaces";

type PersonalSeedInsertClient = {
  from(table: "personal_seeds"): {
    insert(values: {
      workspace_id: string;
      template_id?: string | null;
      crop: string;
      variety: string;
      family: string;
      latin_family?: string;
      method: string;
      schedule?: unknown;
      culture_time?: string;
      spacing?: string;
      row_spacing?: string;
      seed_per_75?: number | null;
      seed_per_m2?: number | null;
      expiration_year: number | null;
      notes: string;
    }): Promise<{ error: { message: string } | null }>;
  };
};

type SeedTemplateClient = {
  from(table: "seed_templates"): {
    select(columns: "id, family, latin_family, crop, variety, method, schedule, culture_time, spacing, row_spacing, seed_per_75, seed_per_m2"): {
      eq(column: "id" | "crop" | "variety", value: string): {
        eq(column: "variety", value: string): {
          limit(count: 1): Promise<{
            data: SeedTemplateCopyRow[] | null;
            error: { message: string } | null;
          }>;
        };
        maybeSingle(): Promise<{
          data: SeedTemplateCopyRow | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

type SeedTemplateSearchClient = {
  from(table: "seed_templates"): {
    select(columns: "id, family, latin_family, crop, variety, method, schedule, culture_time, spacing, row_spacing, seed_per_75, seed_per_m2"): {
      eq(column: "crop", value: string): {
        limit(count: 1): Promise<{
          data: SeedTemplateCopyRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

type SeedTemplateCopyRow = {
  id: string;
  family: string;
  latin_family: string;
  crop: string;
  variety: string;
  method: string;
  schedule: unknown;
  culture_time: string;
  spacing: string;
  row_spacing: string;
  seed_per_75: number | null;
  seed_per_m2: number | null;
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

async function findMatchingTemplate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  crop: string,
  variety: string,
) {
  const templateClient = supabase as unknown as SeedTemplateClient;
  const exactResult = await templateClient
    .from("seed_templates")
    .select("id, family, latin_family, crop, variety, method, schedule, culture_time, spacing, row_spacing, seed_per_75, seed_per_m2")
    .eq("crop", crop)
    .eq("variety", variety)
    .limit(1);

  if (exactResult.data?.[0]) {
    return exactResult.data[0];
  }

  const templateSearchClient = supabase as unknown as SeedTemplateSearchClient;
  const cropResult = await templateSearchClient
    .from("seed_templates")
    .select("id, family, latin_family, crop, variety, method, schedule, culture_time, spacing, row_spacing, seed_per_75, seed_per_m2")
    .eq("crop", crop)
    .limit(1);

  return cropResult.data?.[0] ?? null;
}

export async function createPersonalSeed(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const crop = getFormString(formData, "crop");
  const variety = getFormString(formData, "variety");

  if (!crop) {
    redirect("/seeds?error=Gröda krävs");
  }

  const supabase = await createSupabaseServerClient();
  const template = await findMatchingTemplate(supabase, crop, variety);
  const seedClient = supabase as unknown as PersonalSeedInsertClient;
  const { error } = await seedClient.from("personal_seeds").insert({
    workspace_id: workspace.id,
    template_id: template?.id ?? null,
    crop,
    variety,
    family: getFormString(formData, "family") || template?.family || "",
    latin_family: template?.latin_family ?? "",
    method: getFormString(formData, "method") || template?.method || "",
    schedule: template?.schedule ?? {},
    culture_time: template?.culture_time ?? "",
    spacing: template?.spacing ?? "",
    row_spacing: template?.row_spacing ?? "",
    seed_per_75: template?.seed_per_75 ?? null,
    seed_per_m2: template?.seed_per_m2 ?? null,
    expiration_year: getOptionalNumber(formData, "expirationYear"),
    notes: getFormString(formData, "notes"),
  });

  if (error) {
    redirect(`/seeds?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/seeds");
  redirect("/seeds");
}

export async function addSeedTemplateToPersonalSeeds(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const templateId = getFormString(formData, "templateId");

  if (!templateId) {
    redirect("/seeds?error=Frömall saknas");
  }

  const supabase = await createSupabaseServerClient();
  const templateClient = supabase as unknown as SeedTemplateClient;
  const { data: template, error: templateError } = await templateClient
    .from("seed_templates")
    .select("id, family, latin_family, crop, variety, method, schedule, culture_time, spacing, row_spacing, seed_per_75, seed_per_m2")
    .eq("id", templateId)
    .maybeSingle();

  if (templateError || !template) {
    redirect(`/seeds?error=${encodeURIComponent(templateError?.message ?? "Kunde inte hitta frömallen")}`);
  }

  const seedClient = supabase as unknown as PersonalSeedInsertClient;
  const { error } = await seedClient.from("personal_seeds").insert({
    workspace_id: workspace.id,
    template_id: template.id,
    crop: template.crop,
    variety: template.variety,
    family: template.family,
    latin_family: template.latin_family,
    method: template.method,
    schedule: template.schedule,
    culture_time: template.culture_time,
    spacing: template.spacing,
    row_spacing: template.row_spacing,
    seed_per_75: template.seed_per_75,
    seed_per_m2: template.seed_per_m2,
    expiration_year: getOptionalNumber(formData, "expirationYear"),
    notes: getFormString(formData, "notes"),
  });

  if (error) {
    redirect(`/seeds?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/seeds");
  redirect("/seeds");
}
