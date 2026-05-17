import { NextResponse } from "next/server";
import type { WeatherLocation } from "@/lib/data/preferences";

type SmhiStation = {
  active?: boolean;
  latitude?: number;
  longitude?: number;
  name?: string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("sv-SE");
}

function sanitizeSmhiStationName(name: string) {
  return String(name ?? "")
    .replace(/\s+Flygplats$/i, "")
    .replace(/\s+Frösön\s+Flygplats$/i, "")
    .replace(/\s+Aut$/i, "")
    .replace(/\s+A$/i, "")
    .trim();
}

function toWeatherLocation(station: SmhiStation): WeatherLocation | null {
  const latitude = Number(station.latitude);
  const longitude = Number(station.longitude);
  const name = sanitizeSmhiStationName(station.name ?? "");

  if (!station.active || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !name) {
    return null;
  }

  return {
    label: name,
    latitude,
    longitude,
    name,
    source: "smhi",
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = String(searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const response = await fetch("https://opendata-download-metobs.smhi.se/api/version/latest/parameter/19.json", {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return NextResponse.json({ suggestions: [] }, { status: 502 });
  }

  const data = await response.json();
  const normalizedQuery = normalizeText(query);
  const unique = new Map<string, WeatherLocation>();

  for (const station of (data.station ?? []) as SmhiStation[]) {
    const suggestion = toWeatherLocation(station);
    if (!suggestion) {
      continue;
    }
    const normalizedName = normalizeText(suggestion.name);
    if (!normalizedName.includes(normalizedQuery)) {
      continue;
    }
    if (!unique.has(normalizedName)) {
      unique.set(normalizedName, suggestion);
    }
  }

  const suggestions = [...unique.values()]
    .sort((left, right) => {
      const leftName = normalizeText(left.name);
      const rightName = normalizeText(right.name);
      const leftStarts = leftName.startsWith(normalizedQuery) ? 0 : 1;
      const rightStarts = rightName.startsWith(normalizedQuery) ? 0 : 1;
      if (leftStarts !== rightStarts) {
        return leftStarts - rightStarts;
      }
      return left.name.localeCompare(right.name, "sv-SE");
    })
    .slice(0, 8);

  return NextResponse.json({ suggestions });
}
