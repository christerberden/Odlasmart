"use client";

import { useEffect, useState } from "react";
import type { WeatherLocation } from "@/lib/data/preferences";

const WEATHER_LOCATION_KEY = "odlingskalender:weather-location";
const WEATHER_LOCATION_EVENT = "odlingskalender:weather-location-updated";

type WeatherWidgetData = {
  advice: string[];
  currentTemp: number;
  label: string;
  locationName: string;
  maxTemp: number;
  minTemp: number;
  soilTemp: number | null;
};

type PortalWeatherWidgetProps = {
  initialWeatherLocation: WeatherLocation | null;
};

function readStoredWeatherLocation() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(WEATHER_LOCATION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as WeatherLocation | null;
    if (!parsed || !Number.isFinite(Number(parsed.latitude)) || !Number.isFinite(Number(parsed.longitude))) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function PortalWeatherWidget({ initialWeatherLocation }: PortalWeatherWidgetProps) {
  const [weatherLocation, setWeatherLocation] = useState<WeatherLocation | null>(initialWeatherLocation);
  const [widgetData, setWidgetData] = useState<WeatherWidgetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextLocation = readStoredWeatherLocation() ?? initialWeatherLocation;
    setWeatherLocation(nextLocation);
  }, [initialWeatherLocation]);

  useEffect(() => {
    function syncLocation() {
      setWeatherLocation(readStoredWeatherLocation() ?? initialWeatherLocation);
    }

    window.addEventListener("storage", syncLocation);
    window.addEventListener(WEATHER_LOCATION_EVENT, syncLocation);
    return () => {
      window.removeEventListener("storage", syncLocation);
      window.removeEventListener(WEATHER_LOCATION_EVENT, syncLocation);
    };
  }, [initialWeatherLocation]);

  useEffect(() => {
    if (!weatherLocation) {
      setWidgetData(null);
      setError(null);
      return;
    }
    const activeLocation = weatherLocation;

    let cancelled = false;

    async function loadForecast() {
      setLoading(true);
      setError(null);
      try {
        const searchParams = new URLSearchParams({
          lat: String(activeLocation.latitude),
          lon: String(activeLocation.longitude),
          name: activeLocation.name,
        });
        const response = await fetch(`/api/weather/forecast?${searchParams.toString()}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("forecast");
        }
        const nextData = await response.json() as WeatherWidgetData;
        if (!cancelled) {
          setWidgetData(nextData);
        }
      } catch {
        if (!cancelled) {
          setWidgetData(null);
          setError("Kunde inte hämta väder");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadForecast();
    return () => {
      cancelled = true;
    };
  }, [weatherLocation]);

  if (!weatherLocation) {
    return (
      <div className="weather-widget">
        <div className="weather-widget__top">
          <strong>--°</strong>
          <span>Ingen odlingsplats vald</span>
        </div>
        <p>Väder aktiveras när odlingsplats väljs under Inställningar.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-widget">
        <div className="weather-widget__top">
          <strong>--°</strong>
          <span>{weatherLocation.name}</span>
        </div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <div className="weather-widget__top">
        <strong>{loading && !widgetData ? "..." : `${widgetData?.currentTemp ?? "--"}°C`}</strong>
        <span>{widgetData?.label ?? "Hämtar väder..."}</span>
      </div>
      <p>{widgetData?.locationName ?? weatherLocation.name}</p>
      <p>{widgetData ? `${widgetData.minTemp}° / ${widgetData.maxTemp}°` : "Läser prognos..."}</p>
      <p>{widgetData?.soilTemp != null ? `Uppskattad jordtemp 5 cm ${widgetData.soilTemp}°C` : "Uppskattad jordtemp 5 cm --°C"}</p>
      <p>{widgetData?.advice?.[0] ?? "Inga väderråd just nu."}</p>
    </div>
  );
}
