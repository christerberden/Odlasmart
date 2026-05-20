import { NextResponse } from "next/server";

type DailyForecast = {
  code: number;
  date: string;
  label: string;
  max: number;
  min: number;
  precipitation: number;
  rainAmount: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function describeWeatherCode(code: number) {
  if (code === 1) return "Klart";
  if ([2, 3].includes(code)) return "Lätt molnighet";
  if ([4, 5].includes(code)) return "Halvklart";
  if ([6, 7].includes(code)) return "Mulet";
  if ([8, 9, 10].includes(code)) return "Regn";
  if ([11].includes(code)) return "Åska";
  if ([12, 13, 14, 15].includes(code)) return "Snö eller blötsnö";
  return "Växlande väder";
}

function getCurrentForecastEntry(timeSeries: Array<{ data?: Record<string, unknown>; time?: string }>) {
  if (!Array.isArray(timeSeries) || !timeSeries.length) {
    return null;
  }
  const now = Date.now();
  return timeSeries.find((entry) => Date.parse(entry.time ?? "") >= now) ?? timeSeries[0];
}

function buildSmhiDailyForecast(timeSeries: Array<{ data?: Record<string, unknown>; time?: string }>) {
  const dayMap = new Map<string, {
    code: number;
    date: string;
    max: number;
    min: number;
    precipitation: number;
    rainAmount: number;
    symbolHourDistance: number;
  }>();

  for (const entry of timeSeries ?? []) {
    if (!entry?.time || !entry?.data) {
      continue;
    }

    const date = new Date(entry.time);
    const key = date.toLocaleDateString("sv-SE", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "Europe/Stockholm",
      year: "numeric",
    });
    const localHour = Number(date.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Europe/Stockholm",
    }).slice(0, 2));

    const current = dayMap.get(key) ?? {
      code: Number(entry.data.symbol_code ?? 0),
      date: key,
      max: Number.NEGATIVE_INFINITY,
      min: Number.POSITIVE_INFINITY,
      precipitation: 0,
      rainAmount: 0,
      symbolHourDistance: Number.POSITIVE_INFINITY,
    };

    current.min = Math.min(current.min, Number(entry.data.air_temperature ?? current.min));
    current.max = Math.max(current.max, Number(entry.data.air_temperature ?? current.max));
    current.precipitation = Math.max(current.precipitation, Number(entry.data.probability_of_precipitation ?? 0));
    current.rainAmount += Number(entry.data.precipitation_amount_mean ?? 0);

    const hourDistance = Math.abs(localHour - 12);
    if (hourDistance < current.symbolHourDistance) {
      current.code = Number(entry.data.symbol_code ?? current.code);
      current.symbolHourDistance = hourDistance;
    }

    dayMap.set(key, current);
  }

  return [...dayMap.values()].map((day) => ({
    code: day.code,
    date: day.date,
    label: describeWeatherCode(day.code),
    max: Math.round(Number.isFinite(day.max) ? day.max : 0),
    min: Math.round(Number.isFinite(day.min) ? day.min : 0),
    precipitation: Math.round(day.precipitation),
    rainAmount: Number(day.rainAmount.toFixed(1)),
  })) as DailyForecast[];
}

function getWeatherAdvice(nextDays: Array<{ code: number; max: number; min: number; precipitation: number; rainAmount: number }>) {
  const advice: string[] = [];
  if (nextDays.some((day) => day.min <= 1)) {
    advice.push("Kalla nätter väntar, var försiktig med utplantering.");
  }
  if (nextDays.some((day) => day.precipitation >= 70 || day.rainAmount >= 8)) {
    advice.push("Mycket nederbörd väntas, planera bevattning och direktsådd därefter.");
  }
  if (nextDays.slice(0, 3).every((day) => day.max >= 12 && day.precipitation < 45)) {
    advice.push("Bra fönster för sådd och utplantering de närmaste dagarna.");
  }
  if (nextDays.some((day) => day.code === 11)) {
    advice.push("Risk för åska, undvik känsliga arbetsmoment på de dagarna.");
  }
  return advice.length ? advice.slice(0, 3) : ["Stabil vecka i prognosen, jobba vidare enligt plan."];
}

function getWeatherCloudFactor(code: number) {
  if ([1].includes(code)) return 1;
  if ([2, 3, 4].includes(code)) return 0.78;
  if ([5].includes(code)) return 0.52;
  if ([6, 7].includes(code)) return 0.3;
  if ([8, 9, 10, 11, 15, 16, 17, 24, 25].includes(code)) return 0.18;
  if ([12, 13, 14, 18, 19, 20, 21, 22, 23, 26, 27].includes(code)) return 0.12;
  return 0.45;
}

function estimateDaylightFraction(dateString: string, latitude: number) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return 0.5;
  }

  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const declination = 23.44 * Math.sin(((360 / 365) * (dayOfYear - 81)) * (Math.PI / 180));
  const latRad = latitude * (Math.PI / 180);
  const declRad = declination * (Math.PI / 180);
  const hourAngleInput = clamp(-Math.tan(latRad) * Math.tan(declRad), -1, 1);
  const hourAngle = Math.acos(hourAngleInput);
  const daylightHours = (24 / Math.PI) * hourAngle;

  return clamp(daylightHours / 24, 0.2, 0.8);
}

function estimateSoilTemperatureAtFiveCm(
  days: Array<{ code: number; date: string; max: number; min: number; rainAmount: number }>,
  latitude: number,
) {
  if (!days.length) {
    return null;
  }

  const means = days.map((day) => (day.min + day.max) / 2).filter(Number.isFinite);
  if (!means.length) {
    return null;
  }

  const baseInitial =
    means.slice(0, Math.min(means.length, 3)).reduce((sum, value, index) => sum + value * (index === 0 ? 0.5 : 0.25), 0)
    / (means.length === 1 ? 0.5 : means.length === 2 ? 0.75 : 1);

  let seasonalBase = baseInitial;
  let surfaceTemp = baseInitial;
  let soilTemp = baseInitial;
  let moisture = 0.18;
  let previousMean = means[0];

  for (const [index, day] of days.slice(0, 7).entries()) {
    const mean = (day.min + day.max) / 2;
    const range = Math.max(0, day.max - day.min);
    const cloudFactor = getWeatherCloudFactor(day.code);
    const daylightFraction = estimateDaylightFraction(day.date, latitude);
    const rainAmount = Math.max(0, day.rainAmount || 0);

    moisture = Math.min(1, moisture * 0.55 + rainAmount / 12);
    seasonalBase = index === 0 ? mean : (seasonalBase * 0.9 + mean * 0.1);

    const solarGain = 2.6 * daylightFraction * cloudFactor * Math.sqrt(range);
    const nightCooling = 1.15 * (1 - cloudFactor) * Math.max(0, mean - day.min);
    const rainCooling = 0.9 * Math.log1p(rainAmount) + 1.6 * moisture;
    const trend = index === 0 ? 0 : 0.35 * (mean - previousMean);
    const equilibrium = seasonalBase + 0.55 * (mean - seasonalBase) + solarGain - nightCooling - rainCooling + trend;

    const surfaceResponse = clamp(0.28 + 0.08 * cloudFactor * daylightFraction - 0.08 * moisture, 0.16, 0.4);
    surfaceTemp += surfaceResponse * (equilibrium - surfaceTemp);

    const soilResponse = clamp(0.1 + 0.05 * cloudFactor * daylightFraction - 0.04 * moisture, 0.06, 0.18);
    soilTemp += soilResponse * (surfaceTemp - soilTemp);
    previousMean = mean;
  }

  return clamp(soilTemp, -5, 30);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lon"));
  const name = String(searchParams.get("name") ?? "").trim();

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const url = `https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/${longitude}/lat/${latitude}/data.json`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    return NextResponse.json({ error: "SMHI forecast fetch failed" }, { status: 502 });
  }

  const forecast = await response.json();
  const currentEntry = getCurrentForecastEntry(forecast.timeSeries ?? []);
  const daily = buildSmhiDailyForecast(forecast.timeSeries ?? []);
  const currentTemp = Math.round(Number(currentEntry?.data?.air_temperature ?? daily[0]?.max ?? 0));
  const currentCode = Number(currentEntry?.data?.symbol_code ?? daily[0]?.code ?? 0);
  const soilTemp = estimateSoilTemperatureAtFiveCm(daily, latitude);

  return NextResponse.json({
    advice: getWeatherAdvice(daily),
    currentTemp,
    daily: daily.slice(0, 7),
    label: describeWeatherCode(currentCode),
    locationName: name || "Vald plats",
    maxTemp: Math.round(daily[0]?.max ?? currentTemp),
    minTemp: Math.round(daily[0]?.min ?? currentTemp),
    soilTemp: Number.isFinite(soilTemp) ? Math.round(soilTemp as number) : null,
  });
}
