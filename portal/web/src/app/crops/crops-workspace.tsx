"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { CropCreateForm } from "@/app/crops/crop-create-form";
import type { CropRow } from "@/lib/data/crops";
import type { FieldRow, SectionRow } from "@/lib/data/fields";
import type { SeedStockBatchRow } from "@/lib/data/inventory";
import type { FrostWindow } from "@/lib/data/preferences";
import type { PersonalSeedRow, SeedSchedule, SeedTemplateOption } from "@/lib/data/seeds";
import type { TaskRow } from "@/lib/data/tasks";

type CropsWorkspaceProps = {
  action: (formData: FormData) => void | Promise<void>;
  crops: CropRow[];
  error?: string;
  fields: FieldRow[];
  personalSeeds: PersonalSeedRow[];
  sections: SectionRow[];
  seedTemplates: SeedTemplateOption[];
  stockBatches: SeedStockBatchRow[];
  tasks: TaskRow[];
  clearAllCropsAction: () => void | Promise<void>;
  deleteCropAction: (formData: FormData) => void | Promise<void>;
  frostWindow: FrostWindow | null;
  importInventorySeedsAction: (formData: FormData) => void | Promise<void>;
  purchaseShoppingSeedsAction: (formData: FormData) => void | Promise<void>;
  updateCropAction: (formData: FormData) => void | Promise<void>;
  updateScheduleAction: (formData: FormData) => void | Promise<void>;
  workspaceName: string;
};

type TimelineView = "presow" | "crops" | "utilization";
type ActivityKey = keyof typeof ACTIVITY_META;
type DragState = {
  activity: ActivityKey;
  cropId: string;
  duration: number;
} | null;

const ACTIVITY_META = {
  forsadd: { color: "#87a97d", icon: "presow", label: "Försådd" },
  direktsadd: { color: "#c59a4e", icon: "directSow", label: "Direktsådd" },
  utplantering: { color: "#5b91a2", icon: "transplantOut", label: "Utplantering" },
  skord: { color: "#d16d58", icon: "harvestCrop", label: "Skörd" },
} as const;

const WEEKS = Array.from({ length: 52 }, (_, index) => index + 1);
const DEFAULT_FROST_WINDOW: FrostWindow = {
  lastSpringWeek: 20,
  springRiskStartWeek: 17,
  springRiskEndWeek: 20,
  firstAutumnWeek: 43,
  autumnRiskStartWeek: 39,
  autumnRiskEndWeek: 42,
  sourceLabel: "schablon",
};
const STATUS_OPTIONS = [
  { label: "Allt", value: "alla" },
  { label: "Ej klart", value: "open" },
  { label: "Klart", value: "done" },
] as const;

type SeedExportRow = {
  crop: string;
  variety: string;
  family: string;
  method: string;
  quantity: number;
  purchaseYear: number | null;
  expirationYear: number | null;
  supplier: string;
  notes: string;
};

type ShoppingRow = {
  key: string;
  crop: string;
  title: string;
  variety: string;
  personalSeedId: string | null;
  stockId: string | null;
  family: string;
  need: number;
  stock: number;
  purchase: number;
};

function formatArea(value: number | null | undefined) {
  if (value == null) {
    return "-";
  }

  return `${value.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} m²`;
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  if (/[;"\n]/.test(text)) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function rowsToCsv(rows: SeedExportRow[]) {
  const header = [
    "Groda",
    "Sort",
    "Familj",
    "Metod",
    "Antal",
    "Inkopsar",
    "Bast fore",
    "Leverantor",
    "Anteckningar",
  ];

  const body = rows.map((row) => [
    row.crop,
    row.variety,
    row.family,
    row.method,
    row.quantity,
    row.purchaseYear,
    row.expirationYear,
    row.supplier,
    row.notes,
  ].map(csvEscape).join(";"));

  return [header.join(";"), ...body].join("\n");
}

function csvToImportRows(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  return lines.slice(1).map((line) => {
    const cells = line.match(/("([^"]|"")*"|[^;]+)/g)?.map((cell) => (
      cell.startsWith("\"") && cell.endsWith("\"")
        ? cell.slice(1, -1).replaceAll("\"\"", "\"")
        : cell
    )) ?? [];

    return {
      crop: cells[0] ?? "",
      variety: cells[1] ?? "",
      family: cells[2] ?? "",
      method: cells[3] ?? "",
      quantity: Number(cells[4] ?? 0) || 0,
      purchaseYear: Number(cells[5] ?? 0) || null,
      expirationYear: Number(cells[6] ?? 0) || null,
      supplier: cells[7] ?? "",
      notes: cells[8] ?? "",
    };
  }).filter((row) => row.crop);
}

function getActivityIconMarkup(icon: string) {
  const icons: Record<string, string> = {
    presow: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 11V7.5L12 3l7.5 4.5V11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.5 10.5V19h11v-8.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 7v7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="m9.5 11.5 2.5 2.8 2.5-2.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    directSow: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="m9.5 9.5 2.5 2.8 2.5-2.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 17.5h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M7 20c1-.8 2-.8 3 0 .9-.8 2-.8 3 0 .9-.8 2-.8 4 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    transplantOut: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.8"></circle><path d="M12 2.8v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M12 18.2v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="m5.5 5.5 2.1 2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="m16.4 16.4 2.1 2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M2.8 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M18.2 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="m5.5 18.5 2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="m16.4 7.6 2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>',
    harvestCrop: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 6c2.1-2.2 5.6-2 7.4.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M11.5 8.5c3.9 0 6.8 2.8 6.8 6.2 0 3.2-2.6 5.8-6.2 5.8-3.7 0-6.4-2.5-6.4-5.9 0-3.8 2.8-6.1 5.8-6.1Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.8 4.2c-.2 1.8.2 3.1 1.3 4.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M8.7 10.2c.8.5 1.6.7 2.5.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>',
    shoppingCart: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h2l2.1 9.5h8.8L19 8H7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="10" cy="19" r="1.4" stroke="currentColor" stroke-width="1.8"></circle><circle cx="17" cy="19" r="1.4" stroke="currentColor" stroke-width="1.8"></circle></svg>',
  };

  return icons[icon] ?? icons.presow;
}

function getRange(start: number | null, end: number | null) {
  if (!start && !end) {
    return null;
  }

  const safeStart = Math.min(Math.max(start ?? end ?? 1, 1), 52);
  const safeEnd = Math.min(Math.max(end ?? start ?? safeStart, safeStart), 52);
  return { start: safeStart, end: safeEnd };
}

function getScheduleRanges(schedule: SeedSchedule) {
  return [
    { key: "forsadd", ...ACTIVITY_META.forsadd, range: getRange(schedule.forsaddStart, schedule.forsaddEnd) },
    { key: "direktsadd", ...ACTIVITY_META.direktsadd, range: getRange(schedule.directStart, schedule.directEnd) },
    { key: "utplantering", ...ACTIVITY_META.utplantering, range: getRange(schedule.transplantStart, schedule.transplantEnd) },
    { key: "skord", ...ACTIVITY_META.skord, range: getRange(schedule.harvestStart, schedule.harvestEnd) },
  ];
}

function rangeStyle(range: { start: number; end: number }, color: string) {
  return {
    gridColumn: `${range.start} / ${range.end + 1}`,
    "--timeline-color": color,
  } as CSSProperties;
}

function markerStyle(range: { start: number; end: number }, color: string) {
  const week = Math.round((range.start + range.end) / 2);
  return {
    gridColumn: `${week} / ${week + 1}`,
    "--timeline-color": color,
  } as CSSProperties;
}

function markerRange(range: { start: number; end: number }) {
  const week = Math.round((range.start + range.end) / 2);
  return { start: week, end: week };
}

function getFieldAreaForCrops(crops: CropRow[], fields: FieldRow[]) {
  const fieldIds = new Set(crops.flatMap((crop) => crop.fields.map((field) => field.fieldId)));
  return fields
    .filter((field) => fieldIds.has(field.id))
    .reduce((sum, field) => sum + (field.areaM2 ?? 0), 0);
}

function getOccupancyLevel(ratio: number) {
  if (ratio <= 0) {
    return "empty";
  }
  if (ratio <= 0.25) {
    return "low";
  }
  if (ratio <= 0.5) {
    return "medium";
  }
  if (ratio <= 0.75) {
    return "high";
  }
  if (ratio < 1) {
    return "full";
  }
  return "over";
}

function getBedOccupancyRange(schedule: SeedSchedule) {
  const start = schedule.directStart ?? schedule.transplantStart ?? schedule.directEnd ?? schedule.transplantEnd;
  const end = schedule.harvestEnd ?? schedule.harvestStart;

  if (!start || !end) {
    return null;
  }

  return getRange(start, end);
}

function cropFieldName(crop: CropRow) {
  return crop.fields[0]?.fieldName ?? "Utan bädd";
}

function normalizeFamily(family: string) {
  return family.toLocaleLowerCase("sv").replace(/[^a-zåäö0-9]+/gi, "-").replace(/^-|-$/g, "");
}

function getFamilyImage(family: string) {
  const key = normalizeFamily(family);
  return key ? `/familjer/${key}.png` : "";
}

function getCropFamily(crop: CropRow, personalSeeds: PersonalSeedRow[], seedTemplates: SeedTemplateOption[]) {
  const personalSeed = personalSeeds.find((seed) => seed.id === crop.personalSeedId);
  if (personalSeed?.family) {
    return personalSeed.family;
  }

  const normalizedTitle = crop.title.toLocaleLowerCase("sv");
  const template = seedTemplates.find((seed) => normalizedTitle.includes(seed.crop.toLocaleLowerCase("sv")));
  return template?.family ?? "Okänd familj";
}

function getTaskActivity(task: TaskRow) {
  const eventId = task.legacyEventId ?? "";
  if (eventId.includes("-forsadd-")) {
    return "forsadd";
  }
  if (eventId.includes("-direktsadd-")) {
    return "direktsadd";
  }
  if (eventId.includes("-utplantering-")) {
    return "utplantering";
  }
  if (eventId.includes("-skord-")) {
    return "skord";
  }
  return null;
}

function getTaskWeek(task: TaskRow) {
  const match = task.legacyEventId?.match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function getFirstPlannedWeek(crop: CropRow) {
  const weeks = getScheduleRanges(crop.schedule)
    .map((item) => item.range?.start)
    .filter((week): week is number => typeof week === "number");
  return weeks.length > 0 ? Math.min(...weeks) : null;
}

function getActivityStatus(crop: CropRow, activity: ActivityKey, tasks: TaskRow[]) {
  const activityTasks = tasks.filter((task) => task.cropId === crop.id && getTaskActivity(task) === activity);
  if (activityTasks.length === 0) {
    return "open";
  }
  return activityTasks.every((task) => task.status === "done") ? "done" : "open";
}

function cropMatchesStatus(crop: CropRow, statusFilter: string, tasks: TaskRow[], activeTypes: Set<string>) {
  if (statusFilter === "alla") {
    return true;
  }

  return getScheduleRanges(crop.schedule).some((item) => (
    item.range && activeTypes.has(item.key) && getActivityStatus(crop, item.key as ActivityKey, tasks) === statusFilter
  ));
}

function getIsoWeek(date = new Date()) {
  const current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  return Math.ceil((((current.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getResolvedFrostWindow(frostWindow: FrostWindow | null) {
  return frostWindow ?? DEFAULT_FROST_WINDOW;
}

function weekToPercentStart(week: number) {
  return `${((week - 1) / 52) * 100}%`;
}

function weekToPercentWidth(startWeek: number, endWeek: number) {
  return `${((endWeek - startWeek + 1) / 52) * 100}%`;
}

function getOverallOccupancy(crops: CropRow[], fields: FieldRow[]) {
  const totalArea = getFieldAreaForCrops(crops, fields);
  const weeklyArea = new Map<number, number>();

  for (const crop of crops) {
    const occupancyRange = getBedOccupancyRange(crop.schedule);

    if (!occupancyRange) {
      continue;
    }

    for (let week = occupancyRange.start; week <= occupancyRange.end; week += 1) {
      weeklyArea.set(week, (weeklyArea.get(week) ?? 0) + (crop.areaM2 ?? 0));
    }
  }

  return WEEKS.map((week) => {
    const ratio = totalArea > 0 ? (weeklyArea.get(week) ?? 0) / totalArea : 0;
    return { level: getOccupancyLevel(ratio), ratio, week };
  });
}

function hasVisibleRange(crop: CropRow, view: TimelineView, activeTypes: Set<string>) {
  return getScheduleRanges(crop.schedule).some((item) => {
    if (!item.range) {
      return false;
    }

    if (view === "presow") {
      return item.key === "forsadd";
    }

    return activeTypes.has(item.key);
  });
}

function getGroupedFields(fields: FieldRow[], sections: SectionRow[]) {
  return [
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
}

export function CropsWorkspace({
  action,
  clearAllCropsAction,
  crops,
  error,
  fields,
  frostWindow,
  importInventorySeedsAction,
  personalSeeds,
  purchaseShoppingSeedsAction,
  sections,
  seedTemplates,
  stockBatches,
  tasks,
  deleteCropAction,
  updateCropAction,
  updateScheduleAction,
  workspaceName,
}: CropsWorkspaceProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const helpDialogRef = useRef<HTMLDialogElement>(null);
  const shoppingDialogRef = useRef<HTMLDialogElement>(null);
  const importFormRef = useRef<HTMLFormElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importRowsRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<TimelineView>("crops");
  const [fieldFilter, setFieldFilter] = useState("alla");
  const [sectionFilter, setSectionFilter] = useState("alla");
  const [familyFilter, setFamilyFilter] = useState("alla");
  const [statusFilter, setStatusFilter] = useState("alla");
  const [sortBy, setSortBy] = useState("field");
  const [activeTypes, setActiveTypes] = useState(() => new Set(Object.keys(ACTIVITY_META)));
  const [dragState, setDragState] = useState<DragState>(null);
  const [editingCrop, setEditingCrop] = useState<CropRow | null>(null);
  const currentWeek = getIsoWeek();
  const resolvedFrostWindow = getResolvedFrostWindow(frostWindow);

  const filteredCrops = useMemo(() => {
    return crops
      .filter((crop) => fieldFilter === "alla" || crop.fields.some((field) => field.fieldId === fieldFilter))
      .filter((crop) => sectionFilter === "alla" || crop.fields.some((cropField) => {
        const field = fields.find((item) => item.id === cropField.fieldId);
        return field?.sectionId === sectionFilter;
      }))
      .filter((crop) => familyFilter === "alla" || getCropFamily(crop, personalSeeds, seedTemplates) === familyFilter)
      .filter((crop) => cropMatchesStatus(crop, statusFilter, tasks, activeTypes))
      .filter((crop) => hasVisibleRange(crop, view, activeTypes));
  }, [activeTypes, crops, familyFilter, fieldFilter, fields, personalSeeds, sectionFilter, seedTemplates, statusFilter, tasks, view]);

  const cropsByField = useMemo(() => {
    const map = new Map<string, CropRow[]>();
    const sortedCrops = [...filteredCrops].sort((a, b) => (
      sortBy === "name" ? a.title.localeCompare(b.title, "sv") : cropFieldName(a).localeCompare(cropFieldName(b), "sv")
    ));
    for (const crop of sortedCrops) {
      const key = sortBy === "family" ? getCropFamily(crop, personalSeeds, seedTemplates) : cropFieldName(crop);
      map.set(key, [...(map.get(key) ?? []), crop]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "sv"));
  }, [filteredCrops, personalSeeds, seedTemplates, sortBy]);

  const families = useMemo(() => (
    [...new Set(crops.map((crop) => getCropFamily(crop, personalSeeds, seedTemplates)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "sv"))
  ), [crops, personalSeeds, seedTemplates]);
  const totalArea = filteredCrops.reduce((sum, crop) => sum + (crop.areaM2 ?? 0), 0);
  const occupancyWeeks = useMemo(() => getOverallOccupancy(filteredCrops, fields), [fields, filteredCrops]);
  const shoppingRows = useMemo(() => {
    const grouped = new Map<string, ShoppingRow>();

    for (const crop of crops) {
      const personalSeed = personalSeeds.find((seed) => seed.id === crop.personalSeedId) ?? null;
      const family = getCropFamily(crop, personalSeeds, seedTemplates);
      const cropField = crop.fields[0];
      const stock = stockBatches.find((batch) => batch.id === cropField?.seedStockBatchId)
        ?? stockBatches.find((batch) => batch.personalSeedId === crop.personalSeedId)
        ?? null;
      const variety = stock?.variety || crop.batchName || "";
      const key = `${crop.personalSeedId ?? crop.title}::${variety}`;
      const plannedSeeds = crop.fields.reduce((sum, field) => {
        if (field.plannedSeedCount != null && field.plannedSeedCount > 0) {
          return sum + field.plannedSeedCount;
        }

        const fallbackArea = field.plannedAreaM2 ?? crop.areaM2 ?? 0;
        const seedPerM2 = personalSeed?.seedPerM2 ?? 0;
        return sum + (fallbackArea > 0 && seedPerM2 > 0 ? Math.ceil(fallbackArea * seedPerM2) : 0);
      }, 0);
      const existing = grouped.get(key);

      if (existing) {
        existing.need += plannedSeeds;
        existing.purchase = Math.max(existing.need - existing.stock, 0);
        continue;
      }

      grouped.set(key, {
        key,
        crop: crop.title,
        title: crop.title,
        variety,
        personalSeedId: crop.personalSeedId,
        stockId: stock?.id ?? null,
        family,
        need: plannedSeeds,
        stock: stock?.quantity ?? 0,
        purchase: Math.max(plannedSeeds - (stock?.quantity ?? 0), 0),
      });
    }

    return [...grouped.values()].sort((left, right) => left.title.localeCompare(right.title, "sv"));
  }, [crops, personalSeeds, seedTemplates, stockBatches]);

  function exportSeeds() {
    const filename = `mina-froer-${new Date().toISOString().slice(0, 10)}.csv`;
    const rows: SeedExportRow[] = personalSeeds.map((seed) => {
      const stock = stockBatches.find((batch) => batch.personalSeedId === seed.id) ?? null;
      return {
        crop: seed.crop,
        variety: stock?.variety || seed.variety,
        family: seed.family,
        method: seed.method,
        quantity: stock?.quantity ?? 0,
        purchaseYear: stock?.purchaseYear ?? null,
        expirationYear: stock?.expirationYear ?? seed.expirationYear,
        supplier: stock?.supplier ?? "",
        notes: stock?.notes || seed.notes,
      };
    });

    downloadFile(filename, rowsToCsv(rows), "text/csv;charset=utf-8");
  }

  function exportShoppingList() {
    const rows = filteredCrops.map((crop) => {
      const cropField = crop.fields[0];
      const linkedBatch = stockBatches.find((batch) => batch.id === cropField?.seedStockBatchId) ?? null;
      const plannedSeeds = cropField?.plannedSeedCount ?? 0;
      const quantity = linkedBatch?.quantity ?? 0;

      return {
        Groda: crop.title,
        Omgang: crop.batchName || "",
        Badd: cropField?.fieldName ?? "Utan bädd",
        Yta: crop.areaM2 ?? "",
        PlaneradeFron: plannedSeeds,
        "I lager": quantity,
        BehovsKopas: Math.max(0, plannedSeeds - quantity),
      };
    }).filter((row) => row.BehovsKopas > 0 || row["I lager"] === 0);

    const header = Object.keys(rows[0] ?? {
      Groda: "",
      Omgang: "",
      Badd: "",
      Yta: "",
      PlaneradeFron: "",
      "I lager": "",
      BehovsKopas: "",
    });
    const csv = [header.join(";"), ...rows.map((row) => header.map((key) => csvEscape(row[key as keyof typeof row])).join(";"))].join("\n");
    downloadFile(`inkopslista-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const parsedRows = csvToImportRows(content);

    if (parsedRows.length === 0) {
      alert("Importfilen innehöll inga frörader.");
      event.target.value = "";
      return;
    }

    if (importRowsRef.current && importFormRef.current) {
      importRowsRef.current.value = JSON.stringify(parsedRows);
      importFormRef.current.requestSubmit();
    }

    event.target.value = "";
  }

  function toggleType(type: string) {
    setActiveTypes((current) => {
      const next = new Set(current);
      if (next.has(type) && next.size > 1) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  function moveTimelineBlock(track: HTMLDivElement, clientX: number) {
    if (!dragState) {
      return;
    }

    const rect = track.getBoundingClientRect();
    const week = Math.min(52, Math.max(1, Math.round(((clientX - rect.left) / rect.width) * 52) + 1));
    const endWeek = Math.min(52, week + dragState.duration);
    const startWeek = Math.max(1, endWeek - dragState.duration);
    const formData = new FormData();
    formData.set("cropId", dragState.cropId);
    formData.set("activity", dragState.activity);
    formData.set("startWeek", String(startWeek));
    formData.set("endWeek", String(endWeek));
    startTransition(() => {
      void Promise.resolve(updateScheduleAction(formData)).then(() => router.refresh());
    });
    setDragState(null);
  }

  return (
    <>
      {error ? <p className="portal-error">{error}</p> : null}

      <section className="planning-surface">
        <div className="planning-head">
          <div className="planning-head__title">
            <div className="portal-fields-title-row">
              <h2>Odlingsplan</h2>
              <button
                aria-label="Hjälp om odlingsplan"
                className="portal-help-button"
                onClick={() => helpDialogRef.current?.showModal()}
                type="button"
              >
                ?
              </button>
            </div>
          </div>
          <div className="planning-head__actions">
            <form action={importInventorySeedsAction} ref={importFormRef}>
              <input name="rows" ref={importRowsRef} type="hidden" />
            </form>
            <input
              accept=".csv,text/csv"
              className="sr-only"
              onChange={handleImportFile}
              ref={importInputRef}
              type="file"
            />
            <button
              className="portal-button portal-button--primary"
              type="button"
              onClick={() => dialogRef.current?.showModal()}
            >
              Lägg till gröda
            </button>
            <button className="portal-button-secondary" type="button" onClick={() => shoppingDialogRef.current?.showModal()}>
              Inköpslista
            </button>
            <form
              action={clearAllCropsAction}
              onSubmit={(event) => {
                if (!window.confirm("Töm hela odlingen? Alla planerade grödor i odlingsplanen tas bort.")) {
                  event.preventDefault();
                }
              }}
            >
              <button className="portal-button-secondary portal-button-danger" type="submit">
                Töm odling
              </button>
            </form>
            <button className="portal-button-secondary" type="button" onClick={() => importInputRef.current?.click()}>
              Importera fröer
            </button>
            <button className="portal-button-secondary" type="button" onClick={exportSeeds}>
              Exportera fröer
            </button>
          </div>
        </div>

        <div className="timeline-controls">
          <div className="timeline-switcher segmented-control" aria-label="Välj tidslinjevy">
            <button className={`segment ${view === "presow" ? "is-active" : ""}`} type="button" onClick={() => setView("presow")}>
              Försådd
            </button>
            <button className={`segment ${view === "crops" ? "is-active" : ""}`} type="button" onClick={() => setView("crops")}>
              Grödor
            </button>
            <button className={`segment ${view === "utilization" ? "is-active" : ""}`} type="button" onClick={() => setView("utilization")}>
              Bäddar
            </button>
          </div>

          <div className="timeline-toolbar">
            <div className="timeline-legend" aria-label="Visa moment">
              {Object.entries(ACTIVITY_META).map(([key, item]) => (
                <button
                  className={activeTypes.has(key) ? "is-active" : ""}
                  key={key}
                  style={{ ["--accent" as string]: item.color } as CSSProperties}
                  type="button"
                  onClick={() => toggleType(key)}
                >
                <span
                  className={`timeline-chip-icon timeline-chip-icon--${key}`}
                  style={{ ["--accent" as string]: item.color } as CSSProperties}
                  dangerouslySetInnerHTML={{ __html: getActivityIconMarkup(item.icon) }}
                />
                {item.label}
              </button>
            ))}
          </div>

            <div className="timeline-filters">
              <label className="timeline-filter">
                <span>Bädd</span>
                <select value={fieldFilter} onChange={(event) => setFieldFilter(event.target.value)}>
                  <option value="alla">Alla bäddar</option>
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="timeline-filter">
                <span>Skifte</span>
                <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
                  <option value="alla">Alla skiften</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
              </label>
              <label className="timeline-filter">
                <span>Familj</span>
                <select value={familyFilter} onChange={(event) => setFamilyFilter(event.target.value)}>
                  <option value="alla">Alla familjer</option>
                  {families.map((family) => (
                    <option key={family} value={family}>{family}</option>
                  ))}
                </select>
              </label>
              <label className="timeline-filter">
                <span>Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="timeline-filter">
                <span>Sortera efter</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="field">Bädd</option>
                  <option value="family">Familj</option>
                  <option value="name">Namn</option>
                </select>
              </label>
            </div>
          </div>

          <section className="timeline-occupancy-card" aria-label="Beläggningsdiagram">
            <div className="timeline-occupancy-card__head">
              <strong>Beläggningsdiagram</strong>
              <span>{filteredCrops.length} grödor · {formatArea(totalArea)}</span>
            </div>
            <div className="timeline-occupancy-card__weeks" aria-hidden="true">
              {WEEKS.map((week) => <span key={week}>{week}</span>)}
            </div>
            <div className="timeline-occupancy-card__bars" aria-hidden="true">
              {occupancyWeeks.map((entry) => (
                <i
                  className={`is-${entry.level}`}
                  key={entry.week}
                  title={`Vecka ${entry.week}: ${Math.round(entry.ratio * 100)}% beläggning`}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="timeline-frame">
          <div className="timeline-weeks">
            <span />
            {WEEKS.map((week) => <span key={week}>{week}</span>)}
          </div>

          {view === "utilization" ? (
            <UtilizationRows crops={filteredCrops} fields={fields} frostWindow={resolvedFrostWindow} week={currentWeek} />
          ) : (
            <div className="timeline-rows">
              {cropsByField.length > 0 ? cropsByField.map(([fieldName, group]) => (
                <div className="timeline-group" key={fieldName}>
                  <div className="timeline-group-heading">
                    <strong>{fieldName}</strong>
                    <span>{group.length} grödor planerade</span>
                  </div>
                  <UtilizationOverview crops={group} fields={fields} />
                  {group.map((crop) => (
                    <div className="timeline-row" key={crop.id}>
                      <button className="timeline-meta timeline-meta--button" type="button" onClick={() => setEditingCrop(crop)}>
                        <strong>{crop.title}</strong>
                        <span>{[crop.batchName, formatArea(crop.areaM2)].filter(Boolean).join(" · ")}</span>
                      </button>
                      <div
                        className="timeline-track"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => moveTimelineBlock(event.currentTarget, event.clientX)}
                      >
                        <FrostOverlay frostWindow={resolvedFrostWindow} />
                        <span
                          aria-hidden="true"
                          className="timeline-today-line"
                          style={{ left: `calc(${((currentWeek - 1) / 52) * 100}% + 1px)` }}
                        />
                        {getScheduleRanges(crop.schedule).map((item) => {
                          const status = getActivityStatus(crop, item.key as ActivityKey, tasks);
                          return item.range && activeTypes.has(item.key) ? (
                            <span
                              className={`timeline-block timeline-block--${item.key} is-${status} is-draggable`}
                              draggable
                              key={item.key}
                              onClick={(event) => event.stopPropagation()}
                              onDragStart={() => setDragState({
                                activity: item.key as ActivityKey,
                                cropId: crop.id,
                                duration: 0,
                              })}
                              style={markerStyle(item.range, item.color)}
                              title={`${item.label} vecka ${markerRange(item.range).start}. Dra för att flytta momentet.`}
                            >
                              <span className="timeline-block__status" aria-hidden="true">{status === "done" ? "✓" : ""}</span>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )) : (
                <div className="timeline-empty">Inga grödor i valt filter.</div>
              )}
            </div>
          )}
        </div>
      </section>

      <dialog className="portal-dialog planning-dialog" ref={dialogRef}>
        <CropCreateForm
          action={action}
          crops={crops}
          fields={fields}
          onCancel={() => dialogRef.current?.close()}
          personalSeeds={personalSeeds}
          sections={sections}
          seedTemplates={seedTemplates}
          stockBatches={stockBatches}
          workspaceName={workspaceName}
        />
      </dialog>

      <dialog className="portal-dialog inventory-dialog inventory-dialog--wide" ref={shoppingDialogRef}>
        <form className="portal-dialog__card seed-shopping-dialog" method="dialog">
          <div className="portal-dialog__head">
            <div>
              <p className="section-kicker">Planering</p>
              <h3>Inköpslista</h3>
            </div>
            <button aria-label="Stäng" className="icon-button" type="submit">
              ×
            </button>
          </div>
          <p className="section-caption">
            {`Fröbehov för ${new Date().getFullYear()}. Totalt behövs ${shoppingRows.reduce((sum, row) => sum + row.need, 0)} frön, varav ${shoppingRows.reduce((sum, row) => sum + row.purchase, 0)} behöver köpas.`}
          </p>
          <div className="table-wrap seed-shopping-table-wrap">
            <table className="data-table seed-shopping-table">
              <thead>
                <tr>
                  <th>Gröda</th>
                  <th>Sort</th>
                  <th>I lager</th>
                  <th>Behov</th>
                  <th>Köp</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr className="seed-shopping-section-row">
                  <td colSpan={6}>Fröer att köpa</td>
                </tr>
                {shoppingRows.filter((row) => row.purchase > 0).length > 0 ? (
                  shoppingRows.filter((row) => row.purchase > 0).map((row) => (
                    <tr key={`buy-${row.key}`}>
                      <td><strong>{row.title}</strong></td>
                      <td>{row.variety || "-"}</td>
                      <td>{row.stock}</td>
                      <td><strong>{row.need}</strong></td>
                      <td><strong>{row.purchase}</strong></td>
                      <td>
                        {row.personalSeedId ? (
                          <form action={purchaseShoppingSeedsAction}>
                            <input name="personalSeedId" type="hidden" value={row.personalSeedId} />
                            <input name="stockId" type="hidden" value={row.stockId ?? ""} />
                            <input name="crop" type="hidden" value={row.crop} />
                            <input name="variety" type="hidden" value={row.variety} />
                            <input name="quantity" type="hidden" value={String(row.stock + row.purchase)} />
                            <button
                              className="icon-button seed-shopping-buy"
                              type="submit"
                              aria-label={`Registrera köp av ${row.title}`}
                              dangerouslySetInnerHTML={{ __html: getActivityIconMarkup("shoppingCart") }}
                            />
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="harvest-empty" colSpan={6}>Inga fröer behöver köpas just nu.</td>
                  </tr>
                )}
                <tr className="seed-shopping-section-row">
                  <td colSpan={6}>Fröer i lager som används i år</td>
                </tr>
                {shoppingRows.filter((row) => row.need > 0 && row.stock > 0 && row.purchase <= 0).length > 0 ? (
                  shoppingRows.filter((row) => row.need > 0 && row.stock > 0 && row.purchase <= 0).map((row) => (
                    <tr key={`stock-${row.key}`}>
                      <td><strong>{row.title}</strong></td>
                      <td>{row.variety || "-"}</td>
                      <td>{row.stock}</td>
                      <td><strong>{row.need}</strong></td>
                      <td><strong>{row.purchase}</strong></td>
                      <td />
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="harvest-empty" colSpan={6}>Inga lagerförda fröer används i årets plan ännu.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="form-actions">
            <button className="button-secondary" type="button" onClick={exportShoppingList}>Exportera CSV</button>
            <button className="button-primary" type="submit">Stäng</button>
          </div>
        </form>
      </dialog>

      <dialog className="portal-dialog" ref={helpDialogRef}>
        <form className="portal-dialog__card portal-help-card" method="dialog">
          <div className="portal-dialog__head">
            <div>
              <p className="section-kicker">Hjälp</p>
              <h3>Odlingsplan</h3>
            </div>
            <button aria-label="Stäng" className="icon-button" type="submit">
              ×
            </button>
          </div>
          <div className="portal-help-grid">
            <article className="portal-help-item">
              <strong>Tidslinjen</strong>
              <p>Chipsen styr vilka moment som visas. Varje markering visar vald vecka för försådd, direktsådd, utplantering eller skörd.</p>
            </article>
            <article className="portal-help-item">
              <strong>Beläggningsdiagram</strong>
              <p>Staplarna visar hur mycket av de valda bäddarna som används per vecka. Rött betyder att planeringen riskerar att bli överbelagd.</p>
            </article>
            <article className="portal-help-item">
              <strong>Frostperiod</strong>
              <p>Heldragen blå zon visar hög historisk frostrisk. Det streckade blå bandet visar övergångszonen där sista vårfrost eller första höstfrost ofta ligger.</p>
            </article>
          </div>
          <div className="flex justify-end">
            <button className="portal-button-primary" type="submit">Stäng</button>
          </div>
        </form>
      </dialog>

      {editingCrop ? (
        <CropEditDialog
          crop={editingCrop}
          fields={fields}
          deleteCropAction={deleteCropAction}
          onClose={() => setEditingCrop(null)}
          personalSeeds={personalSeeds}
          sections={sections}
          seedTemplates={seedTemplates}
          tasks={tasks}
          updateCropAction={updateCropAction}
        />
      ) : null}
    </>
  );
}

function FrostOverlay({ frostWindow }: { frostWindow: FrostWindow }) {
  const springSolidEnd = Math.min(frostWindow.lastSpringWeek, Math.max(frostWindow.springRiskStartWeek - 1, 1));
  const autumnSolidStart = Math.max(frostWindow.firstAutumnWeek, frostWindow.autumnRiskEndWeek + 1);

  return (
    <>
      {springSolidEnd >= 1 ? (
        <span
          aria-hidden="true"
          className="timeline-frost-zone timeline-frost-zone--spring"
          style={{ left: weekToPercentStart(1), width: weekToPercentWidth(1, springSolidEnd) }}
        />
      ) : null}
      {frostWindow.springRiskEndWeek >= frostWindow.springRiskStartWeek ? (
        <span
          aria-hidden="true"
          className="timeline-frost-band timeline-frost-band--spring"
          style={{
            left: weekToPercentStart(frostWindow.springRiskStartWeek),
            width: weekToPercentWidth(frostWindow.springRiskStartWeek, frostWindow.springRiskEndWeek),
          }}
        />
      ) : null}
      {autumnSolidStart <= 52 ? (
        <span
          aria-hidden="true"
          className="timeline-frost-zone timeline-frost-zone--autumn"
          style={{ left: weekToPercentStart(autumnSolidStart), width: weekToPercentWidth(autumnSolidStart, 52) }}
        />
      ) : null}
      {frostWindow.autumnRiskEndWeek >= frostWindow.autumnRiskStartWeek ? (
        <span
          aria-hidden="true"
          className="timeline-frost-band timeline-frost-band--autumn"
          style={{
            left: weekToPercentStart(frostWindow.autumnRiskStartWeek),
            width: weekToPercentWidth(frostWindow.autumnRiskStartWeek, frostWindow.autumnRiskEndWeek),
          }}
        />
      ) : null}
    </>
  );
}

function UtilizationOverview({ crops, fields }: { crops: CropRow[]; fields: FieldRow[] }) {
  const totalArea = getFieldAreaForCrops(crops, fields);
  const weeklyArea = new Map<number, number>();

  for (const crop of crops) {
    const occupancyRange = getBedOccupancyRange(crop.schedule);

    if (!occupancyRange) {
      continue;
    }

    for (let week = occupancyRange.start; week <= occupancyRange.end; week += 1) {
      weeklyArea.set(week, (weeklyArea.get(week) ?? 0) + (crop.areaM2 ?? 0));
    }
  }

  return (
    <div className="timeline-utilization-overview" aria-label="Fyllnadsgrad per vecka">
      <span />
      <div className="timeline-utilization-overview__track">
        {WEEKS.map((week) => {
          const ratio = totalArea > 0 ? (weeklyArea.get(week) ?? 0) / totalArea : 0;
          return (
            <i
              className={`is-${getOccupancyLevel(ratio)}`}
              key={week}
              title={`Vecka ${week}: ${Math.round(ratio * 100)}% beläggning`}
            />
          );
        })}
      </div>
      <span />
      <div className="timeline-utilization-overview__weeks">
        {WEEKS.map((week) => <span className={week === getIsoWeek() ? "is-current" : ""} key={week}>{week}</span>)}
      </div>
    </div>
  );
}

function UtilizationRows({
  crops,
  fields,
  frostWindow,
  week,
}: {
  crops: CropRow[];
  fields: FieldRow[];
  frostWindow: FrostWindow;
  week: number;
}) {
  return (
    <div className="timeline-rows">
      {fields.length > 0 ? fields.map((field) => {
        const fieldCrops = crops.filter((crop) => crop.fields.some((cropField) => cropField.fieldId === field.id));
        if (fieldCrops.length === 0) {
          return null;
        }

        return (
          <div className="timeline-row timeline-row--utilization" key={field.id}>
            <div className="timeline-meta">
              <strong>{field.name}</strong>
              <span>{formatArea(field.areaM2)} tillgängligt</span>
            </div>
            <div className="timeline-track">
              <FrostOverlay frostWindow={frostWindow} />
              <span
                aria-hidden="true"
                className="timeline-today-line"
                style={{ left: `calc(${((week - 1) / 52) * 100}% + 1px)` }}
              />
              {fieldCrops.map((crop) => {
                const ranges = getScheduleRanges(crop.schedule).map((item) => item.range).filter(Boolean) as { start: number; end: number }[];
                const start = Math.min(...ranges.map((range) => range.start));
                const end = Math.max(...ranges.map((range) => range.end));
                return Number.isFinite(start) && Number.isFinite(end) ? (
                  <span
                    className="timeline-block timeline-block--utilization"
                    key={crop.id}
                    style={rangeStyle({ start, end }, "#7aa95c")}
                    title={crop.title}
                  >
                    {crop.title}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        );
      }) : (
        <div className="timeline-empty">Skapa bäddar under Odlingsytor för att se beläggning.</div>
      )}
    </div>
  );
}

function CropEditDialog({
  crop,
  fields,
  deleteCropAction,
  onClose,
  personalSeeds,
  sections,
  seedTemplates,
  tasks,
  updateCropAction,
}: {
  crop: CropRow;
  fields: FieldRow[];
  deleteCropAction: (formData: FormData) => void | Promise<void>;
  onClose: () => void;
  personalSeeds: PersonalSeedRow[];
  sections: SectionRow[];
  seedTemplates: SeedTemplateOption[];
  tasks: TaskRow[];
  updateCropAction: (formData: FormData) => void | Promise<void>;
}) {
  const groupedFields = getGroupedFields(fields, sections);
  const cropField = crop.fields[0];
  const [selectedFieldId, setSelectedFieldId] = useState(cropField?.fieldId ?? "");
  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? null;
  const selectedSection = sections.find((section) => section.id === selectedField?.sectionId) ?? null;
  const family = getCropFamily(crop, personalSeeds, seedTemplates);
  const familyImage = getFamilyImage(family);
  const cropTasks = tasks.filter((task) => task.cropId === crop.id);
  const availableArea = selectedField?.areaM2 ?? null;

  return (
    <div className="crop-edit-overlay" role="dialog" aria-modal="true" aria-label="Redigera gröda">
      <form action={updateCropAction} className="crop-edit-card crop-edit-card--planner">
        <aside className="crop-edit-sidebar">
          <div className="crop-edit-visual">
            {familyImage ? <span style={{ backgroundImage: `url(${familyImage})` }} /> : <strong>{family.slice(0, 1)}</strong>}
          </div>
          <h3>{crop.title}</h3>
          <dl>
            <div><dt>Yta</dt><dd>{formatArea(crop.areaM2)}</dd></div>
            <div><dt>Placering</dt><dd>{[selectedField?.name, selectedSection?.name].filter(Boolean).join(" · ") || "-"}</dd></div>
            <div><dt>Start</dt><dd>Vecka {getFirstPlannedWeek(crop) ?? "-"}</dd></div>
          </dl>
        </aside>
        <section className="crop-edit-main">
        <div className="crop-edit-card__head">
          <h3>Justera gröda</h3>
          <button type="button" aria-label="Stäng" onClick={onClose}>×</button>
        </div>
        <input name="cropId" type="hidden" value={crop.id} />
        <div className="crop-edit-grid">
          <label>
            Namn
            <input name="title" defaultValue={crop.title} required />
          </label>
          <label>
            Omgång
            <input name="batchName" defaultValue={crop.batchName} />
          </label>
          <label>
            År
            <input name="startYear" defaultValue={crop.startYear} inputMode="numeric" />
          </label>
          <label>
            Yta m²
            <input name="areaM2" defaultValue={crop.areaM2 ?? ""} inputMode="decimal" />
          </label>
          <label className="crop-edit-grid__wide">
            Bädd
            <input name="fieldId" type="hidden" value={selectedFieldId} />
            <div className="crop-edit-bed-groups">
              {groupedFields.map((group) => (
                <section className="crop-edit-bed-group" key={group.id}>
                  <strong>{group.label}</strong>
                  <div>
                    {group.fields.map((field) => (
                      <button
                        className={field.id === selectedFieldId ? "is-selected" : ""}
                        key={field.id}
                        type="button"
                        onClick={() => setSelectedFieldId(field.id)}
                      >
                        {field.name}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <select className="crop-edit-field-fallback" defaultValue={cropField?.fieldId ?? ""} disabled>
              <option value="">Välj bädd</option>
              {groupedFields.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.fields.map((field) => (
                    <option key={field.id} value={field.id}>{field.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <ScheduleInput label="Försådd" nameStart="forsaddStart" start={crop.schedule.forsaddStart} />
          <ScheduleInput label="Direktsådd" nameStart="directStart" start={crop.schedule.directStart} />
          <ScheduleInput label="Utplantering" nameStart="transplantStart" start={crop.schedule.transplantStart} />
          <ScheduleInput label="Skörd" nameStart="harvestStart" start={crop.schedule.harvestStart} />
          <div className="crop-edit-grid__wide crop-edit-area-note">
            {availableArea != null ? `${formatArea(availableArea)} tillgängligt i vald bädd. Den här omgången använder ${formatArea(crop.areaM2)}.` : "Välj bädd för att se tillgänglig yta."}
          </div>
          <div className="crop-edit-grid__wide crop-edit-task-list">
            <span>Uppgifter för grödan</span>
            {cropTasks.length > 0 ? cropTasks.map((task) => (
              <label key={task.id}>
                <input name="taskId" type="hidden" value={task.id} />
                <input defaultChecked={task.status === "done"} name="doneTaskId" type="checkbox" value={task.id} />
                <strong>{ACTIVITY_META[getTaskActivity(task) as ActivityKey]?.label ?? task.title}</strong>
                <small>vecka {getTaskWeek(task) ?? "-"}</small>
              </label>
            )) : <p>Inga uppgifter är skapade för grödan ännu.</p>}
          </div>
          <label className="crop-edit-grid__wide">
            Notering
            <textarea name="note" defaultValue={crop.note} rows={3} />
          </label>
          <input name="plannedRows" type="hidden" value={cropField?.plannedRows ?? ""} />
          <input name="rowSpacingCm" type="hidden" value={cropField?.rowSpacingCm ?? ""} />
          <input name="plantSpacingCm" type="hidden" value={cropField?.plantSpacingCm ?? ""} />
          <input name="plannedSeedCount" type="hidden" value={cropField?.plannedSeedCount ?? ""} />
          <input name="seedStockBatchId" type="hidden" value={cropField?.seedStockBatchId ?? ""} />
        </div>
        <div className="crop-edit-card__actions">
          <button className="portal-button portal-button-danger" form="delete-crop-form" type="submit">
            Ta bort gröda
          </button>
          <button className="portal-button" type="button" onClick={onClose}>Avbryt</button>
          <button className="portal-button portal-button--primary">Spara gröda</button>
        </div>
        </section>
      </form>
      <form action={deleteCropAction} id="delete-crop-form">
        <input name="cropId" type="hidden" value={crop.id} />
      </form>
    </div>
  );
}

function ScheduleInput({
  label,
  nameStart,
  start,
}: {
  label: string;
  nameStart: string;
  start: number | null;
}) {
  return (
    <fieldset className="crop-edit-schedule">
      <legend>{label}</legend>
      <input aria-label={`${label} vecka`} defaultValue={start ?? ""} inputMode="numeric" max={52} min={1} name={nameStart} />
    </fieldset>
  );
}
