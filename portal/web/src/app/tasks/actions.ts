"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TaskUpdateClient = {
  from(table: "tasks"): {
    update(values: {
      status: "done";
      completed_at: string;
    }): {
      eq(column: "id", value: string): {
        eq(column: "workspace_id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type SeedStockLookupClient = {
  from(table: "seed_stock_batches"): {
    select(columns: "id, quantity"): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): {
          maybeSingle(): Promise<{
            data: { id: string; quantity: number } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    update(values: { quantity: number }): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type SeedStockUsageInsertClient = {
  from(table: "seed_stock_usages"): {
    insert(values: {
      workspace_id: string;
      seed_stock_batch_id: string;
      task_id: string;
      crop_id: string | null;
      seed_count: number;
      note: string;
    }): Promise<{ error: { message: string } | null }>;
  };
};

type TaskLookupClient = {
  from(table: "tasks"): {
    select(columns: "id, crop_id, field_id, title, due_date, legacy_event_id"): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): {
          maybeSingle(): Promise<{
            data: {
              id: string;
              crop_id: string | null;
              field_id: string | null;
              title: string;
              due_date: string | null;
              legacy_event_id: string | null;
            } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

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

type CropPlantingInsertClient = {
  from(table: "crop_plantings"): {
    insert(values: {
      workspace_id: string;
      crop_id: string | null;
      field_id: string | null;
      task_id: string;
      plant_count: number | null;
      row_count: number | null;
      area_m2: number | null;
      note: string;
    }): Promise<{ error: { message: string } | null }>;
  };
};

type HarvestInsertClient = {
  from(table: "harvest_entries"): {
    insert(values: {
      workspace_id: string;
      crop_id: string | null;
      field_id: string | null;
      personal_seed_id: string | null;
      legacy_event_id: string | null;
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

function getIsoWeek(date: Date) {
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

export async function completeTask(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const taskId = getFormString(formData, "taskId");

  if (!taskId) {
    redirect("/tasks?error=Uppgift saknas");
  }

  const supabase = await createSupabaseServerClient();
  const taskLookup = supabase as unknown as TaskLookupClient;
  const { data: task } = await taskLookup
    .from("tasks")
    .select("id, crop_id, field_id, title, due_date, legacy_event_id")
    .eq("workspace_id", workspace.id)
    .eq("id", taskId)
    .maybeSingle();

  if (!task) {
    redirect("/tasks?error=Uppgiften kunde inte hittas");
  }

  const taskClient = supabase as unknown as TaskUpdateClient;
  const { error } = await taskClient
    .from("tasks")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("workspace_id", workspace.id);

  if (error) {
    redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  redirect("/tasks");
}

export async function completeSowingTask(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const taskId = getFormString(formData, "taskId");
  const stockBatchId = getFormString(formData, "stockBatchId");
  const seedCount = Math.floor(getOptionalNumber(formData, "seedCount") ?? 0);

  if (!taskId) {
    redirect("/tasks?error=Uppgift saknas");
  }

  if (!stockBatchId) {
    redirect("/tasks?error=Valj lagerpost for sadd");
  }

  if (seedCount <= 0) {
    redirect("/tasks?error=Ange antal froer");
  }

  const supabase = await createSupabaseServerClient();
  const taskLookup = supabase as unknown as TaskLookupClient;
  const { data: task } = await taskLookup
    .from("tasks")
    .select("id, crop_id, field_id, title, due_date, legacy_event_id")
    .eq("workspace_id", workspace.id)
    .eq("id", taskId)
    .maybeSingle();

  if (!task) {
    redirect("/tasks?error=Uppgiften kunde inte hittas");
  }

  const stockClient = supabase as unknown as SeedStockLookupClient;
  const { data: stockBatch, error: stockLookupError } = await stockClient
    .from("seed_stock_batches")
    .select("id, quantity")
    .eq("workspace_id", workspace.id)
    .eq("id", stockBatchId)
    .maybeSingle();

  if (stockLookupError || !stockBatch) {
    redirect(`/tasks?error=${encodeURIComponent(stockLookupError?.message ?? "Lagerposten kunde inte hittas")}`);
  }

  if (stockBatch.quantity < seedCount) {
    redirect("/tasks?error=Det finns inte tillrackligt manga froer i lagerposten");
  }

  const { error: stockUpdateError } = await stockClient
    .from("seed_stock_batches")
    .update({ quantity: stockBatch.quantity - seedCount })
    .eq("workspace_id", workspace.id)
    .eq("id", stockBatchId);

  if (stockUpdateError) {
    redirect(`/tasks?error=${encodeURIComponent(stockUpdateError.message)}`);
  }

  const usageClient = supabase as unknown as SeedStockUsageInsertClient;
  const { error: usageError } = await usageClient.from("seed_stock_usages").insert({
    workspace_id: workspace.id,
    seed_stock_batch_id: stockBatchId,
    task_id: taskId,
    crop_id: task.crop_id,
    seed_count: seedCount,
    note: task.title,
  });

  if (usageError) {
    redirect(`/tasks?error=${encodeURIComponent(usageError.message)}`);
  }

  const taskClient = supabase as unknown as TaskUpdateClient;
  const { error: taskError } = await taskClient
    .from("tasks")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("workspace_id", workspace.id);

  if (taskError) {
    redirect(`/tasks?error=${encodeURIComponent(taskError.message)}`);
  }

  revalidatePath("/tasks");
  revalidatePath("/inventory");
  revalidatePath("/");
  redirect("/tasks");
}

export async function completeTransplantTask(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const taskId = getFormString(formData, "taskId");

  if (!taskId) {
    redirect("/tasks?error=Uppgift saknas");
  }

  const supabase = await createSupabaseServerClient();
  const taskLookup = supabase as unknown as TaskLookupClient;
  const { data: task } = await taskLookup
    .from("tasks")
    .select("id, crop_id, field_id, title, due_date, legacy_event_id")
    .eq("workspace_id", workspace.id)
    .eq("id", taskId)
    .maybeSingle();

  if (!task) {
    redirect("/tasks?error=Uppgiften kunde inte hittas");
  }

  const plantingClient = supabase as unknown as CropPlantingInsertClient;
  const { error: plantingError } = await plantingClient.from("crop_plantings").insert({
    workspace_id: workspace.id,
    crop_id: task.crop_id,
    field_id: task.field_id,
    task_id: task.id,
    plant_count: getOptionalNumber(formData, "plantCount"),
    row_count: getOptionalNumber(formData, "rowCount"),
    area_m2: getOptionalNumber(formData, "areaM2"),
    note: getFormString(formData, "note") || task.title,
  });

  if (plantingError) {
    redirect(`/tasks?error=${encodeURIComponent(plantingError.message)}`);
  }

  const taskClient = supabase as unknown as TaskUpdateClient;
  const { error: taskError } = await taskClient
    .from("tasks")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("workspace_id", workspace.id);

  if (taskError) {
    redirect(`/tasks?error=${encodeURIComponent(taskError.message)}`);
  }

  revalidatePath("/tasks");
  revalidatePath("/crops");
  revalidatePath("/");
  redirect("/tasks");
}

export async function registerHarvestForTask(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const taskId = getFormString(formData, "taskId");
  const kg = getOptionalNumber(formData, "kg");

  if (!taskId) {
    redirect("/tasks?error=Uppgift saknas");
  }

  if (kg == null || kg <= 0) {
    redirect("/tasks?error=Ange skörd i kilo");
  }

  const supabase = await createSupabaseServerClient();
  const taskLookup = supabase as unknown as TaskLookupClient;
  const { data: task } = await taskLookup
    .from("tasks")
    .select("id, crop_id, field_id, title, due_date, legacy_event_id")
    .eq("workspace_id", workspace.id)
    .eq("id", taskId)
    .maybeSingle();

  if (!task) {
    redirect("/tasks?error=Uppgiften kunde inte hittas");
  }

  const cropLookup = supabase as unknown as CropLookupClient;
  const { data: crop } = task.crop_id
    ? await cropLookup
        .from("crops")
        .select("id, personal_seed_id, title, area_m2")
        .eq("workspace_id", workspace.id)
        .eq("id", task.crop_id)
        .maybeSingle()
    : { data: null };
  const date = task.due_date ? new Date(`${task.due_date}T00:00:00`) : new Date();
  const moreToHarvest = getFormString(formData, "moreToHarvest") === "on";
  const harvestClient = supabase as unknown as HarvestInsertClient;
  const { error: harvestError } = await harvestClient.from("harvest_entries").insert({
    workspace_id: workspace.id,
    crop_id: crop?.id ?? null,
    field_id: task.field_id,
    personal_seed_id: crop?.personal_seed_id ?? null,
    legacy_event_id: task.legacy_event_id,
    title: crop?.title ?? task.title.replace(/^Skörda\s+/i, ""),
    kg,
    area_m2: crop?.area_m2 ?? null,
    week: getIsoWeek(date),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    manual: false,
    more_to_harvest: moreToHarvest,
  });

  if (harvestError) {
    redirect(`/tasks?error=${encodeURIComponent(harvestError.message)}`);
  }

  if (!moreToHarvest) {
    const taskClient = supabase as unknown as TaskUpdateClient;
    const { error: taskError } = await taskClient
      .from("tasks")
      .update({
        status: "done",
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspace.id);

    if (taskError) {
      redirect(`/tasks?error=${encodeURIComponent(taskError.message)}`);
    }
  }

  revalidatePath("/tasks");
  revalidatePath("/harvest");
  revalidatePath("/");
  redirect("/tasks");
}
