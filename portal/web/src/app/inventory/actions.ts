"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

type SeedStockWriteValues = {
  personal_seed_id: string | null;
  name: string;
  crop: string;
  variety: string;
  quantity: number;
  purchase_year: number | null;
  expiration_year: number | null;
  supplier: string;
  notes: string;
};

type SeedStockInsertClient = {
  from(table: "seed_stock_batches"): {
    insert(values: SeedStockWriteValues & { workspace_id: string }): Promise<{ error: { message: string } | null }>;
  };
};

type SeedStockUpdateClient = {
  from(table: "seed_stock_batches"): {
    update(values: SeedStockWriteValues): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type SeedStockDeleteClient = {
  from(table: "seed_stock_batches"): {
    delete(): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type SeedStockSaveClient = {
  from(table: "seed_stock_batches"): {
    insert(values: SeedStockWriteValues & { workspace_id: string }): Promise<{ error: { message: string } | null }>;
    update(values: SeedStockWriteValues): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type PersonalSeedWriteValues = {
  workspace_id: string;
  template_id: string | null;
  family: string;
  latin_family: string;
  crop: string;
  variety: string;
  method: string;
  schedule: Json;
  culture_time: string;
  spacing: string;
  row_spacing: string;
  seed_per_75: number | null;
  seed_per_m2: number | null;
  expiration_year: number | null;
  notes: string;
};

type PersonalSeedWriteClient = {
  from(table: "personal_seeds"): {
    insert(values: PersonalSeedWriteValues): {
      select(columns: "id"): {
        single(): Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
    update(values: PersonalSeedWriteValues): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): {
          select(columns: "id"): {
            single(): Promise<{ data: { id: string } | null; error: { message: string } | null }>;
          };
        };
      };
    };
    delete(): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type PersonalSeedLookupClient = {
  from(table: "personal_seeds"): {
    select(columns: "id, crop, variety"): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): {
          maybeSingle(): Promise<{
            data: { id: string; crop: string; variety: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
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

function getOptionalInteger(formData: FormData, key: string) {
  const value = getOptionalNumber(formData, key);
  return value === null ? null : Math.floor(value);
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

async function readSeedStockValues(formData: FormData, workspaceId: string) {
  const quantity = Math.max(0, Math.floor(getOptionalNumber(formData, "quantity") ?? 0));
  const personalSeedId = getFormString(formData, "personalSeedId") || null;
  const supabase = await createSupabaseServerClient();
  const seedClient = supabase as unknown as PersonalSeedLookupClient;
  const { data: personalSeed, error: seedError } = personalSeedId
    ? await seedClient
        .from("personal_seeds")
        .select("id, crop, variety")
        .eq("workspace_id", workspaceId)
        .eq("id", personalSeedId)
        .maybeSingle()
    : { data: null, error: null };

  if (seedError) {
    redirect(`/inventory?error=${encodeURIComponent(seedError.message)}`);
  }

  const crop = getFormString(formData, "crop") || personalSeed?.crop || "";
  const variety = getFormString(formData, "variety") || personalSeed?.variety || "";

  if (!crop) {
    redirect("/inventory?error=Gröda krävs");
  }

  return {
    supabase,
    values: {
      personal_seed_id: personalSeedId,
      name: getFormString(formData, "name") || [crop, variety].filter(Boolean).join(" - "),
      crop,
      variety,
      quantity,
      purchase_year: getOptionalNumber(formData, "purchaseYear"),
      expiration_year: getOptionalNumber(formData, "expirationYear"),
      supplier: getFormString(formData, "supplier"),
      notes: getFormString(formData, "notes"),
    },
  };
}

function revalidateInventoryDependents() {
  revalidatePath("/inventory");
  revalidatePath("/crops");
  revalidatePath("/tasks");
  revalidatePath("/");
}

function readSchedule(formData: FormData): Json {
  return {
    forsaddStart: getOptionalInteger(formData, "forsaddStart"),
    forsaddEnd: getOptionalInteger(formData, "forsaddEnd"),
    transplantStart: getOptionalInteger(formData, "transplantStart"),
    transplantEnd: getOptionalInteger(formData, "transplantEnd"),
    directStart: getOptionalInteger(formData, "directStart"),
    directEnd: getOptionalInteger(formData, "directEnd"),
    harvestStart: getOptionalInteger(formData, "harvestStart"),
    harvestEnd: getOptionalInteger(formData, "harvestEnd"),
  };
}

function readPersonalSeedValues(formData: FormData, workspaceId: string): PersonalSeedWriteValues {
  const crop = getFormString(formData, "crop");

  if (!crop) {
    redirect("/inventory?error=Gröda krävs");
  }

  return {
    workspace_id: workspaceId,
    template_id: getFormString(formData, "templateId") || null,
    family: getFormString(formData, "family"),
    latin_family: getFormString(formData, "latinFamily"),
    crop,
    variety: getFormString(formData, "variety"),
    method: getFormString(formData, "method"),
    schedule: readSchedule(formData),
    culture_time: getFormString(formData, "cultureTime"),
    spacing: getFormString(formData, "spacing"),
    row_spacing: getFormString(formData, "rowSpacing"),
    seed_per_75: getOptionalNumber(formData, "seedPer75"),
    seed_per_m2: getOptionalNumber(formData, "seedPerM2"),
    expiration_year: getOptionalInteger(formData, "expirationYear"),
    notes: getFormString(formData, "notes"),
  };
}

function readStockValues(formData: FormData, personalSeedId: string, crop: string, variety: string) {
  return {
    personal_seed_id: personalSeedId,
    name: getFormString(formData, "name") || [crop, variety].filter(Boolean).join(" - "),
    crop,
    variety,
    quantity: Math.max(0, Math.floor(getOptionalNumber(formData, "quantity") ?? 0)),
    purchase_year: getOptionalInteger(formData, "purchaseYear"),
    expiration_year: getOptionalInteger(formData, "expirationYear"),
    supplier: getFormString(formData, "supplier"),
    notes: getFormString(formData, "notes"),
  };
}

export async function saveInventorySeed(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const supabase = await createSupabaseServerClient();
  const seedClient = supabase as unknown as PersonalSeedWriteClient;
  const personalSeedId = getFormString(formData, "personalSeedId");
  const stockId = getFormString(formData, "stockId");
  const seedValues = readPersonalSeedValues(formData, workspace.id);

  const seedResult = personalSeedId
    ? await seedClient
        .from("personal_seeds")
        .update(seedValues)
        .eq("workspace_id", workspace.id)
        .eq("id", personalSeedId)
        .select("id")
        .single()
    : await seedClient
        .from("personal_seeds")
        .insert(seedValues)
        .select("id")
        .single();

  if (seedResult.error || !seedResult.data) {
    redirect(`/inventory?error=${encodeURIComponent(seedResult.error?.message ?? "Kunde inte spara frö")}`);
  }

  const savedPersonalSeedId = seedResult.data.id;
  const stockValues = readStockValues(formData, savedPersonalSeedId, seedValues.crop, seedValues.variety);
  const stockClient = supabase as unknown as SeedStockSaveClient;
  const stockResult = stockId
    ? await stockClient
        .from("seed_stock_batches")
        .update(stockValues)
        .eq("workspace_id", workspace.id)
        .eq("id", stockId)
    : await stockClient.from("seed_stock_batches").insert({
        workspace_id: workspace.id,
        ...stockValues,
      });

  if (stockResult.error) {
    redirect(`/inventory?error=${encodeURIComponent(stockResult.error.message)}`);
  }

  revalidateInventoryDependents();
  redirect("/inventory");
}

export async function deleteInventorySeed(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const supabase = await createSupabaseServerClient();
  const seedClient = supabase as unknown as PersonalSeedWriteClient;
  const personalSeedId = getFormString(formData, "personalSeedId");
  const stockId = getFormString(formData, "stockId");

  if (stockId) {
    const { error } = await supabase
      .from("seed_stock_batches")
      .delete()
      .eq("workspace_id", workspace.id)
      .eq("id", stockId);

    if (error) {
      redirect(`/inventory?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (personalSeedId) {
    const { error } = await seedClient
      .from("personal_seeds")
      .delete()
      .eq("workspace_id", workspace.id)
      .eq("id", personalSeedId);

    if (error) {
      redirect(`/inventory?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidateInventoryDependents();
  redirect("/inventory");
}

export async function createSeedStockBatch(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const { supabase, values } = await readSeedStockValues(formData, workspace.id);

  const stockClient = supabase as unknown as SeedStockInsertClient;
  const { error } = await stockClient.from("seed_stock_batches").insert({
    workspace_id: workspace.id,
    ...values,
  });

  if (error) {
    redirect(`/inventory?error=${encodeURIComponent(error.message)}`);
  }

  revalidateInventoryDependents();
  redirect("/inventory");
}

export async function updateSeedStockBatch(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const stockId = getFormString(formData, "stockId");

  if (!stockId) {
    redirect("/inventory?error=Lagerpost saknas");
  }

  const { supabase, values } = await readSeedStockValues(formData, workspace.id);
  const stockClient = supabase as unknown as SeedStockUpdateClient;
  const { error } = await stockClient
    .from("seed_stock_batches")
    .update(values)
    .eq("workspace_id", workspace.id)
    .eq("id", stockId);

  if (error) {
    redirect(`/inventory?error=${encodeURIComponent(error.message)}`);
  }

  revalidateInventoryDependents();
  redirect("/inventory");
}

export async function deleteSeedStockBatch(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const stockId = getFormString(formData, "stockId");

  if (!stockId) {
    redirect("/inventory?error=Lagerpost saknas");
  }

  const supabase = await createSupabaseServerClient();
  const stockClient = supabase as unknown as SeedStockDeleteClient;
  const { error } = await stockClient
    .from("seed_stock_batches")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", stockId);

  if (error) {
    redirect(`/inventory?error=${encodeURIComponent(error.message)}`);
  }

  revalidateInventoryDependents();
  redirect("/inventory");
}
