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

type PersonalSeedListClient = {
  from(table: "personal_seeds"): {
    select(columns: "id, crop, variety, schedule, seed_per_75, seed_per_m2"): {
      eq(column: "workspace_id", value: string): Promise<{
        data: {
          id: string;
          crop: string;
          variety: string;
          schedule: Json | null;
          seed_per_75: number | null;
          seed_per_m2: number | null;
        }[] | null;
        error: { message: string } | null;
      }>;
    };
  };
};

type SeedStockListClient = {
  from(table: "seed_stock_batches"): {
    select(columns: "id, personal_seed_id"): {
      eq(column: "workspace_id", value: string): Promise<{
        data: {
          id: string;
          personal_seed_id: string | null;
        }[] | null;
        error: { message: string } | null;
      }>;
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

function normalizeKeyPart(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("sv")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function seedIdentity(crop: string, variety: string) {
  return `${normalizeKeyPart(crop)}::${normalizeKeyPart(variety)}`;
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

type ImportedInventoryRow = {
  crop: string;
  variety: string;
  family: string;
  latinFamily: string;
  method: string;
  forsaddStart: number | null;
  forsaddEnd: number | null;
  transplantStart: number | null;
  transplantEnd: number | null;
  directStart: number | null;
  directEnd: number | null;
  harvestStart: number | null;
  harvestEnd: number | null;
  cultureTime: string;
  spacing: string;
  rowSpacing: string;
  quantity: number;
  purchaseYear: number | null;
  expirationYear: number | null;
  supplier: string;
  notes: string;
};

function parseImportedNumber(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseImportedInteger(value: unknown) {
  const parsed = parseImportedNumber(value);
  return parsed === null ? null : Math.floor(parsed);
}

function parseImportedRows(formData: FormData): ImportedInventoryRow[] {
  const payload = getFormString(formData, "rows");
  if (!payload) {
    redirect("/inventory?error=Ingen importfil valdes");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    redirect("/inventory?error=Importfilen kunde inte läsas");
  }

  if (!Array.isArray(parsed)) {
    redirect("/inventory?error=Importfilen har fel format");
  }

  return parsed
    .map((row) => (typeof row === "object" && row ? row as Record<string, unknown> : null))
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .map((row) => ({
      crop: String(row.crop ?? "").trim(),
      variety: String(row.variety ?? "").trim(),
      family: String(row.family ?? "").trim(),
      latinFamily: String(row.latinFamily ?? "").trim(),
      method: String(row.method ?? "").trim(),
      forsaddStart: parseImportedInteger(row.forsaddStart),
      forsaddEnd: parseImportedInteger(row.forsaddEnd),
      transplantStart: parseImportedInteger(row.transplantStart),
      transplantEnd: parseImportedInteger(row.transplantEnd),
      directStart: parseImportedInteger(row.directStart),
      directEnd: parseImportedInteger(row.directEnd),
      harvestStart: parseImportedInteger(row.harvestStart),
      harvestEnd: parseImportedInteger(row.harvestEnd),
      cultureTime: String(row.cultureTime ?? "").trim(),
      spacing: String(row.spacing ?? "").trim(),
      rowSpacing: String(row.rowSpacing ?? "").trim(),
      quantity: Math.max(0, Math.floor(parseImportedNumber(row.quantity) ?? 0)),
      purchaseYear: parseImportedInteger(row.purchaseYear),
      expirationYear: parseImportedInteger(row.expirationYear),
      supplier: String(row.supplier ?? "").trim(),
      notes: String(row.notes ?? "").trim(),
    }))
    .filter((row) => row.crop);
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

export async function importInventorySeeds(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const rows = parseImportedRows(formData);

  if (rows.length === 0) {
    redirect("/inventory?error=Importfilen innehöll inga frörader");
  }

  const supabase = await createSupabaseServerClient();
  const seedListClient = supabase as unknown as PersonalSeedListClient;
  const stockListClient = supabase as unknown as SeedStockListClient;
  const seedWriteClient = supabase as unknown as PersonalSeedWriteClient;
  const stockWriteClient = supabase as unknown as SeedStockSaveClient;

  const [{ data: existingSeeds, error: seedsError }, { data: existingStock, error: stockError }] = await Promise.all([
    seedListClient.from("personal_seeds").select("id, crop, variety, schedule, seed_per_75, seed_per_m2").eq("workspace_id", workspace.id),
    stockListClient.from("seed_stock_batches").select("id, personal_seed_id").eq("workspace_id", workspace.id),
  ]);

  if (seedsError) {
    redirect(`/inventory?error=${encodeURIComponent(seedsError.message)}`);
  }

  if (stockError) {
    redirect(`/inventory?error=${encodeURIComponent(stockError.message)}`);
  }

  const existingSeedMap = new Map(
    (existingSeeds ?? []).map((seed) => [seedIdentity(seed.crop, seed.variety), seed]),
  );
  const existingStockMap = new Map(
    (existingStock ?? [])
      .filter((batch) => batch.personal_seed_id)
      .map((batch) => [batch.personal_seed_id as string, batch]),
  );

  for (const row of rows) {
    const identity = seedIdentity(row.crop, row.variety);
    const existingSeed = existingSeedMap.get(identity) ?? null;
    const schedule = {
      forsaddStart: row.forsaddStart,
      forsaddEnd: row.forsaddEnd,
      transplantStart: row.transplantStart,
      transplantEnd: row.transplantEnd,
      directStart: row.directStart,
      directEnd: row.directEnd,
      harvestStart: row.harvestStart,
      harvestEnd: row.harvestEnd,
    } satisfies Json;

    const seedValues: PersonalSeedWriteValues = {
      workspace_id: workspace.id,
      template_id: null,
      family: row.family,
      latin_family: row.latinFamily,
      crop: row.crop,
      variety: row.variety,
      method: row.method,
      schedule,
      culture_time: row.cultureTime,
      spacing: row.spacing,
      row_spacing: row.rowSpacing,
      seed_per_75: existingSeed?.seed_per_75 ?? null,
      seed_per_m2: existingSeed?.seed_per_m2 ?? null,
      expiration_year: row.expirationYear,
      notes: row.notes,
    };

    const seedResult = existingSeed
      ? await seedWriteClient
          .from("personal_seeds")
          .update(seedValues)
          .eq("workspace_id", workspace.id)
          .eq("id", existingSeed.id)
          .select("id")
          .single()
      : await seedWriteClient
          .from("personal_seeds")
          .insert(seedValues)
          .select("id")
          .single();

    if (seedResult.error || !seedResult.data) {
      redirect(`/inventory?error=${encodeURIComponent(seedResult.error?.message ?? "Kunde inte importera frö")}`);
    }

    const personalSeedId = seedResult.data.id;
    const existingBatch = existingStockMap.get(personalSeedId) ?? null;
    const stockValues = {
      personal_seed_id: personalSeedId,
      name: [row.crop, row.variety].filter(Boolean).join(" - "),
      crop: row.crop,
      variety: row.variety,
      quantity: row.quantity,
      purchase_year: row.purchaseYear,
      expiration_year: row.expirationYear,
      supplier: row.supplier,
      notes: row.notes,
    };

    const stockResult = existingBatch
      ? await stockWriteClient
          .from("seed_stock_batches")
          .update(stockValues)
          .eq("workspace_id", workspace.id)
          .eq("id", existingBatch.id)
      : await stockWriteClient
          .from("seed_stock_batches")
          .insert({
            workspace_id: workspace.id,
            ...stockValues,
          });

    if (stockResult.error) {
      redirect(`/inventory?error=${encodeURIComponent(stockResult.error.message)}`);
    }
  }

  revalidateInventoryDependents();
  redirect("/inventory");
}
