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

const ACTIVITY_ORDER: ActivityKey[] = ["forsadd", "direktsadd", "utplantering", "skord"];

const ACTIVITY_META: Record<
  ActivityKey,
  {
    color: string;
    iconBg: string;
    label: string;
  }
> = {
  forsadd: { color: "#7d97c9", iconBg: "#eef2fb", label: "Försådd" },
  direktsadd: { color: "#dbb063", iconBg: "#fcf2df", label: "Direktsådd" },
  utplantering: { color: "#7ca98f", iconBg: "#edf5ef", label: "Utplantering" },
  skord: { color: "#de8d7d", iconBg: "#fdeee9", label: "Skörd" },
};

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
    return { className: "done", label: "Utförd" };
  }

  const week = getTaskWeek(task);
  if (week && week < currentWeek) {
    return { className: "late", label: "Försenad" };
  }

  if (week === currentWeek) {
    return { className: "current", label: "Denna vecka" };
  }

  return { className: "upcoming", label: week ? `Kommer vecka ${week}` : "Planerad" };
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

function formatDecimalInput(value: number | null | undefined) {
  return value == null ? "" : value.toLocaleString("sv-SE", { maximumFractionDigits: 2 });
}

function getOccupancyRange(crop: CropRow) {
  const start =
    crop.schedule.directStart ??
    crop.schedule.transplantStart ??
    crop.schedule.directEnd ??
    crop.schedule.transplantEnd;
  const end = crop.schedule.harvestEnd ?? crop.schedule.harvestStart;
  return start && end ? { end, start } : null;
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

function ActivityIcon({ activity }: { activity: ActivityKey }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  const paths: Record<ActivityKey, React.ReactNode> = {
    forsadd: (
      <>
        <path d="M12 19c-2.4-2.6-3.5-5-3-7.6 2.6.5 4.8 2.2 5.9 4.7" />
        <path d="M12 19c0-5.6 2.6-9.8 7-12" />
        <path d="M7 21h10" />
      </>
    ),
    direktsadd: (
      <>
        <path d="M12 4v12" />
        <path d="m8.5 12.5 3.5 3.5 3.5-3.5" />
        <path d="M5 20h14" />
      </>
    ),
    utplantering: (
      <>
        <path d="M12 3v18" />
        <path d="M12 8c1.5-2 3.6-3.1 6-3-1.2 2.8-3.4 4.4-6 5" />
        <path d="M12 11c-1.4-2.1-3.4-3.5-6-4 1 3 3.2 4.8 6 5.8" />
      </>
    ),
    skord: (
      <>
        <path d="M8 11h8" />
        <path d="M10 6h4" />
        <path d="M7 11a5 5 0 1 0 10 0" />
        <path d="M12 6V4" />
      </>
    ),
  };

  return <svg aria-hidden="true" {...common}>{paths[activity]}</svg>;
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
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

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
  const progress = relevantTasks.length
    ? Math.round((doneRelevantTasks.length / relevantTasks.length) * 100)
    : 100;
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
            <h2>Det här är närmast i odlingen</h2>
            <div className="today-help-anchor">
              <button
                aria-label="Hjälp om idag"
                className={`help-button ${showHelp ? "is-open" : ""}`}
                type="button"
                onClick={() => setShowHelp((current) => !current)}
              >
                ?
              </button>

              {showHelp ? (
                <div className="today-help-popup">
                  <div className="today-help-popup-grid">
                    <article className="today-help-popup-item">
                      <strong>Närmast i odlingen</strong>
                      <p>Visar uppgifter som är aktuella nu eller inom de närmaste veckorna.</p>
                    </article>
                    <article className="today-help-popup-item">
                      <strong>Filtrera snabbt</strong>
                      <p>Välj aktivitet och bädd för att fokusera på precis det som ska göras.</p>
                    </article>
                    <article className="today-help-popup-item">
                      <strong>Öppna ett kort</strong>
                      <p>Klicka i rutan till höger för att så, plantera ut, skörda eller markera klart direkt.</p>
                    </article>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="today-head__actions">
            <div className="segmented-control">
              <button
                className={`segment ${statusFilter === "open" ? "is-active" : ""}`}
                type="button"
                onClick={() => setStatusFilter("open")}
              >
                Ej utförda
              </button>
              <button
                className={`segment ${statusFilter === "all" ? "is-active" : ""}`}
                type="button"
                onClick={() => setStatusFilter("all")}
              >
                Alla
              </button>
            </div>
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
                  style={{ "--accent": item.color, "--icon-bg": item.iconBg } as CSSProperties}
                  type="button"
                  onClick={() => toggleType(key)}
                >
                  <span className="legend-icon">
                    <ActivityIcon activity={key} />
                  </span>
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

        <div className="task-list" id="task-list">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const activity = getTaskActivity(task);
              const meta = ACTIVITY_META[activity];
              const timing = getTiming(task, currentWeek);
              const isExpanded = expandedTaskId === task.id;

              return (
                <article
                  className={`task-card task-card--${timing.className}`}
                  key={task.id}
                  style={{ "--accent": meta.color, "--icon-bg": meta.iconBg } as CSSProperties}
                >
                  <div className="task-card__main">
                    <div className="task-icon">
                      <ActivityIcon activity={activity} />
                    </div>
                    <div className="task-body">
                      <p className="task-title">{meta.label}: {getShortTitle(task)}</p>
                      <p className="task-meta">
                        Vecka {getTaskWeek(task) ?? "-"} · {getFieldName(fields, task.fieldId)}
                        {task.status === "done" ? ` · Klar ${formatDate(task.completedAt)}` : ""}
                      </p>
                      <span className={`task-timing-pill task-timing-pill--${timing.className}`}>{timing.label}</span>
                    </div>
                  </div>

                  {task.status === "done" ? (
                    <span className="task-checkbox task-checkbox--done" aria-hidden="true">✓</span>
                  ) : (
                    <button
                      aria-label={isExpanded ? "Stäng uppgift" : "Öppna uppgift"}
                      className={`task-checkbox ${isExpanded ? "is-active" : ""}`}
                      type="button"
                      onClick={() => setExpandedTaskId((current) => (current === task.id ? null : task.id))}
                    />
                  )}

                  {task.status !== "done" && isExpanded ? (
                    <div className="task-card__drawer">
                      <TaskAction
                        activity={activity}
                        completeSowingTask={completeSowingTask}
                        completeTask={completeTask}
                        completeTransplantTask={completeTransplantTask}
                        crop={getCrop(crops, task.cropId)}
                        registerHarvestForTask={registerHarvestForTask}
                        stockBatches={stockBatches}
                        task={task}
                      />
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <article className="task-card task-card--empty">
              <div className="task-icon">
                <ActivityIcon activity="forsadd" />
              </div>
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
        <div className="stats-grid" id="stats-grid">
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
            <div className="stats-pill-list">
              {(focusItems.length ? focusItems : ["Allt ser lugnt ut just nu."]).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>

          <article className="stats-card">
            <strong>{overfilledBeds.length ? "Överbelagda bäddar" : "Bäddläge"}</strong>
            <div className="stats-pill-list">
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

  if (activity === "skord") {
    return (
      <form action={registerHarvestForTask} className="task-action-form task-action-form--compact">
        <input name="taskId" type="hidden" value={task.id} />
        <input inputMode="decimal" name="kg" placeholder="kg" required />
        <button className="portal-button-primary">Registrera skörd</button>
        <label><input name="moreToHarvest" type="checkbox" /> Mer kvar att skörda</label>
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
      <form action={completeSowingTask} className="task-action-form task-action-form--compact">
        <input name="taskId" type="hidden" value={task.id} />
        <select defaultValue={cropField?.seedStockBatchId ?? ""} name="stockBatchId" required>
          <option value="">Välj lagerpost</option>
          {matchingBatches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {[batch.crop, batch.variety].filter(Boolean).join(" - ")} ({batch.quantity} st)
            </option>
          ))}
        </select>
        <div className="task-action-form__row">
          <input
            defaultValue={cropField?.plannedSeedCount ?? ""}
            inputMode="numeric"
            name="seedCount"
            placeholder="antal frön"
            required
          />
          <button className="portal-button-primary">Markera som sådd</button>
        </div>
      </form>
    );
  }

  if (activity === "utplantering") {
    return (
      <form action={completeTransplantTask} className="task-action-form task-action-form--compact">
        <input name="taskId" type="hidden" value={task.id} />
        <div className="task-action-form__row task-action-form__row--triple">
          <input
            defaultValue={cropField?.plannedSeedCount ?? ""}
            inputMode="numeric"
            name="plantCount"
            placeholder="plantor"
          />
          <input
            defaultValue={cropField?.plannedRows ?? ""}
            inputMode="numeric"
            name="rowCount"
            placeholder="rader"
          />
          <input
            defaultValue={formatDecimalInput(cropField?.plannedAreaM2 ?? crop?.areaM2)}
            inputMode="decimal"
            name="areaM2"
            placeholder="m²"
          />
        </div>
        <button className="portal-button-primary">Markera som planterad</button>
      </form>
    );
  }

  return (
    <form action={completeTask} className="task-action-form task-action-form--compact">
      <input name="taskId" type="hidden" value={task.id} />
      <button className="portal-button-primary">Markera som klar</button>
    </form>
  );
}
