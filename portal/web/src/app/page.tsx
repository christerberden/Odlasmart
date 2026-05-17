import Link from "next/link";
import { PortalShell } from "@/app/components/portal-shell";
import { signOut } from "@/app/auth/actions";
import { portalModules } from "@/app/lib/portal-data";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { getCrops } from "@/lib/data/crops";
import { getFields } from "@/lib/data/fields";
import { getHarvestEntries, summarizeHarvest } from "@/lib/data/harvest";
import { getSeedStockBatches } from "@/lib/data/inventory";
import { getDatabaseStatus } from "@/lib/data/portal";
import { getPersonalSeeds } from "@/lib/data/seeds";
import { getTasks } from "@/lib/data/tasks";

const statusStyles = {
  ready: "border-[var(--primary)] bg-[#edf6ef]",
  empty: "border-[var(--secondary)] bg-[#eef4f8]",
  "auth-required": "border-[var(--warning)] bg-[#fff4ec]",
  error: "border-[var(--harvest)] bg-[#fff0ef]",
};

function formatDate(date: string | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatKg(value: number) {
  return value.toLocaleString("sv-SE", {
    maximumFractionDigits: 1,
  });
}

function isTodayOrEarlier(date: string | null) {
  if (!date) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);

  return target.getTime() <= today.getTime();
}

export default async function Home() {
  const [databaseStatus, authState] = await Promise.all([
    getDatabaseStatus(),
    getCurrentAuthState(),
  ]);
  const activeWorkspace = authState.workspaces[0] ?? null;
  const [personalSeeds, stockBatches, fields, crops, tasks, harvestEntries] =
    activeWorkspace
      ? await Promise.all([
          getPersonalSeeds(activeWorkspace.id),
          getSeedStockBatches(activeWorkspace.id),
          getFields(activeWorkspace.id),
          getCrops(activeWorkspace.id),
          getTasks(activeWorkspace.id),
          getHarvestEntries(activeWorkspace.id),
        ])
      : [[], [], [], [], [], []];
  const openTasks = tasks.filter((task) => task.status === "open");
  const dueTasks = openTasks.filter((task) => isTodayOrEarlier(task.dueDate));
  const upcomingTasks = openTasks.filter((task) => !isTodayOrEarlier(task.dueDate)).slice(0, 5);
  const harvestSummary = summarizeHarvest(harvestEntries);
  const totalKg = harvestEntries.reduce((sum, entry) => sum + entry.kg, 0);
  const lowStockBatches = stockBatches
    .filter((batch) => batch.quantity <= 10)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);
  const liveStats = activeWorkspace ? [
    {
      label: "Att göra",
      value: String(openTasks.length),
      detail: `${dueTasks.length} aktuella eller försenade`,
    },
    {
      label: "Grödor",
      value: String(crops.length),
      detail: `${fields.length} odlingsytor`,
    },
    {
      label: "Fröer",
      value: String(personalSeeds.length),
      detail: `${stockBatches.length} lagerposter`,
    },
    {
      label: "Skörd",
      value: `${formatKg(totalKg)} kg`,
      detail: `${harvestEntries.length} registreringar`,
    },
  ] : [
    {
      label: "Portal",
      value: "V1",
      detail: "Grundflöden byggs upp",
    },
    {
      label: "Moduler",
      value: "6",
      detail: "Fröer till skörd",
    },
    {
      label: "Datakälla",
      value: "Supabase",
      detail: "Workspace-separerad data",
    },
    {
      label: "Supabase",
      value:
        databaseStatus.seedTemplateCount === null
          ? "OK"
          : String(databaseStatus.seedTemplateCount),
      detail: databaseStatus.label,
    },
  ];

  return (
    <PortalShell
      activeHref="/"
      title={activeWorkspace ? `Översikt för ${activeWorkspace.name}` : "Portalgrund för odlingen"}
      description="En levande översikt över uppgifter, grödor, fröer, odlingsytor och skörd."
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {liveStats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <p className="text-sm font-medium text-[var(--ink-muted)]">{stat.label}</p>
              <strong className="mt-3 block text-3xl font-semibold">{stat.value}</strong>
              <span className="mt-2 block text-sm text-[var(--ink-muted)]">{stat.detail}</span>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 xl:row-span-2">
          <div className="mb-5 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Konto
            </p>
            {authState.user ? (
              <>
                <h2 className="mt-2 text-lg font-semibold">{authState.user.email}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                  {authState.workspaces.length > 0
                    ? `${authState.workspaces.length} workspace kopplad till kontot.`
                    : "Kontot är inloggat men saknar workspace."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {authState.workspaces.length === 0 ? (
                    <Link
                      className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white"
                      href="/onboarding"
                    >
                      Skapa workspace
                    </Link>
                  ) : null}
                  <form action={signOut}>
                    <button className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium">
                      Logga ut
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-lg font-semibold">Inte inloggad</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                  Logga in eller skapa konto för att få egna odlingar och separat data.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white"
                    href="/login"
                  >
                    Logga in
                  </Link>
                  <Link
                    className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium"
                    href="/signup"
                  >
                    Skapa konto
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className={`rounded-lg border p-4 ${statusStyles[databaseStatus.state]}`}>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Databas
            </p>
            <h2 className="mt-2 text-lg font-semibold">{databaseStatus.label}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
              {databaseStatus.detail}
            </p>
          </div>

          <h2 className="mt-6 text-lg font-semibold">Snabbstart</h2>
          <div className="mt-5 grid gap-3">
            {activeWorkspace ? (
              <>
                <Link className="rounded-md bg-[var(--surface-muted)] p-4 text-sm leading-6 transition hover:bg-[var(--border)]" href="/tasks">
                  Se dagens arbetslista
                </Link>
                <Link className="rounded-md bg-[var(--surface-muted)] p-4 text-sm leading-6 transition hover:bg-[var(--border)]" href="/crops">
                  Lägg till nästa gröda
                </Link>
                <Link className="rounded-md bg-[var(--surface-muted)] p-4 text-sm leading-6 transition hover:bg-[var(--border)]" href="/harvest">
                  Registrera skörd
                </Link>
              </>
            ) : (
              <>
                <Link className="rounded-md bg-[var(--surface-muted)] p-4 text-sm leading-6 transition hover:bg-[var(--border)]" href="/signup">
                  Skapa konto
                </Link>
                <Link className="rounded-md bg-[var(--surface-muted)] p-4 text-sm leading-6 transition hover:bg-[var(--border)]" href="/login">
                  Logga in
                </Link>
              </>
            )}
          </div>
        </section>

        {activeWorkspace ? (
          <section className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                    Arbete
                  </span>
                  <h2 className="mt-2 text-xl font-semibold">Prioriterade uppgifter</h2>
                </div>
                <Link className="rounded-md bg-[var(--surface-muted)] px-3 py-2 text-sm" href="/tasks">
                  Visa alla
                </Link>
              </div>
              <div className="mt-5 grid gap-3">
                {[...dueTasks, ...upcomingTasks].slice(0, 6).map((task) => (
                  <Link
                    className="rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-3 transition hover:border-[var(--primary)]"
                    href="/tasks"
                    key={task.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">
                          {task.description || "Skapad från grödans schema"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-[var(--surface-muted)] px-2 py-1 text-xs">
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </Link>
                ))}
                {openTasks.length === 0 ? (
                  <p className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-5 text-sm text-[var(--ink-muted)]">
                    Inga öppna uppgifter just nu. Lite suspicious lugnt, men på ett bra sätt.
                  </p>
                ) : null}
              </div>
            </article>

            <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--harvest)]">
                Skörd
              </span>
              <h2 className="mt-2 text-xl font-semibold">Skördetoppen</h2>
              <div className="mt-5 grid gap-3">
                {harvestSummary.slice(0, 5).map((row) => (
                  <div
                    className="rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-3"
                    key={row.title}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium">{row.title}</span>
                      <strong>{formatKg(row.kg)} kg</strong>
                    </div>
                  </div>
                ))}
                {harvestSummary.length === 0 ? (
                  <p className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-5 text-sm text-[var(--ink-muted)]">
                    Ingen skörd registrerad ännu.
                  </p>
                ) : null}
              </div>
            </article>

            <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--secondary)]">
                Frolager
              </span>
              <h2 className="mt-2 text-xl font-semibold">Lager att bevaka</h2>
              <div className="mt-5 grid gap-3">
                {lowStockBatches.map((batch) => (
                  <Link
                    className="rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-3 transition hover:border-[var(--primary)]"
                    href="/inventory"
                    key={batch.id}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium">
                        {[batch.crop, batch.variety].filter(Boolean).join(" - ")}
                      </span>
                      <strong>{batch.quantity} st</strong>
                    </div>
                  </Link>
                ))}
                {lowStockBatches.length === 0 ? (
                  <p className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-5 text-sm text-[var(--ink-muted)]">
                    Inga lagerposter att bevaka just nu.
                  </p>
                ) : null}
              </div>
            </article>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {portalModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--primary)]"
            >
              <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                {module.eyebrow}
              </span>
              <h2 className="mt-3 text-xl font-semibold">{module.label}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
                {module.description}
              </p>
              <span className="mt-5 inline-flex rounded-md bg-[var(--surface-muted)] px-3 py-1 text-sm text-[var(--foreground)]">
                {module.status}
              </span>
            </Link>
          ))}
        </section>
      </div>
    </PortalShell>
  );
}
