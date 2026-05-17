import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type WorkspacePreferencesClient = {
  from(table: "workspace_preferences"): {
    select(columns: "active_year, weather_location"): {
      eq(column: "workspace_id", value: string): {
        maybeSingle(): Promise<{
          data: Pick<Database["public"]["Tables"]["workspace_preferences"]["Row"], "active_year" | "weather_location"> | null;
        }>;
      };
    };
  };
};

export type WeatherLocation = {
  label?: string;
  latitude: number;
  longitude: number;
  name: string;
  source?: string;
};

export type WorkspacePreferences = {
  activeYear: number | null;
  weatherLocation: WeatherLocation | null;
};

function normalizeWeatherLocation(value: unknown): WeatherLocation | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const latitude = Number(candidate.latitude);
  const longitude = Number(candidate.longitude);
  const name = String(candidate.name ?? "").trim();

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !name) {
    return null;
  }

  return {
    label: typeof candidate.label === "string" ? candidate.label : undefined,
    latitude,
    longitude,
    name,
    source: typeof candidate.source === "string" ? candidate.source : undefined,
  };
}

export async function getWorkspacePreferences(workspaceId: string): Promise<WorkspacePreferences> {
  const supabase = await createSupabaseServerClient();
  const client = supabase as unknown as WorkspacePreferencesClient;
  const { data } = await client
    .from("workspace_preferences")
    .select("active_year, weather_location")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return {
    activeYear: data?.active_year ?? null,
    weatherLocation: normalizeWeatherLocation(data?.weather_location ?? null),
  };
}
