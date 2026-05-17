"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ResetClient = {
  from(table:
    | "crop_fields"
    | "crop_plantings"
    | "crops"
    | "fields"
    | "harvest_entries"
    | "personal_seeds"
    | "sections"
    | "seed_stock_batches"
    | "seed_stock_usages"
    | "tasks"
  ): {
    delete(): {
      eq(column: "workspace_id" | "crop_id", value: string): Promise<{ error: { message: string } | null }>;
      in(column: "crop_id", values: string[]): Promise<{ error: { message: string } | null }>;
    };
    select(columns: "id"): {
      eq(column: "workspace_id", value: string): Promise<{ data: { id: string }[] | null; error: { message: string } | null }>;
    };
  };
};

async function deleteByWorkspace(client: ResetClient, table: Parameters<ResetClient["from"]>[0], workspaceId: string) {
  const { error } = await client.from(table).delete().eq("workspace_id", workspaceId);
  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }
}

export async function resetWorkspaceDataAction() {
  const authState = await getCurrentAuthState();
  const workspace = authState.workspaces[0];

  if (!authState.user) {
    redirect("/login");
  }

  if (!workspace) {
    redirect("/onboarding");
  }

  if (workspace.role !== "owner" && workspace.role !== "admin") {
    redirect("/settings?error=Du saknar behörighet att nollställa workspace-data");
  }

  const supabase = await createSupabaseServerClient();
  const client = supabase as unknown as ResetClient;
  const { data: crops, error: cropsError } = await client
    .from("crops")
    .select("id")
    .eq("workspace_id", workspace.id);

  if (cropsError) {
    redirect(`/settings?error=${encodeURIComponent(cropsError.message)}`);
  }

  const cropIds = (crops ?? []).map((crop) => crop.id);
  if (cropIds.length > 0) {
    const { error } = await client.from("crop_fields").delete().in("crop_id", cropIds);
    if (error) {
      redirect(`/settings?error=${encodeURIComponent(error.message)}`);
    }
  }

  await deleteByWorkspace(client, "harvest_entries", workspace.id);
  await deleteByWorkspace(client, "crop_plantings", workspace.id);
  await deleteByWorkspace(client, "seed_stock_usages", workspace.id);
  await deleteByWorkspace(client, "tasks", workspace.id);
  await deleteByWorkspace(client, "crops", workspace.id);
  await deleteByWorkspace(client, "fields", workspace.id);
  await deleteByWorkspace(client, "sections", workspace.id);
  await deleteByWorkspace(client, "seed_stock_batches", workspace.id);
  await deleteByWorkspace(client, "personal_seeds", workspace.id);

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/harvest");
  revalidatePath("/crops");
  revalidatePath("/fields");
  revalidatePath("/inventory");
  revalidatePath("/settings");
  redirect("/settings?reset=done");
}
