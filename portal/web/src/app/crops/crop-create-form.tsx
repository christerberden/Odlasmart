"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CropRow } from "@/lib/data/crops";
import type { FieldRow, SectionRow } from "@/lib/data/fields";
import type { SeedStockBatchRow } from "@/lib/data/inventory";
import type { PersonalSeedRow, SeedSchedule, SeedTemplateOption } from "@/lib/data/seeds";

type CropCreateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  crops: CropRow[];
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

type PlanningSowMode = "forsadd" | "direktsadd";

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
  if (!key) {
    return "";
  }

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

  return `/familjer/${key}.png`;
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

function getRecommendedWeek(start: number | null | undefined, end: number | null | undefined) {
  if (!start && !end) {
    return "";
  }

  const safeStart = start ?? end ?? 1;
  const safeEnd = end ?? start ?? safeStart;
  return String(Math.round((safeStart + safeEnd) / 2));
}

function formatRecommendedRange(start: number | null | undefined, end: number | null | undefined) {
  if (!start && !end) {
    return "";
  }

  if (!start || !end || start === end) {
    return `rek. v.${start ?? end}`;
  }

  return `rek. v.${start}-${end}`;
}

function scheduleToFormState(schedule: SeedSchedule | null | undefined): ScheduleFormState {
  return {
    directEnd: getRecommendedWeek(schedule?.directStart, schedule?.directEnd),
    directStart: getRecommendedWeek(schedule?.directStart, schedule?.directEnd),
    forsaddEnd: getRecommendedWeek(schedule?.forsaddStart, schedule?.forsaddEnd),
    forsaddStart: getRecommendedWeek(schedule?.forsaddStart, schedule?.forsaddEnd),
    harvestEnd: getRecommendedWeek(schedule?.harvestStart, schedule?.harvestEnd),
    harvestStart: getRecommendedWeek(schedule?.harvestStart, schedule?.harvestEnd),
    transplantEnd: getRecommendedWeek(schedule?.transplantStart, schedule?.transplantEnd),
    transplantStart: getRecommendedWeek(schedule?.transplantStart, schedule?.transplantEnd),
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

function getPlanningSowModes(schedule: SeedSchedule | null | undefined): PlanningSowMode[] {
  const options: PlanningSowMode[] = [];
  if (schedule?.forsaddStart || schedule?.forsaddEnd) {
    options.push("forsadd");
  }
  if (schedule?.directStart || schedule?.directEnd) {
    options.push("direktsadd");
  }
  return options;
}

function isWeekOutsideRecommendation(week: string, start: number | null | undefined, end: number | null | undefined) {
  const selectedWeek = getNumber(week);
  if (!selectedWeek || (!start && !end)) {
    return false;
  }

  return selectedWeek < (start ?? end ?? selectedWeek) || selectedWeek > (end ?? start ?? selectedWeek);
}

function clampWeek(value: number) {
  return Math.max(1, Math.min(52, Math.round(value)));
}

function getPlanningRange(schedule: SeedSchedule | null) {
  const start = schedule?.directStart ?? schedule?.transplantStart ?? schedule?.directEnd ?? schedule?.transplantEnd ?? null;
  const end = schedule?.harvestEnd ?? schedule?.harvestStart ?? null;

  if (!start || !end) {
    return null;
  }

  return {
    end: Math.max(start, end),
    start: Math.min(start, end),
  };
}

function rangesOverlap(a: { start: number; end: number } | null, b: { start: number; end: number } | null) {
  if (!a || !b) {
    return false;
  }
  return a.start <= b.end && b.start <= a.end;
}

function getCropFamily(crop: CropRow, personalSeeds: PersonalSeedRow[], seedTemplates: SeedTemplateOption[]) {
  const personalSeed = personalSeeds.find((seed) => seed.id === crop.personalSeedId);
  if (personalSeed?.family) {
    return personalSeed.family;
  }

  const normalizedTitle = crop.title.toLocaleLowerCase("sv");
  const template = seedTemplates.find((seed) => normalizedTitle.includes(seed.crop.toLocaleLowerCase("sv")));
  return template?.family ?? "";
}

export function CropCreateForm({
  action,
  crops,
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
  const [planningMode, setPlanningMode] = useState<PlanningSowMode>("direktsadd");
  const [showSpacingDialog, setShowSpacingDialog] = useState(false);
  const [scheduleValues, setScheduleValues] = useState<ScheduleFormState>(() => scheduleToFormState(null));
  const [linkedGaps, setLinkedGaps] = useState({ presowToTransplant: 0, transplantToHarvest: 0 });

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
  const selectedSection = sections.find((section) => section.id === selectedField?.sectionId) ?? null;
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
  const sowModes = getPlanningSowModes(selectedSeed?.schedule);
  const matchingStockBatches = selectedSeed
    ? stockBatches.filter((batch) => {
      if (selectedSeed.personalSeedId && batch.personalSeedId === selectedSeed.personalSeedId) {
        return true;
      }

      return batch.crop.toLocaleLowerCase("sv") === selectedSeed.crop.toLocaleLowerCase("sv");
    })
    : [];
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

  const selectedYear = new Date().getFullYear();
  const selectedRange = getPlanningRange(selectedSchedule);
  const overlappingArea = selectedField
    ? crops
      .filter((crop) => crop.fields.some((cropField) => cropField.fieldId === selectedField.id))
      .filter((crop) => crop.startYear <= selectedYear && crop.endYear >= selectedYear)
      .filter((crop) => rangesOverlap(selectedRange, getPlanningRange(crop.schedule)))
      .reduce((sum, crop) => sum + (crop.areaM2 ?? crop.fields[0]?.plannedAreaM2 ?? 0), 0)
    : 0;
  const totalArea = selectedField?.areaM2 ?? 0;
  const remainingArea = Math.max(totalArea - overlappingArea, 0);
  const requestedArea = getNumber(areaM2) ?? 0;
  const selectedFieldNote = selectedField
    ? `Vald bädd: ${selectedField.name}${selectedSection ? ` (${selectedSection.name})` : ""}. Minst ${remainingArea.toLocaleString("sv-SE", { maximumFractionDigits: 2 })} m² ledigt under perioden av ${totalArea.toLocaleString("sv-SE", { maximumFractionDigits: 2 })} m². ${requestedArea > remainingArea + 0.0001 ? "Får inte plats." : "Får plats."}`
    : "Vald bädd: välj en bädd.";

  const rotationSections = sections
    .filter((section) => section.rotationEnabled)
    .sort((a, b) => (a.rotationOrder ?? Number.MAX_SAFE_INTEGER) - (b.rotationOrder ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "sv"));
  const previousFamilySectionId = selectedSeed?.family
    ? crops
      .filter((crop) => crop.startYear <= selectedYear - 1 && crop.endYear >= selectedYear - 1)
      .filter((crop) => getCropFamily(crop, personalSeeds, seedTemplates).toLocaleLowerCase("sv") === selectedSeed.family.toLocaleLowerCase("sv"))
      .flatMap((crop) => crop.fields.map((cropField) => fields.find((field) => field.id === cropField.fieldId)?.sectionId))
      .find(Boolean) ?? null
    : null;
  const previousSection = rotationSections.find((section) => section.id === previousFamilySectionId) ?? null;
  const recommendedSection = previousSection
    ? rotationSections[(rotationSections.findIndex((section) => section.id === previousSection.id) + 1) % rotationSections.length] ?? null
    : null;
  const rotationNote = !selectedSeed?.family
    ? "Växtföljd: välj en gröda för att få förslag."
    : rotationSections.length === 0
      ? "Växtföljd: inga skiften är markerade att ingå ännu."
      : !recommendedSection
        ? selectedSection?.rotationEnabled === false
          ? `Växtföljd: ${selectedSection.name} ingår inte i växtföljden. Välj gärna ett roterande skifte för ${selectedSeed.family}.`
          : `Växtföljd: ingen tidigare placering hittades för ${selectedSeed.family}. Du kan starta i valfritt skifte som ingår.`
        : !selectedSection
          ? `${selectedSeed.family} låg senast i ${previousSection?.name ?? "okänt skifte"} ${selectedYear - 1}. Välj ${recommendedSection.name} ${selectedYear}.`
          : !selectedSection.rotationEnabled
            ? `Vald bädd ligger i ${selectedSection.name}, som inte ingår i växtföljden. Välj ${recommendedSection.name}.`
            : selectedSection.id !== recommendedSection.id
              ? `${selectedSeed.family} låg senast i ${previousSection?.name ?? "okänt skifte"} ${selectedYear - 1}. För växtföljd: välj ${recommendedSection.name}. Vald bädd ligger i ${selectedSection.name}.`
              : `Bra val. ${selectedSeed.family} fortsätter i ${selectedSection.name} ${selectedYear}.`;

  const visibleStages = [
    {
      active: planningMode === "forsadd" && Boolean(selectedSeed?.schedule.forsaddStart || selectedSeed?.schedule.forsaddEnd || scheduleValues.forsaddStart),
      color: "#6f8fc8",
      label: "Försådd",
      nameEnd: "forsaddEnd" as const,
      nameStart: "forsaddStart" as const,
      recommendedEnd: selectedSeed?.schedule.forsaddEnd ?? null,
      recommendedStart: selectedSeed?.schedule.forsaddStart ?? null,
      selectedWeek: selectedSchedule.forsaddStart ?? null,
      value: scheduleValues.forsaddStart,
    },
    {
      active: planningMode === "direktsadd" && Boolean(selectedSeed?.schedule.directStart || selectedSeed?.schedule.directEnd || scheduleValues.directStart),
      color: "#c58f45",
      label: "Direktsådd",
      nameEnd: "directEnd" as const,
      nameStart: "directStart" as const,
      recommendedEnd: selectedSeed?.schedule.directEnd ?? null,
      recommendedStart: selectedSeed?.schedule.directStart ?? null,
      selectedWeek: selectedSchedule.directStart ?? null,
      value: scheduleValues.directStart,
    },
    {
      active: planningMode === "forsadd" && Boolean(selectedSeed?.schedule.transplantStart || selectedSeed?.schedule.transplantEnd || scheduleValues.transplantStart),
      color: "#5f9b71",
      label: "Utplantering",
      nameEnd: "transplantEnd" as const,
      nameStart: "transplantStart" as const,
      recommendedEnd: selectedSeed?.schedule.transplantEnd ?? null,
      recommendedStart: selectedSeed?.schedule.transplantStart ?? null,
      selectedWeek: selectedSchedule.transplantStart ?? null,
      value: scheduleValues.transplantStart,
    },
    {
      active: Boolean(selectedSeed?.schedule.harvestStart || selectedSeed?.schedule.harvestEnd || scheduleValues.harvestStart),
      color: "#b96f5b",
      label: "Skörd",
      nameEnd: "harvestEnd" as const,
      nameStart: "harvestStart" as const,
      recommendedEnd: selectedSeed?.schedule.harvestEnd ?? null,
      recommendedStart: selectedSeed?.schedule.harvestStart ?? null,
      selectedWeek: selectedSchedule.harvestStart ?? null,
      value: scheduleValues.harvestStart,
    },
  ].filter((item) => item.active);

  function syncLinkedGaps(nextSchedule: ScheduleFormState) {
    const presowWeek = getNumber(nextSchedule.forsaddStart);
    const transplantWeek = getNumber(nextSchedule.transplantStart);
    const harvestWeek = getNumber(nextSchedule.harvestStart);

    setLinkedGaps({
      presowToTransplant: presowWeek != null && transplantWeek != null ? transplantWeek - presowWeek : 0,
      transplantToHarvest: transplantWeek != null && harvestWeek != null ? harvestWeek - transplantWeek : 0,
    });
  }

  function applyPlanningMode(seed: SeedOption | null, mode: PlanningSowMode) {
    const nextSchedule = scheduleToFormState(seed?.schedule);
    const nextValues: ScheduleFormState = {
      ...nextSchedule,
      directEnd: mode === "direktsadd" ? nextSchedule.directStart : "",
      directStart: mode === "direktsadd" ? nextSchedule.directStart : "",
      forsaddEnd: mode === "forsadd" ? nextSchedule.forsaddStart : "",
      forsaddStart: mode === "forsadd" ? nextSchedule.forsaddStart : "",
      harvestEnd: nextSchedule.harvestStart,
      harvestStart: nextSchedule.harvestStart,
      transplantEnd: mode === "forsadd" ? nextSchedule.transplantStart : "",
      transplantStart: mode === "forsadd" ? nextSchedule.transplantStart : "",
    };

    setScheduleValues(nextValues);
    syncLinkedGaps(nextValues);
  }

  function handleSeedChange(value: string) {
    const seed = seedOptions.find((option) => option.id === value) ?? null;
    const nextStockBatch = seed
      ? stockBatches.find((batch) => {
        if (seed.personalSeedId && batch.personalSeedId === seed.personalSeedId) {
          return true;
        }

        return batch.crop.toLocaleLowerCase("sv") === seed.crop.toLocaleLowerCase("sv");
      })
      : null;
    const nextMode = getPlanningSowModes(seed?.schedule)[0] ?? "direktsadd";

    setSeedSourceId(value);
    setSelectedStockBatchId(nextStockBatch?.id ?? "");
    setRowSpacingCm(seed?.rowSpacing ?? "");
    setPlantSpacingCm(seed?.spacing ?? "");
    setPlanningMode(nextMode);
    setTitle(seed?.variety ?? "");
    applyPlanningMode(seed, nextMode);
  }

  function handleFieldChange(value: string) {
    const field = fields.find((option) => option.id === value);
    setFieldId(value);
    setBedWidthCm(field?.widthM && field?.lengthM ? String(Math.round(Math.min(field.widthM, field.lengthM) * 100)) : "");
    setAreaM2(field?.areaM2 ? String(field.areaM2).replace(".", ",") : "");
  }

  function handleWeekChange(nameStart: keyof ScheduleFormState, nameEnd: keyof ScheduleFormState, value: string) {
    setScheduleValues((current) => {
      const next = { ...current, [nameStart]: value, [nameEnd]: value };

      if (planningMode === "forsadd") {
        const selectedWeek = getNumber(value);

        if (selectedWeek != null && nameStart === "forsaddStart") {
          const transplantWeek = clampWeek(selectedWeek + linkedGaps.presowToTransplant);
          const harvestWeek = clampWeek(transplantWeek + linkedGaps.transplantToHarvest);
          next.transplantStart = String(transplantWeek);
          next.transplantEnd = String(transplantWeek);
          next.harvestStart = String(harvestWeek);
          next.harvestEnd = String(harvestWeek);
        }

        if (selectedWeek != null && nameStart === "transplantStart") {
          const presowWeek = clampWeek(selectedWeek - linkedGaps.presowToTransplant);
          const harvestWeek = clampWeek(selectedWeek + linkedGaps.transplantToHarvest);
          next.forsaddStart = String(presowWeek);
          next.forsaddEnd = String(presowWeek);
          next.harvestStart = String(harvestWeek);
          next.harvestEnd = String(harvestWeek);
        }

        if (selectedWeek != null && nameStart === "harvestStart") {
          const transplantWeek = clampWeek(selectedWeek - linkedGaps.transplantToHarvest);
          const presowWeek = clampWeek(transplantWeek - linkedGaps.presowToTransplant);
          next.transplantStart = String(transplantWeek);
          next.transplantEnd = String(transplantWeek);
          next.forsaddStart = String(presowWeek);
          next.forsaddEnd = String(presowWeek);
        }
      }

      return next;
    });
  }

  function applySpacingDialog() {
    setShowSpacingDialog(false);
  }

  return (
    <form action={action} className="portal-dialog__card planning-form">
      <button className="planning-form__close" type="button" aria-label="Stäng" onClick={onCancel}>
        ×
      </button>

      <aside className="planning-form__sidebar">
        <div className="planning-form__visual">
          {familyImage ? <img alt={selectedSeed?.family ?? "Växtfamilj"} src={familyImage} /> : <strong>{selectedSeed?.family?.slice(0, 1) ?? "?"}</strong>}
        </div>

        <div className="planning-form__summary">
          <h3>{selectedSeed?.crop || "Ny gröda"}</h3>
          <div className="planning-form__notes">
            <span className="planning-form__note planning-form__note--capacity">{selectedFieldNote}</span>
            <span className="planning-form__note planning-form__note--rotation">{rotationNote}</span>
            {!selectedSeed && workspaceName ? <span>{workspaceName}</span> : null}
          </div>
        </div>
      </aside>

      <section className="planning-form__main">
        <div className="planning-form__head">
          <h3>Lägg till gröda</h3>
        </div>

        <div className="planning-form__grid">
          <div className={`planning-form__wide planning-form__top-row${sowModes.length > 1 ? " has-mode" : ""}`}>
            {sowModes.length > 1 ? (
              <div className="planning-mode-switcher-wrap">
                <span>Lägg till som</span>
                <div className="planning-mode-switcher" role="tablist" aria-label="Välj såsätt">
                  <button className={planningMode === "forsadd" ? "is-active" : ""} type="button" onClick={() => {
                    setPlanningMode("forsadd");
                    applyPlanningMode(selectedSeed, "forsadd");
                  }}>
                    Från försådd
                  </button>
                  <button className={planningMode === "direktsadd" ? "is-active" : ""} type="button" onClick={() => {
                    setPlanningMode("direktsadd");
                    applyPlanningMode(selectedSeed, "direktsadd");
                  }}>
                    Direktsådd
                  </button>
                </div>
              </div>
            ) : null}

            <label>
              Gröda
              <select name="personalSeedId" onChange={(event) => handleSeedChange(event.target.value)} value={seedSourceId}>
                <option value="">Välj gröda</option>
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
              Sort / anteckning
              <input onChange={(event) => setTitle(event.target.value)} placeholder="Sort eller egen anteckning" value={title} />
            </label>
          </div>

          <label className="planning-form__wide">
            Frö från lager
            <select name="seedStockBatchId" onChange={(event) => setSelectedStockBatchId(event.target.value)} value={selectedStockBatchId}>
              <option value="">
                {selectedSeed
                  ? (matchingStockBatches.length > 0 ? "Välj fröpost i lager" : "Inga fröer i lager för vald gröda")
                  : "Välj gröda först"}
              </option>
              {matchingStockBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {[batch.name || batch.crop, batch.variety].filter(Boolean).join(" - ")} ({batch.quantity} st)
                </option>
              ))}
            </select>
          </label>

          <div className="planning-form__wide planning-schedule-grid planning-schedule-grid--editable">
            {visibleStages.map((stage) => (
              <WeekInputPair
                key={stage.label}
                end={scheduleValues[stage.nameEnd]}
                label={stage.label}
                nameEnd={stage.nameEnd}
                nameStart={stage.nameStart}
                onChange={setScheduleValues}
                onWeekChange={handleWeekChange}
                recommendedEnd={stage.recommendedEnd}
                recommendedStart={stage.recommendedStart}
                start={stage.value}
              />
            ))}
          </div>

          <ScheduleWarning schedule={scheduleValues} seedSchedule={selectedSeed?.schedule ?? null} />

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

          <div className="planning-form__wide planning-sowing-inline">
            <label className="planning-sowing-inline__area">
              Yta (m²)
              <input inputMode="decimal" name="areaM2" onChange={(event) => setAreaM2(event.target.value)} value={areaM2} />
            </label>
            <div className="planning-sowing-inline__control" aria-label="Anpassa såavstånd">
              <button className="planning-sowing-inline__button" type="button" onClick={() => setShowSpacingDialog(true)}>Anpassa</button>
            </div>
            <div className="planning-sowing-summary-card">
              <span>Antal frö</span>
              <strong>{seedCount || 0}</strong>
              <small>{layout.rowCount ? `${layout.rowCount} rader x ${layout.plantsPerRow} platser per rad` : "Välj gröda och bädd."}</small>
            </div>
          </div>

          <div className="planning-form__wide planning-mini-timeline">
            <div className="planning-mini-timeline__head">
              <strong>Planöversikt</strong>
              <span>Rekommenderade intervall i bakgrunden, valda veckor ovanpå.</span>
            </div>
            <RecommendedMiniTimeline rows={visibleStages} />
          </div>

          <input name="title" type="hidden" value={[selectedSeed?.crop, title].filter(Boolean).join(", ")} />
          <input name="batchName" type="hidden" value={title || selectedSeed?.crop || ""} />
          <input name="sowMethod" type="hidden" value={planningMode === "forsadd" ? "Försådd" : "Direktsådd"} />
          <input name="startYear" type="hidden" value={String(selectedYear)} />
          <input name="note" type="hidden" value="" />
          <input name="plannedSeedCount" type="hidden" value={seedCount || ""} />

          <label className="planning-form__hidden">
            Bäddbredd cm
            <input inputMode="decimal" name="bedWidthCm" onChange={(event) => setBedWidthCm(event.target.value)} value={bedWidthCm} />
          </label>

          <label className="planning-form__hidden">
            Radavstånd cm
            <input inputMode="decimal" name="rowSpacingCm" onChange={(event) => setRowSpacingCm(event.target.value)} value={rowSpacingCm} />
          </label>

          <label className="planning-form__hidden">
            Plantavstånd cm
            <input inputMode="decimal" name="plantSpacingCm" onChange={(event) => setPlantSpacingCm(event.target.value)} value={plantSpacingCm} />
          </label>

          <label className="planning-form__hidden">
            Rader
            <input inputMode="numeric" name="plannedRows" onChange={(event) => setManualRows(event.target.value)} value={manualRows} />
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
  rows,
}: {
  rows: {
    color: string;
    label: string;
    recommendedEnd: number | null;
    recommendedStart: number | null;
    selectedWeek: number | null;
  }[];
}) {
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
                    background: row.color,
                    gridColumn: `${Math.max(1, Math.min(recommendedStart, 52))} / ${Math.max(1, Math.min(recommendedEnd + 1, 53))}`,
                  }}
                />
              ) : null}
              {row.selectedWeek ? (
                <i
                  className="planning-mini-timeline__selected"
                  style={{
                    background: row.color,
                    gridColumn: `${Math.max(1, Math.min(row.selectedWeek, 52))} / ${Math.max(2, Math.min(row.selectedWeek + 1, 53))}`,
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
  onWeekChange,
  recommendedEnd,
  recommendedStart,
  start,
}: {
  end: string;
  label: string;
  nameEnd: keyof ScheduleFormState;
  nameStart: keyof ScheduleFormState;
  onChange: Dispatch<SetStateAction<ScheduleFormState>>;
  onWeekChange: (nameStart: keyof ScheduleFormState, nameEnd: keyof ScheduleFormState, value: string) => void;
  recommendedEnd: number | null;
  recommendedStart: number | null;
  start: string;
}) {
  const outsideRecommendation = isWeekOutsideRecommendation(start, recommendedStart, recommendedEnd);

  return (
    <label className={`planning-week-pair${outsideRecommendation ? " is-warning" : ""}`}>
      <span className="planning-week-pair__label">
        <span>{label}</span>
        <small>{formatRecommendedRange(recommendedStart, recommendedEnd)}</small>
      </span>
      <input
        aria-label={`${label} vecka`}
        inputMode="numeric"
        max={52}
        min={1}
        name={nameStart}
        onChange={(event) => onWeekChange(nameStart, nameEnd, event.target.value)}
        placeholder="vecka"
        value={start}
      />
      <input
        aria-label={`${label} slutvecka`}
        hidden
        inputMode="numeric"
        max={52}
        min={1}
        name={nameEnd}
        onChange={(event) => onChange((current) => ({ ...current, [nameEnd]: event.target.value }))}
        value={end}
      />
    </label>
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
