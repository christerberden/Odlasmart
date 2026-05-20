import Link from "next/link";
import { ModulePage } from "@/app/components/module-page";
import { PortalYearSelect } from "@/app/components/portal-year-select";
import { completeSowingTask, completeTask, completeTransplantTask, registerHarvestForTask } from "@/app/tasks/actions";
import { TasksWorkspace } from "@/app/tasks/tasks-workspace";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { getCrops, type CropRow } from "@/lib/data/crops";
import { getFields } from "@/lib/data/fields";
import { getHarvestEntries, type HarvestEntryRow } from "@/lib/data/harvest";
import { getSeedStockBatches } from "@/lib/data/inventory";
import { getTasks, type TaskRow } from "@/lib/data/tasks";

type TasksPageProps = {
  searchParams: Promise<{
    error?: string;
    year?: string;
  }>;
};

const currentYear = new Date().getFullYear();
const headerYears = Array.from({ length: 8 }, (_, index) => currentYear - 5 + index);

function getIsoWeek(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getSelectedYear(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : currentYear;
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

function taskActivity(task: TaskRow) {
  const id = task.legacyEventId ?? "";
  const title = task.title.toLocaleLowerCase("sv").normalize("NFD").replace(/\p{Diacritic}/gu, "");

  if (id.includes("forsadd") || title.startsWith("forsa")) return "forsadd";
  if (id.includes("direktsadd") || title.startsWith("direktsa")) return "direktsadd";
  if (id.includes("utplantering") || title.startsWith("plantera ut")) return "utplantering";
  if (id.includes("skord") || title.startsWith("skorda")) return "skord";
  return null;
}

function cropIsInYear(crop: CropRow, year: number) {
  return crop.startYear <= year && crop.endYear >= year;
}

function countHeaderStats(crops: CropRow[], tasks: TaskRow[], harvestEntries: HarvestEntryRow[], year: number) {
  const cropsInYear = crops.filter((crop) => cropIsInYear(crop, year));
  const tasksByCrop = new Map<string, TaskRow[]>();

  tasks.forEach((task) => {
    if (!task.cropId) {
      return;
    }
    tasksByCrop.set(task.cropId, [...(tasksByCrop.get(task.cropId) ?? []), task]);
  });

  const presown = cropsInYear.filter((crop) => {
    const cropTasks = tasksByCrop.get(crop.id) ?? [];
    const hasPresown = cropTasks.some((task) => task.status === "done" && taskActivity(task) === "forsadd");
    const hasPlanted = cropTasks.some((task) => task.status === "done" && ["direktsadd", "utplantering"].includes(taskActivity(task) ?? ""));
    return hasPresown && !hasPlanted;
  }).length;

  const planted = cropsInYear.filter((crop) => {
    const cropTasks = tasksByCrop.get(crop.id) ?? [];
    const hasPlanted = cropTasks.some((task) => task.status === "done" && ["direktsadd", "utplantering"].includes(taskActivity(task) ?? ""));
    const hasHarvested = harvestEntries.some((entry) => entry.year === year && entry.cropId === crop.id);
    return hasPlanted && !hasHarvested;
  }).length;

  const harvestedIds = new Set(
    harvestEntries
      .filter((entry) => entry.year === year)
      .map((entry) => entry.cropId ?? entry.title.toLocaleLowerCase("sv"))
      .filter(Boolean),
  );

  return {
    harvested: harvestedIds.size,
    planted,
    presown,
  };
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const [{ error, year }, authState] = await Promise.all([
    searchParams,
    getCurrentAuthState(),
  ]);
  const activeWorkspace = authState.workspaces[0] ?? null;
  const selectedYear = getSelectedYear(year);
  const currentWeek = getIsoWeek();
  const [tasks, crops, fields, stockBatches, harvestEntries] = activeWorkspace
    ? await Promise.all([
        getTasks(activeWorkspace.id),
        getCrops(activeWorkspace.id),
        getFields(activeWorkspace.id),
        getSeedStockBatches(activeWorkspace.id),
        getHarvestEntries(activeWorkspace.id),
      ])
    : [[], [], [], [], []];
  const overdueTaskCount = tasks
    .filter((task) => task.status !== "done")
    .filter((task) => {
      const week = getTaskWeek(task);
      return week != null && week < currentWeek;
    }).length;
  const headerStats = countHeaderStats(crops, tasks, harvestEntries, selectedYear);

  return (
    <ModulePage href="/tasks" hideHeader>
      <section className="tasks-page">
        {!activeWorkspace ? (
          <div className="surface-card surface-card--empty">
            <p className="text-sm leading-6 text-[var(--ink-muted)]">
              Kontot saknar workspace. Skapa första odlingen innan uppgifter kan visas.
            </p>
            <Link className="portal-button portal-button--primary mt-4" href="/onboarding">
              Skapa workspace
            </Link>
          </div>
        ) : null}

        {activeWorkspace ? (
          <>
            <header className="today-page-header">
              <h1>Idag</h1>
              <div className="today-page-summary">
                <section className="quick-actions-card today-page-actions">
                  <span>Snabbåtgärder</span>
                  <div>
                    <Link className="quick-action-button quick-action-button--primary" href="/crops">
                      Planera nästa gröda
                    </Link>
                    <Link className="quick-action-button" href="/harvest">
                      Registrera skörd
                    </Link>
                  </div>
                </section>
                <article className="today-summary-card">
                  <span>Vecka</span>
                  <strong>{currentWeek}</strong>
                </article>
                <article className="today-summary-card">
                  <span>Försenade uppgifter</span>
                  <strong>{overdueTaskCount}</strong>
                </article>
                <article className="today-summary-card">
                  <span>Grödor i försådd</span>
                  <strong>{headerStats.presown}</strong>
                </article>
                <article className="today-summary-card">
                  <span>Planterade grödor</span>
                  <strong>{headerStats.planted}</strong>
                </article>
                <article className="today-summary-card">
                  <span>Skördade grödor</span>
                  <strong>{headerStats.harvested}</strong>
                </article>
                <PortalYearSelect currentYear={currentYear} years={headerYears} />
              </div>
            </header>

            <TasksWorkspace
              completeSowingTask={completeSowingTask}
              completeTask={completeTask}
              completeTransplantTask={completeTransplantTask}
              crops={crops}
              error={error}
              fields={fields}
              registerHarvestForTask={registerHarvestForTask}
              stockBatches={stockBatches}
              tasks={tasks}
            />
          </>
        ) : null}
      </section>
    </ModulePage>
  );
}
