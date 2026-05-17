"use client";

import { useEffect, useMemo, useState } from "react";
import type { CropRow } from "@/lib/data/crops";
import type { WeatherLocation } from "@/lib/data/preferences";
import type { FieldRow, SectionRow } from "@/lib/data/fields";

type SettingsWorkspaceProps = {
  crops: CropRow[];
  error?: string;
  fields: FieldRow[];
  initialWeatherLocation: WeatherLocation | null;
  resetDone?: boolean;
  resetWorkspaceDataAction: (formData: FormData) => void | Promise<void>;
  sections: SectionRow[];
};

type WeatherSuggestion = WeatherLocation & {
  label: string;
};

const THEME_KEY = "odlingskalender:theme";
const WEATHER_LOCATION_KEY = "odlingskalender:weather-location";
const WEATHER_LOCATION_EVENT = "odlingskalender:weather-location-updated";

const guideSteps = [
  {
    title: "1. Menyn till vänster",
    text: "Du rör dig mellan sidorna med menyn till vänster. Där finns arbete, planering, skörd och inställningar.",
  },
  {
    title: "2. Odlingsytor",
    text: "Börja med att skapa skiften och bäddar. De blir grunden som grödor kopplas till i odlingsplanen.",
  },
  {
    title: "3. Odlingsplan",
    text: "Lägg till grödor i bäddar och justera veckorna för försådd, direktsådd, utplantering och skörd.",
  },
  {
    title: "4. Idag",
    text: "Här visas uppgifter som skapas från grödorna. Du markerar sådd, plantering och skörd som utförda.",
  },
  {
    title: "5. Skörd",
    text: "Följ upp kilo, yta, pris per kilo och prognos så du kan jämföra planerat och faktiskt utfall.",
  },
];

function getArea(field: FieldRow) {
  return field.areaM2 ?? (field.widthM != null && field.lengthM != null ? field.widthM * field.lengthM : null);
}

function formatNumber(value: number | null | undefined) {
  return value == null ? "" : value.toLocaleString("sv-SE", { maximumFractionDigits: 2 });
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  return [
    headers.map(csvEscape).join(";"),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(";")),
  ].join("\n");
}

function rowsToHtmlTable(rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) {
    return "<table></table>";
  }
  const headers = Object.keys(rows[0]);
  return `<!doctype html><html><meta charset="utf-8"><body><table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((header) => `<td>${String(row[header] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getStoredTheme() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(THEME_KEY);
}

function readStoredWeatherLocation() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const storedWeather = JSON.parse(window.localStorage.getItem(WEATHER_LOCATION_KEY) ?? "null") as WeatherLocation | null;
    if (!storedWeather || !Number.isFinite(Number(storedWeather.latitude)) || !Number.isFinite(Number(storedWeather.longitude))) {
      return null;
    }
    return storedWeather;
  } catch {
    return null;
  }
}

export function SettingsWorkspace({
  crops,
  error,
  fields,
  initialWeatherLocation,
  resetDone = false,
  resetWorkspaceDataAction,
  sections,
}: SettingsWorkspaceProps) {
  const [theme, setTheme] = useState("light");
  const [weatherLocation, setWeatherLocation] = useState<WeatherLocation | null>(initialWeatherLocation);
  const [weatherDraft, setWeatherDraft] = useState(initialWeatherLocation?.name ?? "");
  const [weatherStatus, setWeatherStatus] = useState("");
  const [weatherSuggestions, setWeatherSuggestions] = useState<WeatherSuggestion[]>([]);
  const [weatherSaving, setWeatherSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  useEffect(() => {
    const storedTheme = getStoredTheme();
    const nextTheme = storedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    document.body.dataset.theme = nextTheme;
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
  }, []);

  useEffect(() => {
    const storedLocation = readStoredWeatherLocation() ?? initialWeatherLocation;
    setWeatherLocation(storedLocation);
    setWeatherDraft(storedLocation?.name ?? "");
  }, [initialWeatherLocation]);

  useEffect(() => {
    document.body.dataset.theme = theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const fieldRows = useMemo(() => fields.map((field) => {
    const section = sections.find((item) => item.id === field.sectionId);
    return {
      Beskrivning: field.description,
      Bredd: formatNumber(field.widthM),
      Längd: formatNumber(field.lengthM),
      Namn: field.name,
      PlaceringX: formatNumber(field.positionX),
      PlaceringY: formatNumber(field.positionY),
      Rotation: field.rotationDeg,
      Skifte: section?.name ?? "",
      Typ: field.type,
      Yta: formatNumber(getArea(field)),
    };
  }), [fields, sections]);

  const cropRows = useMemo(() => crops.map((crop) => ({
    Bäddar: crop.fields.map((field) => field.fieldName).join(", "),
    Direktsådd: [crop.schedule.directStart, crop.schedule.directEnd].filter(Boolean).join("-"),
    Försådd: [crop.schedule.forsaddStart, crop.schedule.forsaddEnd].filter(Boolean).join("-"),
    Namn: crop.title,
    Omgång: crop.batchName,
    Slutår: crop.endYear,
    Startår: crop.startYear,
    Skörd: [crop.schedule.harvestStart, crop.schedule.harvestEnd].filter(Boolean).join("-"),
    Utplantering: [crop.schedule.transplantStart, crop.schedule.transplantEnd].filter(Boolean).join("-"),
    Yta: formatNumber(crop.areaM2),
  })), [crops]);

  function exportRows(kind: "beds" | "planning", format: "csv" | "excel") {
    const rows = kind === "beds" ? fieldRows : cropRows;
    const baseName = kind === "beds" ? "odlingsytor" : "odlingsplan";
    if (format === "csv") {
      downloadFile(`${baseName}.csv`, rowsToCsv(rows), "text/csv;charset=utf-8");
      return;
    }
    downloadFile(`${baseName}.xls`, rowsToHtmlTable(rows), "application/vnd.ms-excel;charset=utf-8");
  }

  function updateTheme(nextTheme: string) {
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme);
    document.body.dataset.theme = nextTheme;
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
  }

  async function fetchWeatherSuggestions(query: string) {
    const response = await fetch(`/api/weather/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    if (!response.ok) {
      setWeatherSuggestions([]);
      return;
    }
    const result = await response.json() as { suggestions?: WeatherSuggestion[] };
    setWeatherSuggestions(result.suggestions ?? []);
  }

  function handleWeatherDraftChange(value: string) {
    setWeatherDraft(value);
    if (value.trim().length < 2) {
      setWeatherSuggestions([]);
      return;
    }
    void fetchWeatherSuggestions(value.trim());
  }

  async function saveWeatherLocation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDraft = weatherDraft.trim();
    const selectedLocation =
      weatherSuggestions.find((suggestion) =>
        suggestion.name.toLocaleLowerCase("sv-SE") === trimmedDraft.toLocaleLowerCase("sv-SE")
        || suggestion.label.toLocaleLowerCase("sv-SE") === trimmedDraft.toLocaleLowerCase("sv-SE"))
      ?? null;

    if (!selectedLocation) {
      setWeatherStatus("Välj en plats från listan innan du sparar.");
      return;
    }

    setWeatherSaving(true);
    setWeatherStatus("Sparar väderplats...");
    try {
      const response = await fetch("/api/preferences/weather-location", {
        body: JSON.stringify(selectedLocation),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("save");
      }
      window.localStorage.setItem(WEATHER_LOCATION_KEY, JSON.stringify(selectedLocation));
      window.dispatchEvent(new CustomEvent(WEATHER_LOCATION_EVENT));
      setWeatherLocation(selectedLocation);
      setWeatherDraft(selectedLocation.name);
      setWeatherSuggestions([]);
      setWeatherStatus(`Plats sparad: ${selectedLocation.name}`);
    } catch {
      setWeatherStatus("Kunde inte spara väderplatsen.");
    } finally {
      setWeatherSaving(false);
    }
  }

  function nextGuideStep() {
    if (guideStep === guideSteps.length - 1) {
      setGuideOpen(false);
      return;
    }
    setGuideStep((current) => current + 1);
  }

  return (
    <>
      {error ? <p className="portal-error">{error}</p> : null}
      {resetDone ? <p className="portal-success">Workspace-data är nollställd.</p> : null}

      <section className="settings-original-layout">
        <div className="settings-original-main">
          <section className="settings-original-panel">
            <h2>Din odlingsdata</h2>
            <div className="settings-export-grid">
              <article className="settings-export-card">
                <h3>Odlingsytor</h3>
                <p>Exportera bäddar, skiften, ytor och placeringar för backup eller vidare arbete.</p>
                <div className="settings-button-row">
                  <button className="portal-button" type="button" onClick={() => exportRows("beds", "csv")}>Exportera CSV</button>
                  <button className="portal-button portal-button--primary" type="button" onClick={() => exportRows("beds", "excel")}>Exportera Excel</button>
                </div>
              </article>
              <article className="settings-export-card">
                <h3>Odlingsomgångar och schema</h3>
                <p>Exportera hela odlingsplanen med grödor, bäddar, veckor och händelser.</p>
                <div className="settings-button-row">
                  <button className="portal-button" type="button" onClick={() => exportRows("planning", "csv")}>Exportera CSV</button>
                  <button className="portal-button portal-button--primary" type="button" onClick={() => exportRows("planning", "excel")}>Exportera Excel</button>
                </div>
              </article>
            </div>

            <h2>Om programmet</h2>
            <article className="settings-export-card settings-about-card">
              <h3>Odlingskalender</h3>
              <span>Version 0.0.1</span>
            </article>

            <h2>Nollställning</h2>
            <article className="settings-export-card settings-reset-card">
              <h3>Nollställ workspace-data</h3>
              <p>Tar bort odlingsytor, skiften, egna fröer, lagerposter, grödor, uppgifter, planteringar och skörd. Konto, workspace och den globala frödatabasen lämnas kvar.</p>
              <form action={resetWorkspaceDataAction} onSubmit={(event) => {
                if (!window.confirm("Nollställa all workspace-data? Detta går inte att ångra.")) {
                  event.preventDefault();
                }
              }}>
                <button className="portal-button portal-button-danger" type="submit">Nollställ workspace-data</button>
              </form>
            </article>
          </section>
        </div>

        <aside className="settings-original-aside">
          <section className="settings-original-panel">
            <h2>Kom igång</h2>
            <p>Öppna en stegvis guide som visar var knappar, information och viktiga arbetsflöden finns i appen.</p>
            <button className="portal-button portal-button--primary" type="button" onClick={() => {
              setGuideStep(0);
              setGuideOpen(true);
            }}>Visa guide</button>
          </section>

          <section className="settings-original-panel">
            <h2>Utseende</h2>
            <p>Välj om appen ska visas i ljust eller mörkt tema.</p>
            <div className="segmented-control settings-theme-switcher">
              <button className={`segment ${theme === "light" ? "is-active" : ""}`} type="button" onClick={() => updateTheme("light")}>Ljust</button>
              <button className={`segment ${theme === "dark" ? "is-active" : ""}`} type="button" onClick={() => updateTheme("dark")}>Mörkt</button>
            </div>
          </section>

          <section className="settings-original-panel">
            <h2>Väderplats</h2>
            <p className="settings-inline-note">{weatherLocation ? `Väderplats: ${weatherLocation.name}` : "Ingen väderplats vald än."}</p>
            <p>Ställ in vilken ort väderwidgeten ska använda. Det här fungerar även när webbläsarens platsdelning inte hittar rätt.</p>
            <form className="settings-weather-form" onSubmit={saveWeatherLocation}>
              <label htmlFor="weather-location-query">Ort</label>
              <div className="settings-weather-form__row">
                <div className="settings-weather-input-wrap">
                  <input
                    id="weather-location-query"
                    list="weather-location-suggestions"
                    name="weatherLocation"
                    onChange={(event) => handleWeatherDraftChange(event.target.value)}
                    placeholder="t.ex. Lund"
                    type="search"
                    value={weatherDraft}
                  />
                  <datalist id="weather-location-suggestions">
                    {weatherSuggestions.map((suggestion) => (
                      <option key={`${suggestion.latitude}:${suggestion.longitude}`} value={suggestion.label} />
                    ))}
                  </datalist>
                </div>
                <button className="portal-button portal-button--primary" disabled={weatherSaving} type="submit">
                  {weatherSaving ? "Sparar..." : "Spara väderplats"}
                </button>
              </div>
              {weatherStatus ? <p className="settings-inline-note">{weatherStatus}</p> : null}
            </form>
          </section>

          <section className="settings-original-panel">
            <h2>Externa datakällor</h2>
            <p>Weather data © SMHI (CC BY 4.0)</p>
            <p>Modified and processed by Lilla björkbacka.</p>
          </section>
        </aside>
      </section>

      {guideOpen ? (
        <div className="settings-guide-overlay" role="dialog" aria-modal="true">
          <article className="settings-guide-card">
            <div className="portal-dialog__head">
              <div>
                <h3>{guideSteps[guideStep].title}</h3>
                <p>Steg {guideStep + 1} av {guideSteps.length}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setGuideOpen(false)}>×</button>
            </div>
            <p>{guideSteps[guideStep].text}</p>
            <div className="form-actions">
              <button className="portal-button" disabled={guideStep === 0} type="button" onClick={() => setGuideStep((current) => Math.max(0, current - 1))}>Föregående</button>
              <button className="portal-button portal-button--primary" type="button" onClick={nextGuideStep}>{guideStep === guideSteps.length - 1 ? "Stäng guide" : "Nästa"}</button>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}
