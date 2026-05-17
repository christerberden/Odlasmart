"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CropInsertClient = {
  from(table: "crops"): {
    insert(values: {
      workspace_id: string;
      personal_seed_id: string | null;
      title: string;
      batch_name: string;
      area_m2: number | null;
      note: string;
      start_year: number;
      end_year: number;
      schedule: CropSchedule;
    }): {
      select(columns: "id"): {
        single(): Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
  };
};

type CropFieldInsertClient = {
  from(table: "crop_fields"): {
    insert(values: {
      crop_id: string;
      field_id: string;
      planned_rows: number | null;
      planned_area_m2: number | null;
      row_spacing_cm?: number | null;
      plant_spacing_cm?: number | null;
      planned_seed_count?: number | null;
      seed_stock_batch_id?: string | null;
    }): Promise<{ error: { message: string } | null }>;
  };
};

type CropUpdateClient = {
  from(table: "crops"): {
    update(values: {
      batch_name: string;
      area_m2: number | null;
      note: string;
      start_year?: number;
      end_year?: number;
    }): {
      eq(column: "id", value: string): {
        eq(column: "workspace_id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type CropPlanUpdateClient = {
  from(table: "crops"): {
    update(values: {
      title?: string;
      batch_name?: string;
      area_m2?: number | null;
      note?: string;
      start_year?: number;
      end_year?: number;
      schedule?: CropSchedule;
    }): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type CropFieldDeleteClient = {
  from(table: "crop_fields"): {
    delete(): {
      eq(column: "crop_id", value: string): Promise<{ error: { message: string } | null }>;
    };
  };
};

type CropDeleteClient = {
  from(table: "crops"): {
    delete(): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type TaskInsertClient = {
  from(table: "tasks"): {
    insert(values: {
      workspace_id: string;
      crop_id: string;
      field_id: string;
      title: string;
      description: string;
      due_date: string;
      source: "system";
      legacy_event_id: string;
    }[]): Promise<{ error: { message: string } | null }>;
  };
};

type TaskDeleteClient = {
  from(table: "tasks"): {
    delete(): {
      eq(column: "workspace_id", value: string): {
        eq(column: "crop_id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type TaskStatusUpdateClient = {
  from(table: "tasks"): {
    update(values: { status: "open" | "done"; completed_at: string | null }): {
      eq(column: "workspace_id", value: string): {
        eq(column: "crop_id", value: string): {
          eq(column: "id", value: string): Promise<{ error: { message: string } | null }>;
        };
      };
    };
  };
};

type TaskFieldUpdateClient = {
  from(table: "tasks"): {
    update(values: { field_id: string; due_date?: string }): {
      eq(column: "crop_id", value: string): {
        eq(column: "workspace_id", value: string): {
          eq(column: "legacy_event_id", value: string): Promise<{ error: { message: string } | null }>;
        };
      };
    };
  };
};

type CropScheduleLookupClient = {
  from(table: "crops"): {
    select(columns: "id, title, schedule, start_year, end_year"): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): {
          maybeSingle(): Promise<{
            data: {
              id: string;
              title: string;
              schedule: unknown;
              start_year: number;
              end_year: number;
            } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

type SeedScheduleClient = {
  from(table: "personal_seeds"): {
    select(columns: "id, template_id, crop, variety, schedule"): {
      eq(column: "workspace_id", value: string): {
        eq(column: "id", value: string): {
          maybeSingle(): Promise<{
            data: {
              id: string;
              template_id: string | null;
              crop: string;
              variety: string;
              schedule: unknown;
            } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

type SeedTemplateClient = {
  from(table: "seed_templates"): {
    select(columns: "id, schedule, harvest_interval"): {
      eq(column: "id" | "crop" | "variety", value: string): {
        eq(column: "variety", value: string): {
          limit(count: 1): Promise<{
            data: { schedule: unknown; harvest_interval: number | null }[] | null;
            error: { message: string } | null;
          }>;
        };
        maybeSingle(): Promise<{
          data: { schedule: unknown; harvest_interval: number | null } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

type SeedTemplateSearchClient = {
  from(table: "seed_templates"): {
    select(columns: "id, schedule, harvest_interval"): {
      eq(column: "crop", value: string): {
        limit(count: 1): Promise<{
          data: { schedule: unknown; harvest_interval: number | null }[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

type CropSchedule = {
  forsaddStart: number | null;
  forsaddEnd: number | null;
  directStart: number | null;
  directEnd: number | null;
  transplantStart: number | null;
  transplantEnd: number | null;
  transplant: number | null;
  harvestStart: number | null;
  harvestEnd: number | null;
};

type SeedScheduleSource = {
  schedule: CropSchedule;
  harvestInterval: number | null;
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

function toOptionalWeek(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 53) {
    return null;
  }

  return parsed;
}

function getRecommendedWeek(startWeek: number | null, endWeek = startWeek) {
  if (!startWeek && !endWeek) {
    return null;
  }

  if (!startWeek || !endWeek) {
    return startWeek ?? endWeek ?? null;
  }

  return Math.round((startWeek + endWeek) / 2);
}

function normalizeSchedule(value: unknown): CropSchedule {
  const schedule = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const transplantStart = toOptionalWeek(schedule.transplantStart ?? schedule.transplant);
  const transplantEnd = toOptionalWeek(schedule.transplantEnd ?? schedule.transplant);

  return {
    forsaddStart: toOptionalWeek(schedule.forsaddStart),
    forsaddEnd: toOptionalWeek(schedule.forsaddEnd),
    directStart: toOptionalWeek(schedule.directStart),
    directEnd: toOptionalWeek(schedule.directEnd),
    transplantStart,
    transplantEnd,
    transplant: getRecommendedWeek(transplantStart, transplantEnd),
    harvestStart: toOptionalWeek(schedule.harvestStart),
    harvestEnd: toOptionalWeek(schedule.harvestEnd),
  };
}

function getIsoWeekDate(year: number, week: number) {
  const fourthOfJanuary = new Date(Date.UTC(year, 0, 4));
  const day = fourthOfJanuary.getUTCDay() || 7;
  const mondayOfWeekOne = new Date(fourthOfJanuary);
  mondayOfWeekOne.setUTCDate(fourthOfJanuary.getUTCDate() - day + 1);
  const date = new Date(mondayOfWeekOne);
  date.setUTCDate(mondayOfWeekOne.getUTCDate() + (week - 1) * 7);

  return date.toISOString().slice(0, 10);
}

function inferEndYear(startYear: number, schedule: CropSchedule) {
  const anchorWeek =
    schedule.forsaddStart ??
    schedule.directStart ??
    schedule.transplantStart ??
    schedule.transplant ??
    schedule.harvestStart ??
    schedule.harvestEnd ??
    schedule.transplantEnd ??
    schedule.directEnd ??
    schedule.forsaddEnd;

  if (!anchorWeek) {
    return startYear;
  }

  const weeks = Object.values(schedule).filter((value): value is number => typeof value === "number");
  return weeks.some((week) => week < anchorWeek) ? startYear + 1 : startYear;
}

function inferEventYear(startYear: number, endYear: number, schedule: CropSchedule, week: number) {
  const anchorWeek =
    schedule.forsaddStart ??
    schedule.directStart ??
    schedule.transplantStart ??
    schedule.transplant ??
    schedule.harvestStart ??
    schedule.harvestEnd ??
    schedule.transplantEnd ??
    schedule.directEnd ??
    schedule.forsaddEnd;

  if (anchorWeek && week < anchorWeek && endYear > startYear) {
    return endYear;
  }

  return startYear;
}

function getHarvestWeeks(schedule: CropSchedule, harvestInterval: number | null) {
  const startWeek = schedule.harvestStart;
  const endWeek = schedule.harvestEnd ?? startWeek;

  if (!startWeek || !endWeek) {
    return [];
  }

  const interval = Math.max(harvestInterval ?? 0, 0);

  if (!interval) {
    return [startWeek];
  }

  const weeks: number[] = [];
  for (let week = startWeek; week <= endWeek; week += interval) {
    weeks.push(week);
  }

  if (weeks[weeks.length - 1] !== endWeek) {
    weeks.push(endWeek);
  }

  return [...new Set(weeks)];
}

function getCropTasks(title: string, fieldId: string, schedule: CropSchedule, harvestInterval: number | null, startYear: number, endYear: number) {
  const tasks = [];
  const presowWeek = getRecommendedWeek(schedule.forsaddStart, schedule.forsaddEnd);
  const directWeek = getRecommendedWeek(schedule.directStart, schedule.directEnd);
  const transplantWeek = schedule.transplant ?? getRecommendedWeek(schedule.transplantStart, schedule.transplantEnd);

  if (presowWeek) {
    const year = inferEventYear(startYear, endYear, schedule, presowWeek);
    tasks.push({
      fieldId,
      title: `Förså ${title}`,
      description: `Automatiskt skapad från fröschemat, vecka ${presowWeek}.`,
      dueDate: getIsoWeekDate(year, presowWeek),
      legacyEventId: `forsadd-${presowWeek}`,
    });
  }

  if (directWeek) {
    const year = inferEventYear(startYear, endYear, schedule, directWeek);
    tasks.push({
      fieldId,
      title: `Direktså ${title}`,
      description: `Automatiskt skapad från fröschemat, vecka ${directWeek}.`,
      dueDate: getIsoWeekDate(year, directWeek),
      legacyEventId: `direktsadd-${directWeek}`,
    });
  }

  if (transplantWeek) {
    const year = inferEventYear(startYear, endYear, schedule, transplantWeek);
    tasks.push({
      fieldId,
      title: `Plantera ut ${title}`,
      description: `Automatiskt skapad från fröschemat, vecka ${transplantWeek}.`,
      dueDate: getIsoWeekDate(year, transplantWeek),
      legacyEventId: `utplantering-${transplantWeek}`,
    });
  }

  getHarvestWeeks(schedule, harvestInterval).forEach((week) => {
    const year = inferEventYear(startYear, endYear, schedule, week);
    tasks.push({
      fieldId,
      title: `Skörda ${title}`,
      description: `Automatiskt skapad från fröschemat, vecka ${week}.`,
      dueDate: getIsoWeekDate(year, week),
      legacyEventId: `skord-${week}`,
    });
  });

  return tasks;
}

async function getSeedScheduleSource(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  workspaceId: string,
  seedSourceId: string,
  cropTitle: string,
): Promise<SeedScheduleSource> {
  const templateClient = supabase as unknown as SeedTemplateClient;
  const templateSearchClient = supabase as unknown as SeedTemplateSearchClient;

  if (seedSourceId.startsWith("template:")) {
    const templateId = seedSourceId.replace("template:", "");
    const { data } = await templateClient
      .from("seed_templates")
      .select("id, schedule, harvest_interval")
      .eq("id", templateId)
      .maybeSingle();

    return {
      schedule: normalizeSchedule(data?.schedule),
      harvestInterval: data?.harvest_interval ?? null,
    };
  }

  const personalSeedId = seedSourceId.startsWith("personal:")
    ? seedSourceId.replace("personal:", "")
    : seedSourceId;

  const seedClient = supabase as unknown as SeedScheduleClient;
  const { data: personalSeed } = personalSeedId
    ? await seedClient
        .from("personal_seeds")
        .select("id, template_id, crop, variety, schedule")
        .eq("workspace_id", workspaceId)
        .eq("id", personalSeedId)
        .maybeSingle()
    : { data: null };

  const templateResult = personalSeed?.template_id
    ? await templateClient
        .from("seed_templates")
        .select("id, schedule, harvest_interval")
        .eq("id", personalSeed.template_id)
        .maybeSingle()
    : null;

  const fallbackResult = !templateResult?.data && personalSeed
    ? await templateClient
        .from("seed_templates")
        .select("id, schedule, harvest_interval")
        .eq("crop", personalSeed.crop)
        .eq("variety", personalSeed.variety)
        .limit(1)
    : null;

  const cropOnlyResult = !templateResult?.data && !fallbackResult?.data?.[0] && personalSeed
    ? await templateSearchClient
        .from("seed_templates")
        .select("id, schedule, harvest_interval")
        .eq("crop", personalSeed.crop)
        .limit(1)
    : null;

  const titleCrop = cropTitle.split(",")[0]?.trim();
  const titleResult = !templateResult?.data && !fallbackResult?.data?.[0] && !cropOnlyResult?.data?.[0] && titleCrop
    ? await templateSearchClient
        .from("seed_templates")
        .select("id, schedule, harvest_interval")
        .eq("crop", titleCrop)
        .limit(1)
    : null;

  const template =
    templateResult?.data ??
    fallbackResult?.data?.[0] ??
    cropOnlyResult?.data?.[0] ??
    titleResult?.data?.[0] ??
    null;
  const personalSchedule = normalizeSchedule(personalSeed?.schedule);
  const templateSchedule = normalizeSchedule(template?.schedule);
  const hasPersonalSchedule = Object.values(personalSchedule).some((value) => value != null);

  return {
    schedule: hasPersonalSchedule ? personalSchedule : templateSchedule,
    harvestInterval: template?.harvest_interval ?? null,
  };
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

export async function createCrop(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const title = getFormString(formData, "title");
  const fieldId = getFormString(formData, "fieldId");
  const seedSourceId = getFormString(formData, "personalSeedId");
  const personalSeedId = seedSourceId.startsWith("personal:")
    ? seedSourceId.replace("personal:", "")
    : null;

  if (!title) {
    redirect("/crops?error=Namn krävs");
  }

  if (!fieldId) {
    redirect("/crops?error=Välj odlingsyta");
  }

  const year = getOptionalNumber(formData, "startYear") ?? new Date().getFullYear();
  const areaM2 = getOptionalNumber(formData, "areaM2");
  const supabase = await createSupabaseServerClient();
  const { schedule: sourceSchedule, harvestInterval } = await getSeedScheduleSource(
    supabase,
    workspace.id,
    seedSourceId,
    title,
  );
  const getSubmittedWeek = (name: string, fallback: number | null) => (
    formData.has(name) ? toOptionalWeek(getFormString(formData, name)) : fallback
  );
  const schedule = {
    ...sourceSchedule,
    forsaddStart: getSubmittedWeek("forsaddStart", sourceSchedule.forsaddStart),
    forsaddEnd: getSubmittedWeek("forsaddEnd", sourceSchedule.forsaddEnd),
    directStart: getSubmittedWeek("directStart", sourceSchedule.directStart),
    directEnd: getSubmittedWeek("directEnd", sourceSchedule.directEnd),
    transplantStart: getSubmittedWeek("transplantStart", sourceSchedule.transplantStart),
    transplantEnd: getSubmittedWeek("transplantEnd", sourceSchedule.transplantEnd),
    harvestStart: getSubmittedWeek("harvestStart", sourceSchedule.harvestStart),
    harvestEnd: getSubmittedWeek("harvestEnd", sourceSchedule.harvestEnd),
  };
  schedule.transplant = getRecommendedWeek(schedule.transplantStart, schedule.transplantEnd);
  const endYear = inferEndYear(year, schedule);
  const cropClient = supabase as unknown as CropInsertClient;
  const { data, error } = await cropClient
    .from("crops")
    .insert({
      workspace_id: workspace.id,
      personal_seed_id: personalSeedId,
      title,
      batch_name: getFormString(formData, "batchName"),
      area_m2: areaM2,
      note: getFormString(formData, "note"),
      start_year: year,
      end_year: endYear,
      schedule,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/crops?error=${encodeURIComponent(error?.message ?? "Kunde inte skapa gröda")}`);
  }

  const cropFieldClient = supabase as unknown as CropFieldInsertClient;
  const { error: cropFieldError } = await cropFieldClient.from("crop_fields").insert({
    crop_id: data.id,
    field_id: fieldId,
    planned_rows: getOptionalNumber(formData, "plannedRows"),
    planned_area_m2: areaM2,
    row_spacing_cm: getOptionalNumber(formData, "rowSpacingCm"),
    plant_spacing_cm: getOptionalNumber(formData, "plantSpacingCm"),
    planned_seed_count: getOptionalNumber(formData, "plannedSeedCount"),
    seed_stock_batch_id: getFormString(formData, "seedStockBatchId") || null,
  });

  if (cropFieldError) {
    redirect(`/crops?error=${encodeURIComponent(cropFieldError.message)}`);
  }

  const cropTasks = getCropTasks(title, fieldId, schedule, harvestInterval, year, endYear);

  if (cropTasks.length > 0) {
    const taskClient = supabase as unknown as TaskInsertClient;
    const { error: taskError } = await taskClient.from("tasks").insert(
      cropTasks.map((task) => ({
        workspace_id: workspace.id,
        crop_id: data.id,
        field_id: fieldId,
        title: task.title,
        description: task.description,
        due_date: task.dueDate,
        source: "system",
        legacy_event_id: `${data.id}-${task.legacyEventId}`,
      })),
    );

    if (taskError) {
      redirect(`/crops?error=${encodeURIComponent(taskError.message)}`);
    }
  }

  revalidatePath("/crops");
  revalidatePath("/tasks");
  redirect("/crops");
}

export async function updateCropBasics(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const cropId = getFormString(formData, "cropId");
  const fieldId = getFormString(formData, "fieldId");

  if (!cropId) {
    redirect("/crops?error=Gröda saknas");
  }

  if (!fieldId) {
    redirect("/crops?error=Välj odlingsyta");
  }

  const areaM2 = getOptionalNumber(formData, "areaM2");
  const supabase = await createSupabaseServerClient();
  const cropScheduleClient = supabase as unknown as CropScheduleLookupClient;
  const { data: currentCrop } = await cropScheduleClient
    .from("crops")
    .select("id, title, schedule, start_year, end_year")
    .eq("workspace_id", workspace.id)
    .eq("id", cropId)
    .maybeSingle();
  const schedule = normalizeSchedule(currentCrop?.schedule);
  const startYear = Math.floor(getOptionalNumber(formData, "startYear") ?? currentCrop?.start_year ?? new Date().getFullYear());
  const endYear = inferEndYear(startYear, schedule);
  const cropClient = supabase as unknown as CropUpdateClient;
  const { error } = await cropClient
    .from("crops")
    .update({
      batch_name: getFormString(formData, "batchName"),
      area_m2: areaM2,
      note: getFormString(formData, "note"),
      start_year: startYear,
      end_year: endYear,
    })
    .eq("id", cropId)
    .eq("workspace_id", workspace.id);

  if (error) {
    redirect(`/crops?error=${encodeURIComponent(error.message)}`);
  }

  const cropFieldDeleteClient = supabase as unknown as CropFieldDeleteClient;
  const { error: deleteError } = await cropFieldDeleteClient
    .from("crop_fields")
    .delete()
    .eq("crop_id", cropId);

  if (deleteError) {
    redirect(`/crops?error=${encodeURIComponent(deleteError.message)}`);
  }

  const cropFieldClient = supabase as unknown as CropFieldInsertClient;
  const { error: cropFieldError } = await cropFieldClient.from("crop_fields").insert({
    crop_id: cropId,
    field_id: fieldId,
    planned_rows: getOptionalNumber(formData, "plannedRows"),
    planned_area_m2: areaM2,
    row_spacing_cm: getOptionalNumber(formData, "rowSpacingCm"),
    plant_spacing_cm: getOptionalNumber(formData, "plantSpacingCm"),
    planned_seed_count: getOptionalNumber(formData, "plannedSeedCount"),
    seed_stock_batch_id: getFormString(formData, "seedStockBatchId") || null,
  });

  if (cropFieldError) {
    redirect(`/crops?error=${encodeURIComponent(cropFieldError.message)}`);
  }

  const taskFieldClient = supabase as unknown as TaskFieldUpdateClient;
  const nextTasks = getCropTasks(currentCrop?.title ?? "", fieldId, schedule, null, startYear, endYear);
  for (const task of nextTasks) {
    const { error: taskFieldError } = await taskFieldClient
      .from("tasks")
      .update({ field_id: fieldId, due_date: task.dueDate })
      .eq("crop_id", cropId)
      .eq("workspace_id", workspace.id)
      .eq("legacy_event_id", `${cropId}-${task.legacyEventId}`);

    if (taskFieldError) {
      redirect(`/crops?error=${encodeURIComponent(taskFieldError.message)}`);
    }
  }

  revalidatePath("/crops");
  revalidatePath("/tasks");
  revalidatePath("/");
  redirect("/crops");
}

export async function updateCropScheduleAction(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const cropId = getFormString(formData, "cropId");
  const activity = getFormString(formData, "activity");
  const startWeek = toOptionalWeek(getFormString(formData, "startWeek"));
  const endWeek = toOptionalWeek(getFormString(formData, "endWeek"));

  if (!cropId || !activity || !startWeek || !endWeek) {
    redirect("/crops?error=Kunde inte flytta momentet");
  }

  const supabase = await createSupabaseServerClient();
  const { data: crop } = await supabase
    .from("crops")
    .select("id, schedule, start_year")
    .eq("workspace_id", workspace.id)
    .eq("id", cropId)
    .maybeSingle();
  const schedule = normalizeSchedule((crop as { schedule?: unknown } | null)?.schedule);

  if (activity === "forsadd") {
    schedule.forsaddStart = startWeek;
    schedule.forsaddEnd = endWeek;
  } else if (activity === "direktsadd") {
    schedule.directStart = startWeek;
    schedule.directEnd = endWeek;
  } else if (activity === "utplantering") {
    schedule.transplantStart = startWeek;
    schedule.transplantEnd = endWeek;
    schedule.transplant = getRecommendedWeek(startWeek, endWeek);
  } else if (activity === "skord") {
    schedule.harvestStart = startWeek;
    schedule.harvestEnd = endWeek;
  }

  const cropPlanUpdateClient = supabase as unknown as CropPlanUpdateClient;
  await cropPlanUpdateClient
    .from("crops")
    .update({
      schedule,
      end_year: inferEndYear((crop as { start_year?: number } | null)?.start_year ?? new Date().getFullYear(), schedule),
    })
    .eq("workspace_id", workspace.id)
    .eq("id", cropId);

  revalidatePath("/crops");
  revalidatePath("/tasks");
}

export async function updateCropPlanAction(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const cropId = getFormString(formData, "cropId");
  const fieldId = getFormString(formData, "fieldId");
  const title = getFormString(formData, "title");
  const startYear = Math.floor(getOptionalNumber(formData, "startYear") ?? new Date().getFullYear());
  const forsaddStart = toOptionalWeek(getFormString(formData, "forsaddStart"));
  const directStart = toOptionalWeek(getFormString(formData, "directStart"));
  const transplantStart = toOptionalWeek(getFormString(formData, "transplantStart"));
  const harvestStart = toOptionalWeek(getFormString(formData, "harvestStart"));
  const schedule: CropSchedule = {
    forsaddStart,
    forsaddEnd: toOptionalWeek(getFormString(formData, "forsaddEnd")) ?? forsaddStart,
    directStart,
    directEnd: toOptionalWeek(getFormString(formData, "directEnd")) ?? directStart,
    transplantStart,
    transplantEnd: toOptionalWeek(getFormString(formData, "transplantEnd")) ?? transplantStart,
    transplant: transplantStart,
    harvestStart,
    harvestEnd: toOptionalWeek(getFormString(formData, "harvestEnd")) ?? harvestStart,
  };

  if (!cropId || !fieldId || !title) {
    redirect("/crops?error=Gröda, namn och bädd krävs");
  }

  const areaM2 = getOptionalNumber(formData, "areaM2");
  const endYear = inferEndYear(startYear, schedule);
  const supabase = await createSupabaseServerClient();
  const cropPlanUpdateClient = supabase as unknown as CropPlanUpdateClient;
  const { error } = await cropPlanUpdateClient
    .from("crops")
    .update({
      title,
      batch_name: getFormString(formData, "batchName"),
      area_m2: areaM2,
      note: getFormString(formData, "note"),
      start_year: startYear,
      end_year: endYear,
      schedule,
    })
    .eq("workspace_id", workspace.id)
    .eq("id", cropId);

  if (error) {
    redirect(`/crops?error=${encodeURIComponent(error.message)}`);
  }

  const cropFieldDeleteClient = supabase as unknown as CropFieldDeleteClient;
  await cropFieldDeleteClient.from("crop_fields").delete().eq("crop_id", cropId);
  const cropFieldClient = supabase as unknown as CropFieldInsertClient;
  const { error: cropFieldError } = await cropFieldClient.from("crop_fields").insert({
    crop_id: cropId,
    field_id: fieldId,
    planned_rows: getOptionalNumber(formData, "plannedRows"),
    planned_area_m2: areaM2,
    row_spacing_cm: getOptionalNumber(formData, "rowSpacingCm"),
    plant_spacing_cm: getOptionalNumber(formData, "plantSpacingCm"),
    planned_seed_count: getOptionalNumber(formData, "plannedSeedCount"),
    seed_stock_batch_id: getFormString(formData, "seedStockBatchId") || null,
  });

  if (cropFieldError) {
    redirect(`/crops?error=${encodeURIComponent(cropFieldError.message)}`);
  }

  const allTaskIds = formData.getAll("taskId").map((value) => String(value));
  const doneTaskIds = new Set(formData.getAll("doneTaskId").map((value) => String(value)));
  const taskStatusClient = supabase as unknown as TaskStatusUpdateClient;

  for (const taskId of allTaskIds) {
    const isDone = doneTaskIds.has(taskId);
    const { error: taskStatusError } = await taskStatusClient
      .from("tasks")
      .update({
        status: isDone ? "done" : "open",
        completed_at: isDone ? new Date().toISOString() : null,
      })
      .eq("workspace_id", workspace.id)
      .eq("crop_id", cropId)
      .eq("id", taskId);

    if (taskStatusError) {
      redirect(`/crops?error=${encodeURIComponent(taskStatusError.message)}`);
    }
  }

  revalidatePath("/crops");
  revalidatePath("/tasks");
  revalidatePath("/");
  redirect("/crops");
}

export async function deleteCropAction(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const cropId = getFormString(formData, "cropId");

  if (!cropId) {
    redirect("/crops?error=Gröda saknas");
  }

  const supabase = await createSupabaseServerClient();
  const cropScheduleClient = supabase as unknown as CropScheduleLookupClient;
  const { data: crop } = await cropScheduleClient
    .from("crops")
    .select("id, title, schedule, start_year, end_year")
    .eq("workspace_id", workspace.id)
    .eq("id", cropId)
    .maybeSingle();

  if (!crop) {
    redirect("/crops?error=Grödan kunde inte hittas");
  }

  const taskDeleteClient = supabase as unknown as TaskDeleteClient;
  const { error: taskError } = await taskDeleteClient
    .from("tasks")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("crop_id", cropId);

  if (taskError) {
    redirect(`/crops?error=${encodeURIComponent(taskError.message)}`);
  }

  const cropFieldDeleteClient = supabase as unknown as CropFieldDeleteClient;
  const { error: fieldError } = await cropFieldDeleteClient
    .from("crop_fields")
    .delete()
    .eq("crop_id", cropId);

  if (fieldError) {
    redirect(`/crops?error=${encodeURIComponent(fieldError.message)}`);
  }

  const cropDeleteClient = supabase as unknown as CropDeleteClient;
  const { error: cropError } = await cropDeleteClient
    .from("crops")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", cropId);

  if (cropError) {
    redirect(`/crops?error=${encodeURIComponent(cropError.message)}`);
  }

  revalidatePath("/crops");
  revalidatePath("/tasks");
  revalidatePath("/");
  redirect("/crops");
}
