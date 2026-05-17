"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FieldRow, SectionRow } from "@/lib/data/fields";
import type { SeedStockBatchRow } from "@/lib/data/inventory";
import type { PersonalSeedRow, SeedSchedule, SeedTemplateOption } from "@/lib/data/seeds";

type CropCreateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  fields: FieldRow[];
  onCancel?: () => void;
  personalSeeds: PersonalSeedRow[];
  sections: SectionRow[];
  seedTemplates: SeedTemplateOption[];
  stockBatches: SeedStockBatchRow[];
  workspaceName?: string;
};

type SeedOption = {
  id: string;
  crop: string;
  family: string;
  label: string;
  method: string;
  personalSeedId: string | null;
  rowSpacing: string;
  schedule: SeedSchedule;
  seedPerM2: number | null;
  spacing: string;
  variety: string;
};

type ScheduleFormState = {
  directEnd: string;
  directStart: string;
  forsaddEnd: string;
  forsaddStart: string;
  harvestEnd: string;
  harvestStart: string;
  transplantEnd: string;
  transplantStart: string;
};

function getNumber(value: string | number | null | undefined) {
  if (value == null || value === "") {
    return null;
  }

  const normalized = typeof value === "number"
    ? String(value)
    : String(value).replace(/\s+/g, "").replace(",", ".");
  const match = normalized.match(/\d+(?:\.\d+)?/);
  const parsed = match ? Number(match[0]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeFamily(family: string) {
  return family.toLocaleLowerCase("sv").replace(/[^a-zåäö0-9]+/gi, "-").replace(/^-|-$/g, "");
}

function getFamilyImage(family: string) {
  const key = normalizeFamily(family);
  return key ? `/familjer/${key}.png` : "";
}

function calculateSowingLayout({
  bedWidthCm,
  rowSpacingCm,
  plantSpacingCm,
  sowingAreaM2,
  manualRowCount,
}: {
  bedWidthCm: number | null;
  rowSpacingCm: number | null;
  plantSpacingCm: number | null;
  sowingAreaM2: number | null;
  manualRowCount: number | null;
}) {
  const safeBedWidth = Math.max(bedWidthCm ?? 0, 0);
  const safeRowSpacing = Math.max(rowSpacingCm ?? 0, 0);
  const safePlantSpacing = Math.max(plantSpacingCm ?? 0, 0);
  const safeArea = Math.max(sowingAreaM2 ?? 0, 0);
  const autoRowCount = safeBedWidth > 0 && safeRowSpacing > 0
    ? Math.max(1, Math.floor(safeBedWidth / safeRowSpacing))
    : 0;
  const rowCount = manualRowCount != null ? Math.max(1, Math.floor(manualRowCount)) : autoRowCount;
  const sowingLengthCm = safeBedWidth > 0 ? (safeArea * 10000) / safeBedWidth : 0;
  const plantsPerRow = safePlantSpacing > 0 ? Math.max(0, Math.floor(sowingLengthCm / safePlantSpacing)) : 0;

  return {
    plantsPerRow,
    rowCount,
    totalSeedPositions: rowCount * plantsPerRow,
  };
}

function weekRange(start: number | null, end: number | null) {
  if (!start && !end) {
    return "-";
  }

  if (start && end && start !== end) {
    return `v.${start}-${end}`;
  }

  return `v.${start ?? end}`;
}

function scheduleToFormState(schedule: SeedSchedule | null | undefined): ScheduleFormState {
  const selectedWeek = (start: number | null | undefined, end: number | null | undefined) => {
    if (!start && !end) {
      return "";
    }
    const safeStart = start ?? end ?? 1;
    const safeEnd = end ?? start ?? safeStart;
    return String(Math.round((safeStart + safeEnd) / 2));
  };

  return {
    directEnd: selectedWeek(schedule?.directStart, schedule?.directEnd),
    directStart: selectedWeek(schedule?.directStart, schedule?.directEnd),
    forsaddEnd: selectedWeek(schedule?.forsaddStart, schedule?.forsaddEnd),
    forsaddStart: selectedWeek(schedule?.forsaddStart, schedule?.forsaddEnd),
    harvestEnd: selectedWeek(schedule?.harvestStart, schedule?.harvestEnd),
    harvestStart: selectedWeek(schedule?.harvestStart, schedule?.harvestEnd),
    transplantEnd: selectedWeek(schedule?.transplantStart, schedule?.transplantEnd),
    transplantStart: selectedWeek(schedule?.transplantStart, schedule?.transplantEnd),
  };
}

function formStateToSchedule(schedule: ScheduleFormState): SeedSchedule {
  const toNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 52 ? parsed : null;
  };

  return {
    directEnd: toNumber(schedule.directEnd || schedule.directStart),
    directStart: toNumber(schedule.directStart || schedule.directEnd),
    forsaddEnd: toNumber(schedule.forsaddEnd || schedule.forsaddStart),
    forsaddStart: toNumber(schedule.forsaddStart || schedule.forsaddEnd),
    harvestEnd: toNumber(schedule.harvestEnd || schedule.harvestStart),
    harvestStart: toNumber(schedule.harvestStart || schedule.harvestEnd),
    transplantEnd: toNumber(schedule.transplantEnd || schedule.transplantStart),
    transplantStart: toNumber(schedule.transplantStart || schedule.transplantEnd),
  };
}

function getSowMethodOptions(method?: string | null) {
  return [...new Set([
    method,
    "Försådd",
    "Direktsådd",
    "Försådd+Direktsådd",
  ].filter(Boolean) as string[])];
}

function isWeekOutsideRecommendation(week: string, start: number | null | undefined, end: number | null | undefined) {
  const selectedWeek = getNumber(week);
  if (!selectedWeek || (!start && !end)) {
    return false;
  }

  return selectedWeek < (start ?? end ?? selectedWeek) || selectedWeek > (end ?? start ?? selectedWeek);
}

function filterScheduleBySowMethod(schedule: ScheduleFormState, method: string): ScheduleFormState {
  const normalized = method.toLocaleLowerCase("sv");
  const usesDirectSowing = normalized.includes("direkt");
  const usesPresowing = normalized.includes("för") || normalized.includes("for") || normalized.includes("f");

  return {
    ...schedule,
    directEnd: usesDirectSowing ? schedule.directEnd : "",
    directStart: usesDirectSowing ? schedule.directStart : "",
    forsaddEnd: usesPresowing ? schedule.forsaddEnd : "",
    forsaddStart: usesPresowing ? schedule.forsaddStart : "",
    transplantEnd: usesPresowing ? schedule.transplantEnd : "",
    transplantStart: usesPresowing ? schedule.transplantStart : "",
  };
}

export function CropCreateForm({
  action,
  fields,
  onCancel,
  personalSeeds,
  sections,
  seedTemplates,
  stockBatches,
  workspaceName,
}: CropCreateFormProps) {
  const [seedSourceId, setSeedSourceId] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [title, setTitle] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [bedWidthCm, setBedWidthCm] = useState("");
  const [manualRows, setManualRows] = useState("");
  const [rowSpacingCm, setRowSpacingCm] = useState("");
  const [plantSpacingCm, setPlantSpacingCm] = useState("");
  const [selectedStockBatchId, setSelectedStockBatchId] = useState("");
  const [sowMethod, setSowMethod] = useState("");
  const [showSpacingDialog, setShowSpacingDialog] = useState(false);
  const [scheduleValues, setScheduleValues] = useState<ScheduleFormState>(() => scheduleToFormState(null));

  const seedOptions: SeedOption[] = [
    ...personalSeeds.map((seed) => ({
      id: `personal:${seed.id}`,
      crop: seed.crop,
      family: seed.family,
      label: [seed.crop, seed.variety].filter(Boolean).join(" - "),
      method: seed.method,
      personalSeedId: seed.id,
      rowSpacing: seed.rowSpacing,
      schedule: seed.schedule,
      seedPerM2: seed.seedPerM2,
      spacing: seed.spacing,
      variety: seed.variety,
    })),
    ...seedTemplates.map((seed) => ({
      id: `template:${seed.id}`,
      crop: seed.crop,
      family: seed.family,
      label: [seed.crop, seed.variety].filter(Boolean).join(" - "),
      method: seed.method,
      personalSeedId: null,
      rowSpacing: seed.rowSpacing,
      schedule: seed.schedule,
      seedPerM2: seed.seedPerM2,
      spacing: seed.spacing,
      variety: seed.variety,
    })),
  ];

  const selectedSeed = seedOptions.find((seed) => seed.id === seedSourceId) ?? null;
  const selectedSchedule = formStateToSchedule(scheduleValues);
  const selectedField = fields.find((field) => field.id === fieldId) ?? null;
  const fieldBedWidthCm = selectedField?.widthM && selectedField?.lengthM
    ? Math.min(selectedField.widthM, selectedField.lengthM) * 100
    : null;
  const effectiveBedWidthCm = getNumber(bedWidthCm) ?? fieldBedWidthCm;
  const suggestedRowSpacingCm = getNumber(rowSpacingCm) ?? getNumber(selectedSeed?.rowSpacing);
  const suggestedPlantSpacingCm = getNumber(plantSpacingCm) ?? getNumber(selectedSeed?.spacing);
  const layout = calculateSowingLayout({
    bedWidthCm: effectiveBedWidthCm,
    rowSpacingCm: suggestedRowSpacingCm,
    plantSpacingCm: suggestedPlantSpacingCm,
    sowingAreaM2: getNumber(areaM2),
    manualRowCount: getNumber(manualRows),
  });
  const fallbackSeedCount = selectedSeed?.seedPerM2 && getNumber(areaM2)
    ? Math.ceil(selectedSeed.seedPerM2 * getNumber(areaM2)!)
    : 0;
  const seedCount = effectiveBedWidthCm && suggestedRowSpacingCm && suggestedPlantSpacingCm
    ? layout.totalSeedPositions
    : fallbackSeedCount;
  const familyImage = selectedSeed ? getFamilyImage(selectedSeed.family) : "";
  const matchingStockBatches = selectedSeed
    ? stockBatches.filter((batch) => {
        if (selectedSeed.personalSeedId && batch.personalSeedId === selectedSeed.personalSeedId) {
          return true;
        }

        return batch.crop.toLocaleLowerCase("sv") === selectedSeed.crop.toLocaleLowerCase("sv");
      })
    : stockBatches;
  const groupedFields = [
    ...sections.map((section) => ({
      id: section.id,
      label: [section.name, section.family].filter(Boolean).join(" - "),
      fields: fields.filter((field) => field.sectionId === section.id),
    })).filter((group) => group.fields.length > 0),
    {
      id: "without-section",
      label: "Utan skifte",
      fields: fields.filter((field) => !field.sectionId),
    },
  ].filter((group) => group.fields.length > 0);

  function handleSeedChange(value: string) {
    const seed = seedOptions.find((option) => option.id === value);
    const nextStockBatch = seed
      ? stockBatches.find((batch) => {
          if (seed.personalSeedId && batch.personalSeedId === seed.personalSeedId) {
            return true;
          }

          return batch.crop.toLocaleLowerCase("sv") === seed.crop.toLocaleLowerCase("sv");
        })
      : null;
    setSeedSourceId(value);
    setSelectedStockBatchId(nextStockBatch?.id ?? "");
    setRowSpacingCm(seed?.rowSpacing ?? "");
    setPlantSpacingCm(seed?.spacing ?? "");
    setSowMethod(seed?.method ?? "");
    setScheduleValues(filterScheduleBySowMethod(scheduleToFormState(seed?.schedule), seed?.method ?? ""));
    setTitle(seed ? [seed.crop, seed.variety].filter(Boolean).join(" ") : "");
  }

  function handleSowMethodChange(value: string) {
    setSowMethod(value);
    setScheduleValues((current) => filterScheduleBySowMethod(current, value));
  }

  function handleFieldChange(value: string) {
    const field = fields.find((option) => option.id === value);
    setFieldId(value);
    setBedWidthCm(field?.widthM && field?.lengthM ? String(Math.round(Math.min(field.widthM, field.lengthM) * 100)) : "");
    setAreaM2(field?.areaM2 ? String(field.areaM2).replace(".", ",") : "");
  }

  function applySpacingDialog() {
    setShowSpacingDialog(false);
  }

  return (
    <form action={action} className="portal-dialog__card planning-form">
      <aside className="planning-form__sidebar">
        <button className="planning-form__close" type="button" aria-label="Stäng" onClick={onCancel}>
          ×
        </button>
        <div className="planning-form__visual">
          {familyImage ? <span style={{ backgroundImage: `url(${familyImage})` }} /> : <strong>{selectedSeed?.family?.slice(0, 1) ?? "?"}</strong>}
        </div>
        <p className="portal-kicker">Lägg till gröda</p>
        <h3>{title || "Ny gröda"}</h3>
        <div className="planning-form__notes">
          <span>{workspaceName ?? "Din odling"}</span>
          <span>{selectedSeed?.family || "Välj gröda för familj och schema"}</span>
          <span>{selectedField?.name || "Välj bädd"}</span>
        </div>
      </aside>

      <section className="planning-form__main">
        <div className="planning-form__head">
          <p className="portal-kicker">Planering</p>
          <h3>Lägg till gröda</h3>
        </div>

        <div className="planning-form__grid">
          <label className="planning-form__wide">
            Frö / gröda
            <select name="personalSeedId" onChange={(event) => handleSeedChange(event.target.value)} value={seedSourceId}>
              <option value="">Ingen fröpost</option>
              {personalSeeds.length > 0 ? (
                <optgroup label="Mina fröer">
                  {personalSeeds.map((seed) => (
                    <option key={seed.id} value={`personal:${seed.id}`}>
                      {[seed.crop, seed.variety].filter(Boolean).join(" - ")}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              <optgroup label="Frödatabas">
                {seedTemplates.map((seed) => (
                  <option key={seed.id} value={`template:${seed.id}`}>
                    {[seed.crop, seed.variety].filter(Boolean).join(" - ")}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <label>
            Namn i odlingen
            <input name="title" onChange={(event) => setTitle(event.target.value)} required value={title} />
          </label>

          <label>
            Omgång
            <input name="batchName" placeholder="Vår, växthus eller följd 2" />
          </label>

          <label>
            Såmetod
            <select name="sowMethod" onChange={(event) => handleSowMethodChange(event.target.value)} value={sowMethod}>
              <option value="">Välj såmetod</option>
              {getSowMethodOptions(selectedSeed?.method).map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </label>

          <label>
            År
            <input inputMode="numeric" name="startYear" placeholder={String(new Date().getFullYear())} />
          </label>

          <div className="planning-form__wide planning-schedule-grid planning-schedule-grid--editable">
            <WeekInputPair
              end={scheduleValues.forsaddEnd}
              label="Försådd"
              nameEnd="forsaddEnd"
              nameStart="forsaddStart"
              onChange={setScheduleValues}
              recommendedEnd={selectedSeed?.schedule.forsaddEnd ?? null}
              recommendedStart={selectedSeed?.schedule.forsaddStart ?? null}
              start={scheduleValues.forsaddStart}
            />
            <WeekInputPair
              end={scheduleValues.directEnd}
              label="Direktsådd"
              nameEnd="directEnd"
              nameStart="directStart"
              onChange={setScheduleValues}
              recommendedEnd={selectedSeed?.schedule.directEnd ?? null}
              recommendedStart={selectedSeed?.schedule.directStart ?? null}
              start={scheduleValues.directStart}
            />
            <WeekInputPair
              end={scheduleValues.transplantEnd}
              label="Utplantering"
              nameEnd="transplantEnd"
              nameStart="transplantStart"
              onChange={setScheduleValues}
              recommendedEnd={selectedSeed?.schedule.transplantEnd ?? null}
              recommendedStart={selectedSeed?.schedule.transplantStart ?? null}
              start={scheduleValues.transplantStart}
            />
            <WeekInputPair
              end={scheduleValues.harvestEnd}
              label="Skörd"
              nameEnd="harvestEnd"
              nameStart="harvestStart"
              onChange={setScheduleValues}
              recommendedEnd={selectedSeed?.schedule.harvestEnd ?? null}
              recommendedStart={selectedSeed?.schedule.harvestStart ?? null}
              start={scheduleValues.harvestStart}
            />
          </div>

          <ScheduleWarning schedule={scheduleValues} seedSchedule={selectedSeed?.schedule ?? null} />

          <div className="planning-form__wide planning-mini-timeline">
            <div className="planning-mini-timeline__head">
              <strong>Planöversikt</strong>
              <span>Rekommenderade intervall i bakgrunden, valda veckor ovanpå.</span>
            </div>
            <RecommendedMiniTimeline recommendedSchedule={selectedSeed?.schedule ?? null} selectedSchedule={selectedSchedule} />
          </div>

          <div className="planning-form__wide planning-bed-picker">
            <div className="planning-bed-picker__head">
              <strong>Bädd</strong>
              <span>{selectedField?.name ?? "Välj bädd i rätt skifte"}</span>
            </div>
            <input name="fieldId" required type="hidden" value={fieldId} />
            <div className="planning-bed-groups">
              {groupedFields.map((group) => (
                <section className="planning-bed-group" key={group.id}>
                  <strong>{group.label}</strong>
                  <div>
                    {group.fields.map((field) => (
                      <button
                        className={field.id === fieldId ? "is-selected" : ""}
                        key={field.id}
                        type="button"
                        onClick={() => handleFieldChange(field.id)}
                      >
                        {field.name}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <label className="planning-form__wide planning-field-select-fallback">
            Bädd
            <select onChange={(event) => handleFieldChange(event.target.value)} value={fieldId}>
              <option value="">Välj bädd</option>
              {groupedFields.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label>
            Yta (m²)
            <input inputMode="decimal" name="areaM2" onChange={(event) => setAreaM2(event.target.value)} value={areaM2} />
          </label>

          <div className="planning-sowing-summary-card">
            <span>Antal frö</span>
            <strong>{seedCount || 0}</strong>
            <small>{layout.rowCount ? `${layout.rowCount} rader × ${layout.plantsPerRow} platser per rad` : "Välj gröda och bädd."}</small>
            <button type="button" onClick={() => setShowSpacingDialog(true)}>Anpassa</button>
          </div>

          <label>
            Bäddbredd cm
            <input inputMode="decimal" name="bedWidthCm" onChange={(event) => setBedWidthCm(event.target.value)} value={bedWidthCm} />
          </label>

          <label>
            Radavstånd cm
            <input inputMode="decimal" name="rowSpacingCm" onChange={(event) => setRowSpacingCm(event.target.value)} value={rowSpacingCm} />
          </label>

          <label>
            Plantavstånd cm
            <input inputMode="decimal" name="plantSpacingCm" onChange={(event) => setPlantSpacingCm(event.target.value)} value={plantSpacingCm} />
          </label>

          <label>
            Rader
            <input inputMode="numeric" name="plannedRows" onChange={(event) => setManualRows(event.target.value)} placeholder="auto" value={manualRows} />
          </label>

          <label className="planning-form__wide">
            Frö från lager
            <select
              name="seedStockBatchId"
              onChange={(event) => setSelectedStockBatchId(event.target.value)}
              value={selectedStockBatchId}
            >
              <option value="">Välj vid sådd</option>
              {matchingStockBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {[batch.name || batch.crop, batch.variety].filter(Boolean).join(" - ")} ({batch.quantity} st)
                </option>
              ))}
            </select>
          </label>

          {!seedSourceId ? (
            <div className="planning-form__wide planning-inline-question">
              Vill du planera en gröda utan fröpost? Lägg gärna till den under Mina fröer först om den ska kopplas till frölagret.
            </div>
          ) : selectedSeed && matchingStockBatches.length === 0 ? (
            <div className="planning-form__wide planning-inline-question">
              Ingen matchande lagerpost hittades för {selectedSeed.crop}. Vill du lägga till den i Mina fröer innan du sår?
            </div>
          ) : null}

          <input name="plannedSeedCount" type="hidden" value={seedCount || ""} />
          <div className="planning-seed-count planning-seed-count--compact">
            <span>Antal frö</span>
            <strong>{seedCount || 0}</strong>
            <small>{layout.rowCount ? `${layout.rowCount} rader × ${layout.plantsPerRow} platser` : "Välj gröda och bädd."}</small>
          </div>

          <label className="planning-form__wide">
            Anteckning
            <input name="note" placeholder="Plan, sortval eller uppföljning" />
          </label>
        </div>

        <div className="planning-form__actions">
          <button className="portal-button" type="button" onClick={onCancel}>Avbryt</button>
          <button className="portal-button portal-button--primary">Spara i egen odling</button>
        </div>
      </section>

      {showSpacingDialog ? (
        <div className="sowing-dialog" role="dialog" aria-modal="true" aria-label="Anpassa såavstånd">
          <div className="sowing-dialog__card">
            <div className="sowing-dialog__head">
              <h3>Anpassa såavstånd</h3>
              <button type="button" aria-label="Stäng" onClick={() => setShowSpacingDialog(false)}>×</button>
            </div>
            <SowingPreview
              areaM2={getNumber(areaM2)}
              bedLengthM={selectedField?.lengthM ?? null}
              bedWidthCm={effectiveBedWidthCm}
              layout={layout}
              plantSpacingCm={suggestedPlantSpacingCm}
              rowSpacingCm={suggestedRowSpacingCm}
              seedCount={seedCount}
            />
            <div className="sowing-dialog__grid">
              <label>
                Radavstånd (cm)
                <input inputMode="decimal" onChange={(event) => setRowSpacingCm(event.target.value)} value={rowSpacingCm} />
              </label>
              <label>
                Antal rader
                <input inputMode="numeric" onChange={(event) => setManualRows(event.target.value)} value={manualRows} />
              </label>
              <label>
                Plantavstånd (cm)
                <input inputMode="decimal" onChange={(event) => setPlantSpacingCm(event.target.value)} value={plantSpacingCm} />
              </label>
              <label>
                Såyta (m²)
                <input inputMode="decimal" onChange={(event) => setAreaM2(event.target.value)} value={areaM2} />
              </label>
            </div>
            <div className="sowing-dialog__actions">
              <button className="portal-button" type="button" onClick={() => setShowSpacingDialog(false)}>Stäng</button>
              <button className="portal-button portal-button--primary" type="button" onClick={applySpacingDialog}>Använd i plan</button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function RecommendedMiniTimeline({
  recommendedSchedule,
  selectedSchedule,
}: {
  recommendedSchedule: SeedSchedule | null;
  selectedSchedule: SeedSchedule | null;
}) {
  const rows = [
    {
      color: "#6f8fc8",
      label: "Försådd",
      recommendedEnd: recommendedSchedule?.forsaddEnd ?? null,
      recommendedStart: recommendedSchedule?.forsaddStart ?? null,
      selectedWeek: selectedSchedule?.forsaddStart ?? null,
    },
    {
      color: "#c58f45",
      label: "Direktsådd",
      recommendedEnd: recommendedSchedule?.directEnd ?? null,
      recommendedStart: recommendedSchedule?.directStart ?? null,
      selectedWeek: selectedSchedule?.directStart ?? null,
    },
    {
      color: "#5f9b71",
      label: "Utplantering",
      recommendedEnd: recommendedSchedule?.transplantEnd ?? null,
      recommendedStart: recommendedSchedule?.transplantStart ?? null,
      selectedWeek: selectedSchedule?.transplantStart ?? null,
    },
    {
      color: "#b96f5b",
      label: "Skörd",
      recommendedEnd: recommendedSchedule?.harvestEnd ?? null,
      recommendedStart: recommendedSchedule?.harvestStart ?? null,
      selectedWeek: selectedSchedule?.harvestStart ?? null,
    },
  ];

  return (
    <div className="planning-mini-timeline__rows">
      <div className="planning-mini-timeline__ruler" aria-hidden="true">
        {Array.from({ length: 52 }).map((_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      {rows.map((row) => {
        const recommendedStart = row.recommendedStart ?? row.recommendedEnd;
        const recommendedEnd = row.recommendedEnd ?? row.recommendedStart;
        return (
          <div className="planning-mini-timeline__row" key={row.label}>
            <span>{row.label}</span>
            <div className="planning-mini-timeline__track">
              {recommendedStart && recommendedEnd ? (
                <i
                  className="planning-mini-timeline__recommended"
                  style={{
                    gridColumn: `${Math.max(1, Math.min(recommendedStart, 52))} / ${Math.max(1, Math.min(recommendedEnd + 1, 53))}`,
                    background: row.color,
                  }}
                />
              ) : null}
              {row.selectedWeek ? (
                <i
                  className="planning-mini-timeline__selected"
                  style={{
                    gridColumn: `${Math.max(1, Math.min(row.selectedWeek, 52))} / ${Math.max(2, Math.min(row.selectedWeek + 1, 53))}`,
                    background: row.color,
                  }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScheduleWarning({
  schedule,
  seedSchedule,
}: {
  schedule: ScheduleFormState;
  seedSchedule: SeedSchedule | null;
}) {
  const warnings = [
    isWeekOutsideRecommendation(schedule.forsaddStart, seedSchedule?.forsaddStart, seedSchedule?.forsaddEnd) ? "Försådd ligger utanför rekommenderat intervall." : null,
    isWeekOutsideRecommendation(schedule.directStart, seedSchedule?.directStart, seedSchedule?.directEnd) ? "Direktsådd ligger utanför rekommenderat intervall." : null,
    isWeekOutsideRecommendation(schedule.transplantStart, seedSchedule?.transplantStart, seedSchedule?.transplantEnd) ? "Utplantering ligger utanför rekommenderat intervall." : null,
    isWeekOutsideRecommendation(schedule.harvestStart, seedSchedule?.harvestStart, seedSchedule?.harvestEnd) ? "Skörd ligger utanför rekommenderat intervall." : null,
  ].filter(Boolean);

  return warnings.length > 0 ? (
    <div className="planning-form__wide planning-schedule-warning">
      {warnings.join(" ")}
    </div>
  ) : null;
}

function WeekInputPair({
  end,
  label,
  nameEnd,
  nameStart,
  onChange,
  recommendedEnd,
  recommendedStart,
  start,
}: {
  end: string;
  label: string;
  nameEnd: keyof ScheduleFormState;
  nameStart: keyof ScheduleFormState;
  onChange: Dispatch<SetStateAction<ScheduleFormState>>;
  recommendedEnd: number | null;
  recommendedStart: number | null;
  start: string;
}) {
  const outsideRecommendation = isWeekOutsideRecommendation(start, recommendedStart, recommendedEnd);

  return (
    <fieldset className={`planning-week-pair${outsideRecommendation ? " is-warning" : ""}`}>
      <legend>{label}</legend>
      <strong>{weekRange(getNumber(start), getNumber(end))}</strong>
      <small>rek. {weekRange(recommendedStart, recommendedEnd)}</small>
      <div>
        <input
          aria-label={`${label} startvecka`}
          inputMode="numeric"
          max={52}
          min={1}
          name={nameStart}
          onChange={(event) => onChange((current) => ({ ...current, [nameEnd]: event.target.value, [nameStart]: event.target.value }))}
          placeholder="vecka"
          value={start}
        />
        <input
          aria-label={`${label} slutvecka`}
          inputMode="numeric"
          max={52}
          min={1}
          name={nameEnd}
          onChange={(event) => onChange((current) => ({ ...current, [nameEnd]: event.target.value }))}
          hidden
          placeholder="slut"
          value={end}
        />
      </div>
    </fieldset>
  );
}

function SowingPreview({
  areaM2,
  bedLengthM,
  bedWidthCm,
  layout,
  plantSpacingCm,
  rowSpacingCm,
  seedCount,
}: {
  areaM2: number | null;
  bedLengthM: number | null;
  bedWidthCm: number | null;
  layout: ReturnType<typeof calculateSowingLayout>;
  plantSpacingCm: number | null;
  rowSpacingCm: number | null;
  seedCount: number;
}) {
  const rows = Math.max(1, Math.min(layout.rowCount || 4, 8));
  const plantsPerRow = Math.max(1, Math.min(layout.plantsPerRow || 8, 18));

  return (
    <div className="sowing-preview">
      <div className="sowing-preview__measure sowing-preview__measure--top">
        <strong>{rowSpacingCm?.toLocaleString("sv-SE") ?? "-"} cm</strong>
        <span>Radavstånd</span>
      </div>
      <div className="sowing-preview__measure sowing-preview__measure--side">
        <strong>{plantSpacingCm?.toLocaleString("sv-SE") ?? "-"} cm</strong>
        <span>Plantavstånd</span>
      </div>
      <div className="sowing-preview__bed" style={{ gridTemplateColumns: `repeat(${rows}, 1fr)` }}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div className="sowing-preview__row" key={rowIndex}>
            {Array.from({ length: plantsPerRow }).map((__, plantIndex) => (
              <i key={plantIndex} />
            ))}
          </div>
        ))}
      </div>
      <div className="sowing-preview__meta">
        <span>Bäddbredd {bedWidthCm?.toLocaleString("sv-SE") ?? "-"} cm</span>
        <span>Bäddlängd {bedLengthM?.toLocaleString("sv-SE") ?? areaM2?.toLocaleString("sv-SE") ?? "-"} m</span>
      </div>
      <div className="sowing-preview__count">
        <span>Antal frö</span>
        <strong>{seedCount || 0}</strong>
        <small>{layout.rowCount || 0} rader × {layout.plantsPerRow || 0} platser per rad</small>
      </div>
    </div>
  );
}
