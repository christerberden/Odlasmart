"use client";

import { useRef, useState } from "react";
import type { SeedStockBatchRow } from "@/lib/data/inventory";
import type { PersonalSeedRow, SeedSchedule, SeedTemplateOption } from "@/lib/data/seeds";

type InventoryWorkspaceProps = {
  personalSeeds: PersonalSeedRow[];
  seedTemplates: SeedTemplateOption[];
  stockBatches: SeedStockBatchRow[];
  error?: string;
  saveInventorySeedAction: (formData: FormData) => void | Promise<void>;
  deleteInventorySeedAction: (formData: FormData) => void | Promise<void>;
};

type SeedStockRow = {
  id: string;
  seed: PersonalSeedRow | null;
  stock: SeedStockBatchRow | null;
  templateId: string | null;
  crop: string;
  variety: string;
  family: string;
  latinFamily: string;
  method: string;
  schedule: SeedSchedule;
  cultureTime: string;
  spacing: string;
  rowSpacing: string;
  seedPer75: number | null;
  seedPerM2: number | null;
  quantity: number;
  purchaseYear: number | null;
  expirationYear: number | null;
  supplier: string;
  notes: string;
};

type SortKey =
  | "crop"
  | "variety"
  | "family"
  | "method"
  | "forsadd"
  | "direct"
  | "harvest"
  | "spacing"
  | "rowSpacing"
  | "quantity"
  | "expirationYear";

const FAMILY_OPTIONS = [
  "Flockblommiga",
  "Gräs",
  "Gröngödsling",
  "Gurkväxter",
  "Korgblommiga",
  "Korsblommiga",
  "Kålväxter",
  "Lökväxter",
  "Mållväxter",
  "Potatisväxter",
  "Ärtväxter",
  "Örtväxter",
];

const EMPTY_SCHEDULE: SeedSchedule = {
  forsaddStart: null,
  forsaddEnd: null,
  transplantStart: null,
  transplantEnd: null,
  directStart: null,
  directEnd: null,
  harvestStart: null,
  harvestEnd: null,
};

function formatRange(start: number | null, end: number | null) {
  if (start && end) {
    return `v.${start}-${end}`;
  }

  if (start) {
    return `från v.${start}`;
  }

  if (end) {
    return `till v.${end}`;
  }

  return "-";
}

function normalizeFamily(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function getFamilyImage(family: string) {
  const key = normalizeFamily(family);

  if (key.includes("korg")) return "/familjer/korgblommiga.png";
  if (key.includes("flock")) return "/familjer/flockblommiga.png";
  if (key.includes("kal") || key.includes("kors") || key.includes("brassic")) return "/familjer/kalvaxter.png";
  if (key.includes("mall")) return "/familjer/mallvaxter.png";
  if (key.includes("lok")) return "/familjer/lokvaxter.png";
  if (key.includes("art") || key.includes("balj")) return "/familjer/artvaxter.png";
  if (key.includes("gurk")) return "/familjer/gurkvaxter.png";
  if (key.includes("potatis") || key.includes("tomat") || key.includes("paprika")) return "/familjer/potatisvaxter.png";
  if (key.includes("ort")) return "/familjer/ortvaxter.png";
  if (key.includes("grongod") || key.includes("gronsod")) return "/familjer/grongodsling.png";

  return "";
}

function rowText(row: SeedStockRow) {
  return [
    row.crop,
    row.variety,
    row.family,
    row.latinFamily,
    row.method,
    row.spacing,
    row.rowSpacing,
    row.quantity,
    row.expirationYear,
    row.supplier,
    row.notes,
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLowerCase();
}

function getRows(personalSeeds: PersonalSeedRow[], stockBatches: SeedStockBatchRow[]) {
  return personalSeeds.map((seed) => {
    const stock = stockBatches.find((batch) => batch.personalSeedId === seed.id) ?? null;
    return {
      id: seed.id,
      seed,
      stock,
      templateId: seed.templateId,
      crop: seed.crop,
      variety: stock?.variety || seed.variety,
      family: seed.family,
      latinFamily: seed.latinFamily,
      method: seed.method,
      schedule: seed.schedule,
      cultureTime: seed.cultureTime,
      spacing: seed.spacing,
      rowSpacing: seed.rowSpacing,
      seedPer75: seed.seedPer75,
      seedPerM2: seed.seedPerM2,
      quantity: stock?.quantity ?? 0,
      purchaseYear: stock?.purchaseYear ?? null,
      expirationYear: stock?.expirationYear ?? seed.expirationYear,
      supplier: stock?.supplier ?? "",
      notes: stock?.notes || seed.notes,
    };
  });
}

function getSortValue(row: SeedStockRow, key: SortKey) {
  if (key === "forsadd") return row.schedule.forsaddStart ?? 999;
  if (key === "direct") return row.schedule.directStart ?? 999;
  if (key === "harvest") return row.schedule.harvestStart ?? 999;
  return row[key] ?? "";
}

function isExpired(row: SeedStockRow) {
  const currentYear = new Date().getFullYear();
  return Boolean(row.expirationYear && row.expirationYear < currentYear);
}

export function InventoryWorkspace({
  personalSeeds,
  seedTemplates,
  stockBatches,
  error,
  saveInventorySeedAction,
  deleteInventorySeedAction,
}: InventoryWorkspaceProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "stocked">("all");
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "crop", direction: "asc" });
  const [dialogMode, setDialogMode] = useState<"list" | "manual">("list");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedRow, setSelectedRow] = useState<SeedStockRow | null>(null);
  const rows = getRows(personalSeeds, stockBatches);
  const filteredRows = rows
    .filter((row) => {
      const matchesSearch = !query.trim() || rowText(row).includes(query.trim().toLowerCase());
      const matchesView = view === "all" || row.quantity > 0;
      return matchesSearch && matchesView;
    })
    .sort((left, right) => {
      const leftValue = getSortValue(left, sort.key);
      const rightValue = getSortValue(right, sort.key);
      const direction = sort.direction === "asc" ? 1 : -1;

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return (leftValue - rightValue) * direction;
      }

      return String(leftValue).localeCompare(String(rightValue), "sv", { sensitivity: "base" }) * direction;
    });
  const selectedStock = selectedRow?.stock ?? null;
  const selectedSeed = selectedRow?.seed ?? null;
  const selectedTemplate = seedTemplates.find((template) => template.id === selectedTemplateId) ?? null;
  const formSeed = selectedRow ?? selectedTemplate ?? null;
  const schedule = formSeed?.schedule ?? EMPTY_SCHEDULE;
  const familyImage = getFamilyImage(formSeed?.family ?? "");
  const formNotes = selectedRow?.notes ?? selectedSeed?.notes ?? "";

  function setSortKey(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function sortLabel(label: string, key: SortKey) {
    if (sort.key !== key) {
      return label;
    }

    return `${label} ${sort.direction === "asc" ? "↑" : "↓"}`;
  }

  function openDialog(row: SeedStockRow | null) {
    setSelectedRow(row);
    setDialogMode(row ? "manual" : "list");
    setSelectedTemplateId("");
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setSelectedRow(null);
    setSelectedTemplateId("");
  }

  return (
    <section className="inventory-workspace">
      <section className="surface inventory-surface">
        <div className="section-head inventory-head">
          <div>
            <p className="section-kicker">Personlig databas</p>
            <h3>Frölista</h3>
          </div>
        </div>

        <div className="inventory-table-controls">
          <div className="segmented-control harvest-view-switcher">
            <button className={`segment ${view === "all" ? "is-active" : ""}`} type="button" onClick={() => setView("all")}>
              Alla fröer
            </button>
            <button className={`segment ${view === "stocked" ? "is-active" : ""}`} type="button" onClick={() => setView("stocked")}>
              I lager
            </button>
          </div>
          <div className="toolbar-row inventory-toolbar">
            <button className="button-primary" type="button" onClick={() => openDialog(null)}>
              Lägg till frö
            </button>
            <label className="toolbar-search">
              <input
                type="search"
                placeholder="Sök i mina fröer"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
        </div>

        {error ? <p className="inventory-error">{error}</p> : null}

        <div className="table-wrap inventory-table-wrap">
          <table className="data-table seed-stock-table inventory-table">
            <thead>
              <tr>
                <th><button type="button" onClick={() => setSortKey("crop")}>{sortLabel("Gröda", "crop")}</button></th>
                <th><button type="button" onClick={() => setSortKey("variety")}>{sortLabel("Sort", "variety")}</button></th>
                <th><button type="button" onClick={() => setSortKey("family")}>{sortLabel("Familj", "family")}</button></th>
                <th><button type="button" onClick={() => setSortKey("method")}>{sortLabel("Metod", "method")}</button></th>
                <th><button type="button" onClick={() => setSortKey("forsadd")}>{sortLabel("Försådd", "forsadd")}</button></th>
                <th><button type="button" onClick={() => setSortKey("direct")}>{sortLabel("Direktsådd", "direct")}</button></th>
                <th><button type="button" onClick={() => setSortKey("harvest")}>{sortLabel("Skörd", "harvest")}</button></th>
                <th><button type="button" onClick={() => setSortKey("spacing")}>{sortLabel("Plantavstånd", "spacing")}</button></th>
                <th><button type="button" onClick={() => setSortKey("rowSpacing")}>{sortLabel("Radavstånd", "rowSpacing")}</button></th>
                <th><button type="button" onClick={() => setSortKey("quantity")}>{sortLabel("Antal", "quantity")}</button></th>
                <th><button type="button" onClick={() => setSortKey("expirationYear")}>{sortLabel("Bäst före", "expirationYear")}</button></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr
                    className="seed-stock-row"
                    key={`${row.seed?.id ?? "stock"}-${row.stock?.id ?? "empty"}`}
                    onClick={() => openDialog(row)}
                  >
                    <td><strong>{row.crop || "-"}</strong></td>
                    <td>{row.variety || "-"}</td>
                    <td>{row.family || "-"}</td>
                    <td>{row.method || "-"}</td>
                    <td>{formatRange(row.schedule.forsaddStart, row.schedule.forsaddEnd)}</td>
                    <td>{formatRange(row.schedule.directStart, row.schedule.directEnd)}</td>
                    <td>{formatRange(row.schedule.harvestStart, row.schedule.harvestEnd)}</td>
                    <td>{row.spacing || "-"}</td>
                    <td>{row.rowSpacing || "-"}</td>
                    <td>{row.quantity}</td>
                    <td className={isExpired(row) ? "seed-stock-cell--expired" : ""}>{row.expirationYear || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="harvest-empty" colSpan={11}>
                    {view === "stocked" ? "Du har inga fröer i lager ännu." : "Du har inga fröer i Mina fröer ännu."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <dialog className="portal-dialog inventory-dialog inventory-dialog--wide" ref={dialogRef}>
        <form
          action={saveInventorySeedAction}
          className="portal-dialog__card seed-stock-dialog-card inventory-seed-dialog-card"
          key={`${selectedStock?.id ?? selectedSeed?.id ?? "new"}-${selectedTemplateId}-${dialogMode}`}
          onSubmit={closeDialog}
        >
          <input name="stockId" type="hidden" value={selectedStock?.id ?? ""} />
          <input name="personalSeedId" type="hidden" value={selectedSeed?.id ?? ""} />
          <input name="templateId" type="hidden" value={selectedSeed?.templateId ?? selectedTemplate?.id ?? ""} />

          <aside className="inventory-seed-visual">
            <button className="icon-button planning-close" type="button" onClick={closeDialog} aria-label="Stäng">
              ×
            </button>
            <div className="inventory-family-visual">
              {familyImage ? <span style={{ backgroundImage: `url(${familyImage})` }} /> : <strong>{formSeed?.family ? formSeed.family.slice(0, 1) : "?"}</strong>}
            </div>
            <div className="planning-summary">
              <p className="section-kicker">Fröpost</p>
              <h3>{[formSeed?.crop, formSeed?.variety].filter(Boolean).join(", ") || "Ny sort"}</h3>
              <div className="planning-facts">
                <div className="planning-fact">
                  <span>Familj</span>
                  <strong>{formSeed?.family || "-"}</strong>
                </div>
                <div className="planning-fact">
                  <span>Metod</span>
                  <strong>{formSeed?.method || "-"}</strong>
                </div>
                <div className="planning-fact">
                  <span>Försådd</span>
                  <strong>{formatRange(schedule.forsaddStart, schedule.forsaddEnd)}</strong>
                </div>
              </div>
            </div>
          </aside>

          <section className="inventory-seed-main">
            <div className="dialog-head dialog-head--compact">
              <div>
                <p className="section-kicker">Frödatabasen</p>
                <h3>{selectedSeed ? "Redigera fröpost" : "Lägg till frö"}</h3>
              </div>
            </div>

            {!selectedSeed ? (
              <div className="form-span-2">
                <span className="form-label">Lägg till som</span>
                <div className="segmented-control">
                  <button className={`segment ${dialogMode === "list" ? "is-active" : ""}`} type="button" onClick={() => setDialogMode("list")}>
                    Från listan
                  </button>
                  <button className={`segment ${dialogMode === "manual" ? "is-active" : ""}`} type="button" onClick={() => setDialogMode("manual")}>
                    Nytt frö
                  </button>
                </div>
              </div>
            ) : null}

            {!selectedSeed && dialogMode === "list" ? (
              <label className="form-field form-span-2">
                Frö från listan
                <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                  <option value="">Välj frö från frödatabasen</option>
                  {seedTemplates.map((seed) => (
                    <option key={seed.id} value={seed.id}>
                      {[seed.crop, seed.variety].filter(Boolean).join(" - ")}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="form-grid">
              <label className="form-field">
                Familj
                <select name="family" defaultValue={formSeed?.family ?? ""}>
                  <option value="">Välj familj</option>
                  {FAMILY_OPTIONS.map((family) => (
                    <option key={family} value={family}>{family}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                Latinska familjer
                <input name="latinFamily" defaultValue={formSeed?.latinFamily ?? ""} />
              </label>
              <label className="form-field">
                Gröda
                <input name="crop" defaultValue={formSeed?.crop ?? ""} />
              </label>
              <label className="form-field">
                Sort
                <input name="variety" defaultValue={formSeed?.variety ?? ""} />
              </label>
              <label className="form-field">
                Metod
                <select name="method" defaultValue={formSeed?.method ?? ""}>
                  <option value="">Välj metod</option>
                  <option value="Försådd">Försådd</option>
                  <option value="Direktsådd">Direktsådd</option>
                  <option value="Försådd+Direktsådd">Försådd+Direktsådd</option>
                </select>
              </label>
              <label className="form-field">
                Plantavstånd
                <input name="spacing" defaultValue={formSeed?.spacing ?? ""} />
              </label>
              <label className="form-field">
                Radavstånd
                <input name="rowSpacing" defaultValue={formSeed?.rowSpacing ?? ""} />
              </label>
              <label className="form-field">
                Första försådd
                <input name="forsaddStart" type="number" min="1" max="52" defaultValue={schedule.forsaddStart ?? ""} />
              </label>
              <label className="form-field">
                Sista försådd
                <input name="forsaddEnd" type="number" min="1" max="52" defaultValue={schedule.forsaddEnd ?? ""} />
              </label>
              <label className="form-field">
                Första utplantering
                <input name="transplantStart" type="number" min="1" max="52" defaultValue={schedule.transplantStart ?? ""} />
              </label>
              <label className="form-field">
                Sista utplantering
                <input name="transplantEnd" type="number" min="1" max="52" defaultValue={schedule.transplantEnd ?? ""} />
              </label>
              <label className="form-field">
                Första direktsådd
                <input name="directStart" type="number" min="1" max="52" defaultValue={schedule.directStart ?? ""} />
              </label>
              <label className="form-field">
                Sista direktsådd
                <input name="directEnd" type="number" min="1" max="52" defaultValue={schedule.directEnd ?? ""} />
              </label>
              <label className="form-field">
                Kulturtid
                <input name="cultureTime" defaultValue={formSeed?.cultureTime ?? ""} />
              </label>
              <label className="form-field">
                Första skörd
                <input name="harvestStart" type="number" min="1" max="52" defaultValue={schedule.harvestStart ?? ""} />
              </label>
              <label className="form-field">
                Sista skörd
                <input name="harvestEnd" type="number" min="1" max="52" defaultValue={schedule.harvestEnd ?? ""} />
              </label>
              <label className="form-field">
                Frö/m²
                <input name="seedPerM2" defaultValue={formSeed?.seedPerM2 ?? ""} />
              </label>
              <label className="form-field">
                Antal
                <input name="quantity" type="number" min="0" step="1" defaultValue={selectedRow?.quantity ?? 0} />
              </label>
              <label className="form-field">
                Inköpsår
                <input name="purchaseYear" type="number" min="1900" max="2200" defaultValue={selectedRow?.purchaseYear ?? new Date().getFullYear()} />
              </label>
              <label className="form-field">
                Bäst före-år
                <input name="expirationYear" type="number" min="1900" max="2200" defaultValue={selectedRow?.expirationYear ?? selectedSeed?.expirationYear ?? ""} />
              </label>
              <label className="form-field">
                Leverantör
                <input name="supplier" defaultValue={selectedRow?.supplier ?? ""} />
              </label>
              <label className="form-field form-span-2">
                Anteckningar
                <textarea name="notes" rows={3} defaultValue={formNotes} />
              </label>
            </div>

            <div className="form-actions">
              {selectedSeed || selectedStock ? (
                <button
                  className="button-secondary button-secondary--danger"
                  formAction={deleteInventorySeedAction}
                  formNoValidate
                  type="submit"
                  onClick={(event) => {
                    if (!confirm(`Ta bort ${selectedRow?.crop || "valt frö"} från Mina fröer?`)) {
                      event.preventDefault();
                    }
                  }}
                >
                  Ta bort
                </button>
              ) : null}
              <button className="button-secondary" type="button" onClick={closeDialog}>
                Avbryt
              </button>
              <button className="button-primary" type="submit">
                Spara
              </button>
            </div>
          </section>
        </form>
      </dialog>

    </section>
  );
}
