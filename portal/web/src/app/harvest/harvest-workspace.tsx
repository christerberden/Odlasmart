"use client";

import { useMemo, useRef, useState } from "react";
import type { CropRow } from "@/lib/data/crops";
import type { FieldRow } from "@/lib/data/fields";
import type { HarvestEntryRow } from "@/lib/data/harvest";

type HarvestWorkspaceProps = {
  action: (formData: FormData) => void | Promise<void>;
  crops: CropRow[];
  error?: string;
  fields: FieldRow[];
  harvestEntries: HarvestEntryRow[];
  selectedYear: number;
};

type HarvestView = "all" | "harvested";
type SortKey = "title" | "kg" | "area" | "yieldPerM2" | "pricePerKg" | "expectedIncome";
type SortState = {
  direction: "asc" | "desc";
  key: SortKey;
};
type PriceMap = Record<string, number>;
type ForecastDraft = Record<string, { pricePerKg?: number; previousYieldPerM2?: number }>;
type HarvestRow = {
  area: number;
  expectedIncome: number;
  kg: number;
  pricePerKg: number;
  title: string;
  yieldPerM2: number;
};

function getIsoWeek(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function parseLocaleNumber(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDecimal(value: number, maximumFractionDigits = 1) {
  return value.toLocaleString("sv-SE", {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits === 2 ? 2 : 0,
  });
}

function cropIsInYear(crop: CropRow, year: number) {
  return crop.startYear <= year && crop.endYear >= year;
}

function getCropAreaForTitle(crops: CropRow[], title: string, year: number) {
  return crops
    .filter((crop) => crop.title === title && cropIsInYear(crop, year))
    .reduce((sum, crop) => sum + (crop.areaM2 ?? 0), 0);
}

function getHistoricalHarvestYieldPerM2(title: string, crops: CropRow[], entries: HarvestEntryRow[], selectedYear: number) {
  const years = Array.from(new Set([
    ...entries.map((entry) => entry.year),
    ...crops.flatMap((crop) => [crop.startYear, crop.endYear]),
  ]))
    .filter((year) => Number.isFinite(year) && year < selectedYear)
    .sort((a, b) => a - b);

  const yields = years
    .map((year) => {
      const area = getCropAreaForTitle(crops, title, year);
      const kg = entries
        .filter((entry) => entry.title === title && entry.year === year)
        .reduce((sum, entry) => sum + entry.kg, 0);
      return area > 0 && kg > 0 ? kg / area : null;
    })
    .filter((value): value is number => value != null);

  return yields.length ? yields.reduce((sum, value) => sum + value, 0) / yields.length : 0;
}

function getHarvestRows(crops: CropRow[], entries: HarvestEntryRow[], prices: PriceMap, selectedYear: number, view: HarvestView) {
  const rowsByTitle = new Map<string, { area: number; kg: number; title: string }>();
  const yearEntries = entries.filter((entry) => entry.year === selectedYear);

  if (view === "all") {
    crops.filter((crop) => cropIsInYear(crop, selectedYear)).forEach((crop) => {
      const existing = rowsByTitle.get(crop.title) ?? { area: 0, kg: 0, title: crop.title };
      existing.area = Math.max(existing.area, crop.areaM2 ?? 0);
      rowsByTitle.set(crop.title, existing);
    });
  }

  yearEntries.forEach((entry) => {
    const existing = rowsByTitle.get(entry.title) ?? { area: 0, kg: 0, title: entry.title };
    existing.kg += entry.kg;
    existing.area = Math.max(existing.area, entry.areaM2 ?? 0, getCropAreaForTitle(crops, entry.title, selectedYear));
    rowsByTitle.set(entry.title, existing);
  });

  return Array.from(rowsByTitle.values())
    .map((row) => {
      const pricePerKg = prices[row.title] ?? 0;
      const yieldPerM2 = row.area > 0 ? row.kg / row.area : 0;
      return {
        ...row,
        expectedIncome: row.kg * pricePerKg,
        pricePerKg,
        yieldPerM2,
      };
    })
    .filter((row) => view === "all" || row.kg > 0);
}

function sortRows(rows: HarvestRow[], sort: SortState) {
  const multiplier = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    if (sort.key === "title") {
      return left.title.localeCompare(right.title, "sv") * multiplier;
    }
    return (left[sort.key] - right[sort.key]) * multiplier;
  });
}

function loadPrices(): PriceMap {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    return JSON.parse(window.localStorage.getItem("odlingskalender:harvest-prices") ?? "{}") as PriceMap;
  } catch {
    return {};
  }
}

function savePrices(prices: PriceMap) {
  window.localStorage.setItem("odlingskalender:harvest-prices", JSON.stringify(prices));
}

export function HarvestWorkspace({ action, crops, error, fields, harvestEntries, selectedYear }: HarvestWorkspaceProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const forecastDialogRef = useRef<HTMLDialogElement>(null);
  const now = new Date();
  const [view, setView] = useState<HarvestView>("all");
  const [sort, setSort] = useState<SortState>({ direction: "asc", key: "title" });
  const [prices, setPrices] = useState<PriceMap>(() => loadPrices());
  const [forecastDraft, setForecastDraft] = useState<ForecastDraft>({});

  const rows = useMemo(() => (
    sortRows(getHarvestRows(crops, harvestEntries, prices, selectedYear, view), sort)
  ), [crops, harvestEntries, prices, selectedYear, sort, view]);
  const yearEntries = harvestEntries.filter((entry) => entry.year === selectedYear);
  const yearCrops = crops.filter((crop) => cropIsInYear(crop, selectedYear));
  const totalKg = yearEntries.reduce((sum, entry) => sum + entry.kg, 0);
  const totalArea = yearCrops.reduce((sum, crop) => sum + (crop.areaM2 ?? 0), 0);
  const totalIncome = rows.reduce((sum, row) => sum + row.expectedIncome, 0);
  const forecastRows = yearCrops.reduce<HarvestRow[]>((acc, crop) => {
    const existing = acc.find((row) => row.title === crop.title);
    if (existing) {
      existing.area += crop.areaM2 ?? 0;
      return acc;
    }
    const previousYieldPerM2 = getHistoricalHarvestYieldPerM2(crop.title, crops, harvestEntries, selectedYear);
    const pricePerKg = prices[crop.title] ?? 0;
    acc.push({
      area: crop.areaM2 ?? 0,
      expectedIncome: (crop.areaM2 ?? 0) * previousYieldPerM2 * pricePerKg,
      kg: 0,
      pricePerKg,
      title: crop.title,
      yieldPerM2: previousYieldPerM2,
    });
    return acc;
  }, []).sort((a, b) => a.title.localeCompare(b.title, "sv"));
  const forecastWithDraft = forecastRows.map((row) => {
    const draft = forecastDraft[row.title] ?? {};
    const yieldPerM2 = draft.previousYieldPerM2 ?? row.yieldPerM2;
    const pricePerKg = draft.pricePerKg ?? row.pricePerKg;
    return {
      ...row,
      expectedIncome: row.area * yieldPerM2 * pricePerKg,
      pricePerKg,
      yieldPerM2,
    };
  });
  const forecastIncome = forecastWithDraft.reduce((sum, row) => sum + row.expectedIncome, 0);

  function updatePrice(title: string, rawValue: string) {
    const value = parseLocaleNumber(rawValue);
    const next = { ...prices, [title]: value > 0 ? value : 0 };
    setPrices(next);
    savePrices(next);
  }

  function updateSort(key: SortKey) {
    setSort((current) => ({
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
      key,
    }));
  }

  function sortLabel(label: string, key: SortKey) {
    if (sort.key !== key) {
      return label;
    }
    return `${label} ${sort.direction === "asc" ? "↑" : "↓"}`;
  }

  function openForecastDialog() {
    setForecastDraft({});
    forecastDialogRef.current?.showModal();
  }

  return (
    <>
      {error ? <p className="portal-error">{error}</p> : null}

      <section className="harvest-surface">
        <div className="harvest-head">
          <div className="section-head__title-row">
            <h2>Skörd</h2>
            <button aria-label="Hjälp om skörd" className="help-button" type="button">?</button>
          </div>
          <div className="harvest-head__actions">
            <button className="portal-button" type="button" onClick={openForecastDialog}>Prognos</button>
            <button className="portal-button portal-button--primary" type="button" onClick={() => dialogRef.current?.showModal()}>
              Lägg till skörd
            </button>
          </div>
        </div>

        <div className="segmented-control harvest-view-switcher">
          <button className={`segment ${view === "all" ? "is-active" : ""}`} type="button" onClick={() => setView("all")}>Alla grödor</button>
          <button className={`segment ${view === "harvested" ? "is-active" : ""}`} type="button" onClick={() => setView("harvested")}>Skördade grödor</button>
        </div>

        <div className="harvest-summary-grid">
          <article className="harvest-stat-card"><span>Årets skörd</span><strong>{formatDecimal(totalKg, 1)} kg</strong></article>
          <article className="harvest-stat-card"><span>Sådd yta</span><strong>{formatDecimal(totalArea, 1)} m²</strong></article>
          <article className="harvest-stat-card"><span>Årets inkomst</span><strong>{formatDecimal(totalIncome, 2)} kr</strong></article>
        </div>

        <div className="table-wrap harvest-table-wrap">
          <table className="data-table harvest-table">
            <thead>
              <tr>
                <th><button type="button" onClick={() => updateSort("title")}>{sortLabel("Gröda", "title")}</button></th>
                <th><button type="button" onClick={() => updateSort("kg")}>{sortLabel("Skördat", "kg")}</button></th>
                <th><button type="button" onClick={() => updateSort("area")}>{sortLabel("Sådd yta", "area")}</button></th>
                <th><button type="button" onClick={() => updateSort("yieldPerM2")}>{sortLabel("Skörd/m²", "yieldPerM2")}</button></th>
                <th><button type="button" onClick={() => updateSort("pricePerKg")}>{sortLabel("Pris/kg", "pricePerKg")}</button></th>
                <th><button type="button" onClick={() => updateSort("expectedIncome")}>{sortLabel("Inkomst", "expectedIncome")}</button></th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? rows.map((row) => (
                <tr className="harvest-row" key={row.title}>
                  <td>{row.title}</td>
                  <td>{formatDecimal(row.kg, 1)} kg</td>
                  <td>{formatDecimal(row.area, 1)} m²</td>
                  <td>{formatDecimal(row.yieldPerM2, 1)} kg/m²</td>
                  <td>
                    <input
                      className="harvest-price-input"
                      defaultValue={row.pricePerKg ? formatDecimal(row.pricePerKg, 2) : ""}
                      inputMode="decimal"
                      onBlur={(event) => updatePrice(row.title, event.currentTarget.value)}
                      onChange={(event) => updatePrice(row.title, event.currentTarget.value)}
                    />
                  </td>
                  <td>{formatDecimal(row.expectedIncome, 2)} kr</td>
                </tr>
              )) : (
                <tr><td className="harvest-empty" colSpan={6}>Ingen skörd registrerad för {selectedYear} ännu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <dialog className="portal-dialog harvest-dialog" ref={dialogRef}>
        <form action={action} className="portal-dialog__card harvest-form-dialog">
          <div className="portal-dialog__head">
            <div>
              <p className="section-kicker">Skörd</p>
              <h3>Lägg till skörd</h3>
            </div>
            <button className="icon-button" type="button" onClick={() => dialogRef.current?.close()}>×</button>
          </div>
          <p className="muted-copy">Registrera skörd för vald gröda.</p>
          <label>
            Gröda
            <select name="cropId">
              <option value="">Manuell skörd</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>{crop.title}</option>
              ))}
            </select>
          </label>
          <label>
            Titel för manuell skörd
            <input name="title" placeholder="Tomat, gurka eller blandad sallat" />
          </label>
          <label>
            Skördad vikt (kg)
            <input inputMode="decimal" name="kg" required />
          </label>
          <div className="harvest-form-grid">
            <label>
              Odlingsyta
              <select name="fieldId">
                <option value="">Från vald gröda</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </label>
            <label>
              År
              <input defaultValue={selectedYear} inputMode="numeric" name="year" />
            </label>
            <label>
              Vecka
              <input defaultValue={getIsoWeek(now)} inputMode="numeric" name="week" />
            </label>
            <label>
              Månad
              <input defaultValue={now.getMonth() + 1} inputMode="numeric" name="month" />
            </label>
            <label>
              Yta m²
              <input inputMode="decimal" name="areaM2" placeholder="Valfritt" />
            </label>
          </div>
          <label className="checkbox-row">
            <input name="moreToHarvest" type="checkbox" />
            Mer finns kvar att skörda
          </label>
          <div className="form-actions">
            <button className="portal-button" type="button" onClick={() => dialogRef.current?.close()}>Avbryt</button>
            <button className="portal-button portal-button--primary">Spara skörd</button>
          </div>
        </form>
      </dialog>

      <dialog className="portal-dialog harvest-forecast-dialog" ref={forecastDialogRef}>
        <form method="dialog" className="portal-dialog__card harvest-forecast-card">
          <div className="portal-dialog__head">
            <h3>Prognos</h3>
            <button className="icon-button" type="button" onClick={() => forecastDialogRef.current?.close()}>×</button>
          </div>
          <div className="harvest-forecast-total">
            <span>Förväntad inkomst</span>
            <strong>{formatDecimal(forecastIncome, 2)} kr</strong>
          </div>
          <p className="muted-copy">Prognosen bygger på årets grödor i tidslinjen, tidigare års skörd per m² och årets pris/kg. Ändringar här sparas inte.</p>
          <div className="table-wrap harvest-forecast-table-wrap">
            <table className="data-table harvest-forecast-table">
              <colgroup>
                <col className="harvest-forecast-table__col--crop" />
                <col className="harvest-forecast-table__col--area" />
                <col className="harvest-forecast-table__col--yield" />
                <col className="harvest-forecast-table__col--price" />
                <col className="harvest-forecast-table__col--income" />
              </colgroup>
              <thead>
                <tr>
                  <th>Gröda</th>
                  <th>Planterat</th>
                  <th>Tidigare skörd/m²</th>
                  <th>Pris/kg</th>
                  <th>Förväntad inkomst</th>
                </tr>
              </thead>
              <tbody>
                {forecastWithDraft.length > 0 ? forecastWithDraft.map((row) => (
                  <tr key={row.title}>
                    <td>{row.title}</td>
                    <td>{formatDecimal(row.area, 1)} m²</td>
                    <td>
                      <input
                        className="harvest-price-input"
                        inputMode="decimal"
                        value={row.yieldPerM2 ? formatDecimal(row.yieldPerM2, 2) : ""}
                        onChange={(event) => setForecastDraft((current) => ({
                          ...current,
                          [row.title]: { ...current[row.title], previousYieldPerM2: parseLocaleNumber(event.target.value) },
                        }))}
                      />
                    </td>
                    <td>
                      <input
                        className="harvest-price-input"
                        inputMode="decimal"
                        value={row.pricePerKg ? formatDecimal(row.pricePerKg, 2) : ""}
                        onChange={(event) => setForecastDraft((current) => ({
                          ...current,
                          [row.title]: { ...current[row.title], pricePerKg: parseLocaleNumber(event.target.value) },
                        }))}
                      />
                    </td>
                    <td>{formatDecimal(row.expectedIncome, 2)} kr</td>
                  </tr>
                )) : (
                  <tr><td className="harvest-empty" colSpan={5}>Inga grödor finns i tidslinjen för {selectedYear} ännu.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="form-actions">
            <button className="portal-button portal-button--primary">Stäng</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
