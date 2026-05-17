import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TaskRow = {
  id: string;
  cropId: string | null;
  fieldId: string | null;
  title: string;
  description: string;
  status: "open" | "done" | "archived";
  dueDate: string | null;
  completedAt: string | null;
  source: "manual" | "import" | "system";
  legacyEventId: string | null;
};

type TaskQueryRow = {
  id: string;
  crop_id: string | null;
  field_id: string | null;
  title: string;
  description: string;
  status: "open" | "done" | "archived";
  due_date: string | null;
  completed_at: string | null;
  source: "manual" | "import" | "system";
  legacy_event_id: string | null;
};

export async function getTasks(workspaceId: string): Promise<TaskRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, crop_id, field_id, title, description, status, due_date, completed_at, source, legacy_event_id")
    .eq("workspace_id", workspaceId)
    .neq("status", "archived")
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data ?? []) as TaskQueryRow[]).map((task) => ({
    id: task.id,
    cropId: task.crop_id,
    fieldId: task.field_id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.due_date,
    completedAt: task.completed_at,
    source: task.source,
    legacyEventId: task.legacy_event_id,
  }));
}
