import { NextResponse } from "next/server";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type WorkspacePreferencesClient = {
  from(table: "workspace_preferences"): {
    upsert(
      values: Database["public"]["Tables"]["workspace_preferences"]["Insert"][],
      options: { onConflict: string },
    ): Promise<{ error: { message: string } | null }>;
  };
};

export async function POST(request: Request) {
  const authState = await getCurrentAuthState();
  const activeWorkspace = authState.workspaces[0] ?? null;

  if (!authState.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!activeWorkspace) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  const body = await request.json();
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  const name = String(body?.name ?? "").trim();

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !name) {
    return NextResponse.json({ error: "Invalid weather location" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const client = supabase as unknown as WorkspacePreferencesClient;
  const payload: Database["public"]["Tables"]["workspace_preferences"]["Insert"] = {
    weather_location: {
      label: typeof body?.label === "string" ? body.label : name,
      latitude,
      longitude,
      name,
      source: typeof body?.source === "string" ? body.source : "smhi",
    },
    workspace_id: activeWorkspace.id,
  };
  const { error } = await client
    .from("workspace_preferences")
    .upsert(
      [payload],
      {
        onConflict: "workspace_id",
      },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
