import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type WorkspacePreferencesClient = {
  from(table: "workspace_preferences"): {
    select(columns: "active_year, weather_location, frost_window"): {
      eq(column: "workspace_id", value: string): {
        maybeSingle(): Promise<{
          data: Pick<Database["public"]["Tables"]["workspace_preferences"]["Row"], "active_year" | "weather_location" | "frost_window"> | null;
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
  frostWindow: FrostWindow | null;
  weatherLocation: WeatherLocation | null;
};

export type FrostWindow = {
  lastSpringWeek: number;
  springRiskStartWeek: number;
  springRiskEndWeek: number;
  firstAutumnWeek: number;
  autumnRiskStartWeek: number;
  autumnRiskEndWeek: number;
  sourceLabel?: string;
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

function normalizeFrostWindow(value: unknown): FrostWindow | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const lastSpringWeek = Number(candidate.lastSpringWeek);
  const firstAutumnWeek = Number(candidate.firstAutumnWeek);

  if (!Number.isFinite(lastSpringWeek) || !Number.isFinite(firstAutumnWeek)) {
    return null;
  }

  const springRiskStartWeek = Number(candidate.springRiskStartWeek);
  const springRiskEndWeek = Number(candidate.springRiskEndWeek);
  const autumnRiskStartWeek = Number(candidate.autumnRiskStartWeek);
  const autumnRiskEndWeek = Number(candidate.autumnRiskEndWeek);

  return {
    lastSpringWeek,
    springRiskStartWeek: Number.isFinite(springRiskStartWeek) ? springRiskStartWeek : lastSpringWeek,
    springRiskEndWeek: Number.isFinite(springRiskEndWeek) ? springRiskEndWeek : lastSpringWeek,
    firstAutumnWeek,
    autumnRiskStartWeek: Number.isFinite(autumnRiskStartWeek) ? autumnRiskStartWeek : firstAutumnWeek,
    autumnRiskEndWeek: Number.isFinite(autumnRiskEndWeek) ? autumnRiskEndWeek : firstAutumnWeek,
    sourceLabel: typeof candidate.sourceLabel === "string" ? candidate.sourceLabel : undefined,
  };
}

export async function getWorkspacePreferences(workspaceId: string): Promise<WorkspacePreferences> {
  const supabase = await createSupabaseServerClient();
  const client = supabase as unknown as WorkspacePreferencesClient;
  const { data } = await client
    .from("workspace_preferences")
    .select("active_year, weather_location, frost_window")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return {
    activeYear: data?.active_year ?? null,
    frostWindow: normalizeFrostWindow(data?.frost_window ?? null),
    weatherLocation: normalizeWeatherLocation(data?.weather_location ?? null),
  };
}
