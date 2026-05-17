import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/auth/actions";
import { PortalYearSelect } from "@/app/components/portal-year-select";
import { portalModules, type PortalIcon, type PortalModule } from "@/app/lib/portal-data";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { getCrops, type CropRow } from "@/lib/data/crops";
import { getHarvestEntries, type HarvestEntryRow } from "@/lib/data/harvest";
import { getWorkspacePreferences } from "@/lib/data/preferences";
import { getTasks, type TaskRow } from "@/lib/data/tasks";
import { PortalWeatherWidget } from "@/app/components/portal-weather-widget";

type PortalShellProps = {
  activeHref?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
};

const navGroups = ["Arbeta", "Planera"] as const;
const hiddenNavHrefs = new Set(["/seeds"]);
const currentYear = new Date().getFullYear();
const headerYears = Array.from({ length: 8 }, (_, index) => currentYear - 5 + index);

function Icon({ name }: { name: PortalIcon }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  const paths: Record<PortalIcon, React.ReactNode> = {
    today: (
      <>
        <path d="M7 3v3M17 3v3M4 9h16" />
        <path d="M5 5h14v15H5z" />
        <path d="m9 14 2 2 4-5" />
      </>
    ),
    harvest: (
      <>
        <path d="M12 20V9" />
        <path d="M8 13c-3 0-5-2-5-5 3 0 5 2 5 5Z" />
        <path d="M16 11c3 0 5-2 5-5-3 0-5 2-5 5Z" />
        <path d="M7 21h10" />
      </>
    ),
    planner: (
      <>
        <path d="M4 5h16v14H4z" />
        <path d="M4 10h16M9 5v14M14 5v14" />
      </>
    ),
    beds: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
        <path d="M7 5v14M17 5v14" />
      </>
    ),
    seeds: (
      <>
        <path d="M12 20c-3-3-4-6-3-9 3 1 5 4 3 9Z" />
        <path d="M13 12c.5-4 3-7 7-8 .5 5-2 8-7 8Z" />
        <path d="M12 20c1-5 4-9 8-12" />
      </>
    ),
    inventory: (
      <>
        <path d="M5 8h14l-1 12H6z" />
        <path d="M8 8a4 4 0 0 1 8 0" />
        <path d="M9 13h6" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.4-2.7a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.2-.8.2-1.2Z" />
      </>
    ),
  };

  return <svg aria-hidden="true" {...common}>{paths[name]}</svg>;
}

function NavItem({
  activeHref,
  module,
}: {
  activeHref: string;
  module: PortalModule;
}) {
  const isActive = activeHref === module.href;

  return (
    <Link
      className={`nav-item ${isActive ? "is-active" : ""}`}
      href={module.href}
    >
      <span className="nav-item__icon">
        <Icon name={module.icon} />
      </span>
      <span className="nav-item__label">{module.label}</span>
    </Link>
  );
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

async function getHeaderStats() {
  const authState = await getCurrentAuthState();
  const activeWorkspace = authState.workspaces[0] ?? null;

  if (!activeWorkspace) {
    return { harvested: 0, planted: 0, presown: 0 };
  }

  const [crops, tasks, harvestEntries] = await Promise.all([
    getCrops(activeWorkspace.id),
    getTasks(activeWorkspace.id),
    getHarvestEntries(activeWorkspace.id),
  ]);

  return countHeaderStats(crops, tasks, harvestEntries, currentYear);
}

export async function PortalShell({
  activeHref = "/",
  title,
  children,
}: PortalShellProps) {
  const authState = await getCurrentAuthState();
  const activeWorkspace = authState.workspaces[0] ?? null;
  const footerModule = portalModules.find((module) => module.group === "Portal");
  const navModules = portalModules.filter((module) => !hiddenNavHrefs.has(module.href));
  const [headerStats, workspacePreferences] = await Promise.all([
    getHeaderStats(),
    activeWorkspace
      ? getWorkspacePreferences(activeWorkspace.id)
      : Promise.resolve({ activeYear: null, weatherLocation: null }),
  ]);

  return (
    <main className="min-h-screen">
      <div className="app-shell">
        <aside className="sidebar">
          <Link href="/" className="brand-block">
            <span className="brand-mark" aria-hidden="true">
              <Image alt="" height={86} priority src="/bjorkbacka-mark.svg" width={86} />
            </span>
            <span className="brand-name">Lilla björkbacka</span>
            <strong>Odlingskalender</strong>
          </Link>

          <div className="sidebar-nav-stack">
            <nav className="nav-list" aria-label="Huvudnavigation">
              {navGroups.map((group) => (
                <div className="nav-group" key={group}>
                  <p className="nav-group-label">{group}</p>
                  {navModules
                    .filter((module) => module.group === group)
                    .map((module) => (
                      <NavItem activeHref={activeHref} key={module.href} module={module} />
                    ))}
                </div>
              ))}
            </nav>

            {footerModule ? (
              <div className="sidebar-nav-footer">
                <NavItem activeHref={activeHref} module={footerModule} />
              </div>
            ) : null}
          </div>

          <section className="sidebar-panel sidebar-panel--weather">
            <p className="panel-label">Väder</p>
            <PortalWeatherWidget initialWeatherLocation={workspacePreferences.weatherLocation} />
          </section>

          <form action={signOut} className="sidebar-logout">
            <button type="submit">Logga ut</button>
          </form>
        </aside>

        <section className="content">
          {title ? (
            <header className="topbar">
              <div className="topbar-main">
                <h1>{title}</h1>
                <div className="quick-actions" aria-label="Snabbåtgärder">
                  <section className="quick-actions-card">
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
                  <div className="quick-stat">
                    <span>Grödor i försådd</span>
                    <strong>{headerStats.presown}</strong>
                  </div>
                  <div className="quick-stat">
                    <span>Planterade grödor</span>
                    <strong>{headerStats.planted}</strong>
                  </div>
                  <div className="quick-stat">
                    <span>Skördade grödor</span>
                    <strong>{headerStats.harvested}</strong>
                  </div>
                  <PortalYearSelect currentYear={currentYear} years={headerYears} />
                </div>
              </div>
            </header>
          ) : null}

          {children}
        </section>
      </div>
    </main>
  );
}
