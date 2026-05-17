"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { CropRow } from "@/lib/data/crops";
import type { FieldRow } from "@/lib/data/fields";
import type { SeedStockBatchRow } from "@/lib/data/inventory";
import type { TaskRow } from "@/lib/data/tasks";

type TasksWorkspaceProps = {
  completeSowingTask: (formData: FormData) => void | Promise<void>;
  completeTask: (formData: FormData) => void | Promise<void>;
  completeTransplantTask: (formData: FormData) => void | Promise<void>;
  crops: CropRow[];
  error?: string;
  fields: FieldRow[];
  registerHarvestForTask: (formData: FormData) => void | Promise<void>;
  stockBatches: SeedStockBatchRow[];
  tasks: TaskRow[];
};

type ActivityKey = "forsadd" | "direktsadd" | "utplantering" | "skord";

const ACTIVITY_META: Record<ActivityKey, { color: string; icon: string; label: string }> = {
  forsadd: { color: "#7d96c9", icon: "⌂", label: "Försådd" },
  direktsadd: { color: "#d59b48", icon: "↓", label: "Direktsådd" },
  utplantering: { color: "#68a77a", icon: "☼", label: "Utplantering" },
  skord: { color: "#c87967", icon: "♁", label: "Skörd" },
};

const ACTIVITY_ORDER: ActivityKey[] = ["forsadd", "direktsadd", "utplantering", "skord"];

function getIsoWeek(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function formatDate(date: string | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" }).format(new Date(date));
}

function getTaskWeek(task: TaskRow) {
  const match = task.legacyEventId?.match(/-(\d+)$/);
  if (match) {
    return Number(match[1]);
  }

  if (!task.dueDate) {
    return null;
  }

  return getIsoWeek(new Date(`${task.dueDate}T00:00:00`));
}

function getTaskActivity(task: TaskRow): ActivityKey {
  const id = task.legacyEventId ?? "";
  const title = task.title.toLocaleLowerCase("sv").normalize("NFD").replace(/\p{Diacritic}/gu, "");

  if (id.includes("direktsadd") || title.startsWith("direktsa")) return "direktsadd";
  if (id.includes("utplantering") || title.startsWith("plantera ut")) return "utplantering";
  if (id.includes("skord") || title.startsWith("skorda")) return "skord";
  return "forsadd";
}

function getShortTitle(task: TaskRow) {
  return task.title.replace(/^(Förså|Direktså|Plantera ut|Skörda)\s+/i, "");
}

function getTiming(task: TaskRow, currentWeek: number) {
  if (task.status === "done") {
    return { className: "is-done", label: "Utförd" };
  }

  const week = getTaskWeek(task);
  if (week && week < currentWeek) {
    return { className: "is-late", label: "Försenad" };
  }

  if (week === currentWeek) {
    return { className: "is-current", label: "Denna vecka" };
  }

  return { className: "is-upcoming", label: week ? `Vecka ${week}` : "Planerad" };
}

function isRelevantTask(task: TaskRow, currentWeek: number) {
  const week = getTaskWeek(task);
  if (!week) {
    return true;
  }

  return week <= currentWeek || week <= Math.min(52, currentWeek + 4);
}

function getFieldName(fields: FieldRow[], fieldId: string | null) {
  return fields.find((field) => field.id === fieldId)?.name ?? "Ingen bädd";
}

function getCrop(crops: CropRow[], cropId: string | null) {
  return crops.find((crop) => crop.id === cropId) ?? null;
}

function getCropField(crop: CropRow | null, task: TaskRow) {
  if (!crop) {
    return null;
  }

  return crop.fields.find((field) => field.fieldId === task.fieldId) ?? crop.fields[0] ?? null;
}

function getOccupancyRange(crop: CropRow) {
  const start = crop.schedule.directStart ?? crop.schedule.transplantStart ?? crop.schedule.directEnd ?? crop.schedule.transplantEnd;
  const end = crop.schedule.harvestEnd ?? crop.schedule.harvestStart;
  return start && end ? { start, end } : null;
}

function getOverfilledBeds(fields: FieldRow[], crops: CropRow[], week: number) {
  return fields
    .map((field) => {
      const used = crops
        .filter((crop) => crop.fields.some((cropField) => cropField.fieldId === field.id))
        .filter((crop) => {
          const range = getOccupancyRange(crop);
          return range ? week >= range.start && week <= range.end : false;
        })
        .reduce((sum, crop) => sum + (crop.areaM2 ?? 0), 0);
      const total = field.areaM2 ?? 0;

      return { field, percent: total > 0 ? Math.round((used / total) * 100) : 0 };
    })
    .filter((item) => item.percent >= 100)
    .sort((a, b) => b.percent - a.percent);
}

export function TasksWorkspace({
  completeSowingTask,
  completeTask,
  completeTransplantTask,
  crops,
  error,
  fields,
  registerHarvestForTask,
  stockBatches,
  tasks,
}: TasksWorkspaceProps) {
  const currentWeek = getIsoWeek();
  const [statusFilter, setStatusFilter] = useState<"open" | "all">("open");
  const [fieldFilter, setFieldFilter] = useState("alla");
  const [activeTypes, setActiveTypes] = useState<Set<ActivityKey>>(() => new Set(ACTIVITY_ORDER));

  const filteredTasks = useMemo(
    () =>
      tasks
        .filter((task) => isRelevantTask(task, currentWeek))
        .filter((task) => statusFilter === "all" || task.status !== "done")
        .filter((task) => fieldFilter === "alla" || task.fieldId === fieldFilter)
        .filter((task) => activeTypes.has(getTaskActivity(task)))
        .sort((a, b) => (getTaskWeek(a) ?? 99) - (getTaskWeek(b) ?? 99)),
    [activeTypes, currentWeek, fieldFilter, statusFilter, tasks],
  );

  const relevantTasks = tasks
    .filter((task) => isRelevantTask(task, currentWeek))
    .filter((task) => fieldFilter === "alla" || task.fieldId === fieldFilter)
    .filter((task) => activeTypes.has(getTaskActivity(task)));
  const doneRelevantTasks = relevantTasks.filter((task) => task.status === "done");
  const openRelevantTasks = relevantTasks.filter((task) => task.status !== "done");
  const progress = relevantTasks.length ? Math.round((doneRelevantTasks.length / relevantTasks.length) * 100) : 100;
  const overdueTasks = openRelevantTasks.filter((task) => (getTaskWeek(task) ?? currentWeek) < currentWeek);
  const currentWeekTasks = openRelevantTasks.filter((task) => getTaskWeek(task) === currentWeek);
  const overfilledBeds = getOverfilledBeds(fields, crops, currentWeek);
  const focusItems = [
    ...overdueTasks.slice(0, 2).map((task) => `${ACTIVITY_META[getTaskActivity(task)].label}: ${getShortTitle(task)}`),
    ...currentWeekTasks.slice(0, 2).map((task) => `Denna vecka: ${getShortTitle(task)}`),
    ...overfilledBeds.slice(0, 1).map(({ field }) => `Se över ${field.name}, den är överbelagd`),
  ].slice(0, 4);

  function toggleType(type: ActivityKey) {
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

  return (
    <div className="today-layout">
      <section className="today-panel">
        <div className="today-head">
          <div className="section-head__title-row">
            <h2>Att göra</h2>
            <button aria-label="Hjälp om idag" className="help-button" type="button">?</button>
          </div>
          <div className="segmented-control">
            <button className={`segment ${statusFilter === "open" ? "is-active" : ""}`} type="button" onClick={() => setStatusFilter("open")}>Ej utförda</button>
            <button className={`segment ${statusFilter === "all" ? "is-active" : ""}`} type="button" onClick={() => setStatusFilter("all")}>Alla</button>
          </div>
        </div>

        {error ? <p className="portal-error">{error}</p> : null}

        <div className="today-toolbar">
          <div className="today-legend">
            {ACTIVITY_ORDER.map((key) => {
              const item = ACTIVITY_META[key];
              return (
                <button
                  className={`chip chip--legend ${activeTypes.has(key) ? "is-active" : ""}`}
                  key={key}
                  style={{ "--accent": item.color } as CSSProperties}
                  type="button"
                  onClick={() => toggleType(key)}
                >
                  <span className="legend-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <label className="today-field-filter">
            <span>Bädd</span>
            <select value={fieldFilter} onChange={(event) => setFieldFilter(event.target.value)}>
              <option value="alla">Alla bäddar</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>{field.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="task-list">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const activity = getTaskActivity(task);
              const meta = ACTIVITY_META[activity];
              const timing = getTiming(task, currentWeek);
              const crop = getCrop(crops, task.cropId);

              return (
                <article
                  className={`task-card ${timing.className}`}
                  key={task.id}
                  style={{ "--accent": meta.color } as CSSProperties}
                >
                  <div className="task-icon">{meta.icon}</div>
                  <div className="task-body">
                    <p className="task-title">{meta.label}: {getShortTitle(task)}</p>
                    <p className="task-meta">
                      Vecka {getTaskWeek(task) ?? "-"} · {getFieldName(fields, task.fieldId)}
                      {task.status === "done" ? ` · Klar ${formatDate(task.completedAt)}` : ""}
                    </p>
                    {task.description ? <p className="task-description">{task.description}</p> : null}
                    <span className={`task-timing-pill task-timing-pill--${timing.className.replace("is-", "")}`}>{timing.label}</span>
                  </div>
                  <TaskAction
                    activity={activity}
                    completeSowingTask={completeSowingTask}
                    completeTask={completeTask}
                    completeTransplantTask={completeTransplantTask}
                    crop={crop}
                    registerHarvestForTask={registerHarvestForTask}
                    stockBatches={stockBatches}
                    task={task}
                  />
                </article>
              );
            })
          ) : (
            <article className="task-card task-card--empty">
              <div className="task-icon">{ACTIVITY_META.forsadd.icon}</div>
              <div className="task-body">
                <p className="task-title">Inga uppgifter i valt filter</p>
                <p className="task-meta">Välj fler bäddar eller visa alla uppgifter.</p>
              </div>
            </article>
          )}
        </div>
      </section>

      <aside className="today-panel today-panel--aside">
        <h2>Snabböversikt</h2>
        <div className="stats-grid">
          <article className="stats-card stats-card--progress">
            <div className="progress-ring" style={{ "--progress": `${progress}%` } as CSSProperties}>
              <strong>{progress}%</strong>
              <span>klart</span>
            </div>
            <div>
              <strong>{doneRelevantTasks.length} / {relevantTasks.length}</strong>
              <span>Veckans och försenade uppgifter slutförda</span>
            </div>
          </article>
          <article className="stats-card stats-card--warning">
            <strong>{overdueTasks.length}</strong>
            <span>Försenade uppgifter</span>
          </article>
          <article className="stats-card">
            <strong>{currentWeekTasks.length}</strong>
            <span>Uppgifter denna vecka</span>
          </article>
          <article className="stats-card">
            <strong>Veckans fokus</strong>
            <div>
              {(focusItems.length ? focusItems : ["Allt ser lugnt ut just nu."]).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
          <article className="stats-card">
            <strong>{overfilledBeds.length ? "Överbelagda bäddar" : "Bäddläge"}</strong>
            <div>
              {overfilledBeds.length ? (
                overfilledBeds.slice(0, 3).map(({ field, percent }) => (
                  <span key={field.id}>{field.name} · {percent}%</span>
                ))
              ) : (
                <span>Ingen bädd är överbelagd vecka {currentWeek}</span>
              )}
            </div>
          </article>
        </div>
      </aside>
    </div>
  );
}

function TaskAction({
  activity,
  completeSowingTask,
  completeTask,
  completeTransplantTask,
  crop,
  registerHarvestForTask,
  stockBatches,
  task,
}: {
  activity: ActivityKey;
  completeSowingTask: (formData: FormData) => void | Promise<void>;
  completeTask: (formData: FormData) => void | Promise<void>;
  completeTransplantTask: (formData: FormData) => void | Promise<void>;
  crop: CropRow | null;
  registerHarvestForTask: (formData: FormData) => void | Promise<void>;
  stockBatches: SeedStockBatchRow[];
  task: TaskRow;
}) {
  const cropField = getCropField(crop, task);

  if (task.status === "done") {
    return <span className="task-done-mark">✓</span>;
  }

  if (activity === "skord") {
    return (
      <form action={registerHarvestForTask} className="task-action-form">
        <input name="taskId" type="hidden" value={task.id} />
        <input inputMode="decimal" name="kg" placeholder="kg" required />
        <button className="portal-button-danger">Skörd</button>
        <label><input name="moreToHarvest" type="checkbox" /> Mer kvar</label>
      </form>
    );
  }

  if (activity === "forsadd" || activity === "direktsadd") {
    const matchingBatches = stockBatches.filter((batch) => {
      if (!crop) return true;
      if (crop.personalSeedId && batch.personalSeedId === crop.personalSeedId) return true;
      return crop.title.toLocaleLowerCase("sv").includes(batch.crop.toLocaleLowerCase("sv"));
    });

    return (
      <form action={completeSowingTask} className="task-action-form">
        <input name="taskId" type="hidden" value={task.id} />
        <select defaultValue={cropField?.seedStockBatchId ?? ""} name="stockBatchId" required>
          <option value="">Välj lagerpost</option>
          {matchingBatches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {[batch.crop, batch.variety].filter(Boolean).join(" - ")} ({batch.quantity} st)
            </option>
          ))}
        </select>
        <input defaultValue={cropField?.plannedSeedCount ?? ""} inputMode="numeric" name="seedCount" placeholder="antal" required />
        <button className="portal-button-primary">Sått</button>
      </form>
    );
  }

  if (activity === "utplantering") {
    return (
      <form action={completeTransplantTask} className="task-action-form task-action-form--wide">
        <input name="taskId" type="hidden" value={task.id} />
        <input defaultValue={cropField?.plannedSeedCount ?? ""} inputMode="numeric" name="plantCount" placeholder="plantor" />
        <input defaultValue={cropField?.plannedRows ?? ""} inputMode="numeric" name="rowCount" placeholder="rader" />
        <input defaultValue={cropField?.plannedAreaM2 ?? crop?.areaM2 ?? ""} inputMode="decimal" name="areaM2" placeholder="m²" />
        <button className="portal-button-primary">Planterat</button>
      </form>
    );
  }

  return (
    <form action={completeTask}>
      <input name="taskId" type="hidden" value={task.id} />
      <button className="portal-button-primary">Klar</button>
    </form>
  );
}
