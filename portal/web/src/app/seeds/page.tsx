import Link from "next/link";
import { ModulePage } from "@/app/components/module-page";
import { addSeedTemplateToPersonalSeeds, createPersonalSeed } from "@/app/seeds/actions";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { getPersonalSeeds } from "@/lib/data/seeds";
import { getDatabaseStatus, getSeedTemplatePreview } from "@/lib/data/portal";

type SeedsPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SeedsPage({ searchParams }: SeedsPageProps) {
  const [{ error }, databaseStatus, seedTemplates, authState] = await Promise.all([
    searchParams,
    getDatabaseStatus(),
    getSeedTemplatePreview(),
    getCurrentAuthState(),
  ]);
  const activeWorkspace = authState.workspaces[0] ?? null;
  const personalSeeds = activeWorkspace
    ? await getPersonalSeeds(activeWorkspace.id)
    : [];

  return (
    <ModulePage
      href="/seeds"
      focus={[
        "Visa systemkatalog och egna fröposter i separata vyer.",
        "Skapa och redigera egna sorter med odlingsdata från gamla appen.",
        "Behålla koppling till global frömall utan att blanda ihop mall och lager.",
      ]}
      firstBuild={[
        "Definiera tabellerna seed_templates och personal_seeds.",
        "Importera seed_catalog_full.js till systemkatalogen.",
        "Bygg listvy, sök och formulär för egna fröer.",
      ]}
    >
      <section className="mt-5 grid gap-5 2xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Mina fröer</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">
                {activeWorkspace
                  ? `${activeWorkspace.name} har ${personalSeeds.length} egna fröposter.`
                  : "Logga in och skapa workspace för att lägga till egna fröer."}
              </p>
            </div>
            {activeWorkspace ? (
              <span className="rounded-md bg-[var(--surface-muted)] px-3 py-1 text-sm text-[var(--foreground)]">
                {personalSeeds.length} egna
              </span>
            ) : null}
          </div>

          {!authState.user ? (
            <div className="mt-5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-5">
              <p className="text-sm leading-6 text-[var(--ink-muted)]">
                Dina egna fröer är privata och kopplas till ditt workspace.
              </p>
              <Link
                className="mt-4 inline-flex rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white"
                href="/login"
              >
                Logga in
              </Link>
            </div>
          ) : null}

          {authState.user && !activeWorkspace ? (
            <div className="mt-5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-5">
              <p className="text-sm leading-6 text-[var(--ink-muted)]">
                Kontot saknar workspace. Skapa första odlingen innan du lägger till egna fröer.
              </p>
              <Link
                className="mt-4 inline-flex rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white"
                href="/onboarding"
              >
                Skapa workspace
              </Link>
            </div>
          ) : null}

          {activeWorkspace ? (
            <>
              {error ? (
                <p className="mt-5 rounded-md border border-[var(--harvest)] bg-[#fff0ef] px-4 py-3 text-sm">
                  {error}
                </p>
              ) : null}

              <form action={createPersonalSeed} className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Gröda
                    <input
                      className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]"
                      name="crop"
                      placeholder="Tomat"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Sort
                    <input
                      className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]"
                      name="variety"
                      placeholder="Moneymaker"
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2 text-sm font-medium">
                    Familj
                    <input
                      className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]"
                      name="family"
                      placeholder="Potatisväxter"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Metod
                    <input
                      className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]"
                      name="method"
                      placeholder="Försådd"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Utgångsår
                    <input
                      className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]"
                      name="expirationYear"
                      inputMode="numeric"
                      placeholder="2028"
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-medium">
                  Anteckningar
                  <textarea
                    className="min-h-24 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]"
                    name="notes"
                    placeholder="Källa, odlingserfarenheter eller särskilda råd"
                  />
                </label>
                <button className="rounded-md bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]">
                  Lägg till frö
                </button>
              </form>

              <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border)]">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-[var(--surface-muted)] text-[var(--ink-muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Gröda</th>
                      <th className="px-4 py-3 font-medium">Sort</th>
                      <th className="px-4 py-3 font-medium">Familj</th>
                      <th className="px-4 py-3 font-medium">Metod</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personalSeeds.length > 0 ? (
                      personalSeeds.map((seed) => (
                        <tr key={seed.id} className="border-t border-[var(--border)]">
                          <td className="px-4 py-3 font-medium">{seed.crop}</td>
                          <td className="px-4 py-3 text-[var(--ink-muted)]">
                            {seed.variety || "-"}
                          </td>
                          <td className="px-4 py-3 text-[var(--ink-muted)]">
                            {seed.family || "-"}
                          </td>
                          <td className="px-4 py-3 text-[var(--ink-muted)]">
                            {seed.method || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-5 text-[var(--ink-muted)]" colSpan={4}>
                          Inga egna fröer ännu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Systemkatalog</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">
                {databaseStatus.detail}
              </p>
            </div>
            <span className="rounded-md bg-[var(--surface-muted)] px-3 py-1 text-sm text-[var(--foreground)]">
              {databaseStatus.seedTemplateCount ?? 0} poster
            </span>
          </div>

          {seedTemplates.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-lg border border-[var(--border)]">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[var(--surface-muted)] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Gröda</th>
                    <th className="px-4 py-3 font-medium">Sort</th>
                    <th className="px-4 py-3 font-medium">Familj</th>
                    <th className="px-4 py-3 font-medium">Metod</th>
                    {activeWorkspace ? (
                      <th className="px-4 py-3 font-medium">Mina fröer</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {seedTemplates.map((seed) => (
                    <tr key={seed.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 font-medium">{seed.crop}</td>
                      <td className="px-4 py-3 text-[var(--ink-muted)]">
                        {seed.variety || "-"}
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-muted)]">
                        {seed.family || "-"}
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-muted)]">
                        {seed.method || "-"}
                      </td>
                      {activeWorkspace ? (
                        <td className="px-4 py-3">
                          <form action={addSeedTemplateToPersonalSeeds}>
                            <input name="templateId" type="hidden" value={seed.id} />
                            <button className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white">
                              Lägg till
                            </button>
                          </form>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-5">
              <p className="text-sm leading-6 text-[var(--ink-muted)]">
                Systemkatalogen är redo att fyllas. Nästa steg blir att importera gamla
                frödatabasen till `seed_templates`.
              </p>
            </div>
          )}
        </div>
      </section>
    </ModulePage>
  );
}
