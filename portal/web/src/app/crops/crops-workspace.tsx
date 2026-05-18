"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { CropCreateForm } from "@/app/crops/crop-create-form";
import type { CropRow } from "@/lib/data/crops";
import type { FieldRow, SectionRow } from "@/lib/data/fields";
import type { SeedStockBatchRow } from "@/lib/data/inventory";
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
  deleteCropAction: (formData: FormData) => void | Promise<void>;
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
  forsadd: { color: "#6f8fc8", label: "Försådd" },
  direktsadd: { color: "#c58f45", label: "Direktsådd" },
  utplantering: { color: "#5f9b71", label: "Utplantering" },
  skord: { color: "#b96f5b", label: "Skörd" },
} as const;

const WEEKS = Array.from({ length: 52 }, (_, index) => index + 1);
const STATUS_OPTIONS = [
  { label: "Allt", value: "alla" },
  { label: "Ej klart", value: "open" },
  { label: "Klart", value: "done" },
] as const;

function formatArea(value: number | null | undefined) {
  if (value == null) {
    return "-";
  }

  return `${value.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} m²`;
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
  crops,
  error,
  fields,
  personalSeeds,
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
          <div>
            <h2>Odlingsplan</h2>
          </div>
          <button
            className="portal-button portal-button--primary"
            type="button"
            onClick={() => dialogRef.current?.showModal()}
          >
            Lägg till gröda
          </button>
        </div>

        <div className="timeline-switcher" aria-label="Välj tidslinjevy">
          <button className={view === "presow" ? "is-active" : ""} type="button" onClick={() => setView("presow")}>
            Försådd
          </button>
          <button className={view === "crops" ? "is-active" : ""} type="button" onClick={() => setView("crops")}>
            Grödor
          </button>
          <button className={view === "utilization" ? "is-active" : ""} type="button" onClick={() => setView("utilization")}>
            Bäddar
          </button>
        </div>

        <div className="timeline-toolbar">
          <div className="timeline-summary">
            <span>Vecka 1-52</span>
            <span>{filteredCrops.length} grödor</span>
            <span>{formatArea(totalArea)}</span>
          </div>
          <div className="timeline-legend" aria-label="Visa moment">
            {Object.entries(ACTIVITY_META).map(([key, item]) => (
              <button
                className={activeTypes.has(key) ? "is-active" : ""}
                key={key}
                type="button"
                onClick={() => toggleType(key)}
              >
                <span style={{ background: item.color }} />
                {item.label}
              </button>
            ))}
          </div>
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
          <div className="timeline-filters">
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

        <div className="timeline-frame">
          <div className="timeline-weeks">
            <span />
            {WEEKS.map((week) => <span key={week}>{week}</span>)}
          </div>

          {view === "utilization" ? (
            <UtilizationRows crops={filteredCrops} fields={fields} week={currentWeek} />
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

function UtilizationRows({ crops, fields, week }: { crops: CropRow[]; fields: FieldRow[]; week: number }) {
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
