import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DatabaseStatus = {
  state: "ready" | "auth-required" | "empty" | "error";
  label: string;
  detail: string;
  seedTemplateCount: number | null;
};

export type SeedTemplatePreview = {
  id: string;
  crop: string;
  variety: string;
  family: string;
  method: string;
};

function classifySupabaseError(message: string): DatabaseStatus {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("jwt") ||
    normalized.includes("permission") ||
    normalized.includes("row-level security") ||
    normalized.includes("not authenticated")
  ) {
    return {
      detail: "Schemat svarar, men RLS väntar på inloggning innan data visas.",
      label: "Supabase ansluten",
      seedTemplateCount: null,
      state: "auth-required",
    };
  }

  return {
    detail: message,
    label: "Databaskontroll stoppade",
    seedTemplateCount: null,
    state: "error",
  };
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("seed_templates")
    .select("id", { count: "exact", head: true });

  if (error) {
    return classifySupabaseError(error.message);
  }

  if (!count) {
    return {
      detail: "Tabellerna finns. Nästa steg är att importera frökatalogen.",
      label: "Databasen är redo",
      seedTemplateCount: 0,
      state: "empty",
    };
  }

  return {
    detail: `${count} frömallar finns i systemkatalogen.`,
    label: "Databasen har frödata",
    seedTemplateCount: count,
    state: "ready",
  };
}

export async function getSeedTemplatePreview(): Promise<SeedTemplatePreview[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("seed_templates")
    .select("id, crop, variety, family, method")
    .order("crop", { ascending: true })
    .order("variety", { ascending: true });

  if (error) {
    return [];
  }

  return data;
}
