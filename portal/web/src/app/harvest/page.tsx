import Link from "next/link";
import { ModulePage } from "@/app/components/module-page";
import { createHarvestEntry } from "@/app/harvest/actions";
import { HarvestWorkspace } from "@/app/harvest/harvest-workspace";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { getCrops } from "@/lib/data/crops";
import { getFields } from "@/lib/data/fields";
import { getHarvestEntries } from "@/lib/data/harvest";

type HarvestPageProps = {
  searchParams: Promise<{
    error?: string;
    year?: string;
  }>;
};

function getSelectedYear(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : new Date().getFullYear();
}

export default async function HarvestPage({ searchParams }: HarvestPageProps) {
  const [{ error, year }, authState] = await Promise.all([
    searchParams,
    getCurrentAuthState(),
  ]);
  const activeWorkspace = authState.workspaces[0] ?? null;
  const selectedYear = getSelectedYear(year);
  const [crops, fields, harvestEntries] = activeWorkspace
    ? await Promise.all([
        getCrops(activeWorkspace.id),
        getFields(activeWorkspace.id),
        getHarvestEntries(activeWorkspace.id),
      ])
    : [[], [], []];

  return (
    <ModulePage href="/harvest">
      {!authState.user ? (
        <section className="portal-card portal-empty-state">
          <p>Skörd är privat och kopplad till ditt workspace.</p>
          <Link className="portal-button portal-button--primary" href="/login">
            Logga in
          </Link>
        </section>
      ) : null}

      {authState.user && !activeWorkspace ? (
        <section className="portal-card portal-empty-state">
          <p>Kontot saknar workspace. Skapa första odlingen innan du registrerar skörd.</p>
          <Link className="portal-button portal-button--primary" href="/onboarding">
            Skapa workspace
          </Link>
        </section>
      ) : null}

      {activeWorkspace ? (
        <HarvestWorkspace
          action={createHarvestEntry}
          crops={crops}
          error={error}
          fields={fields}
          harvestEntries={harvestEntries}
          selectedYear={selectedYear}
        />
      ) : null}
    </ModulePage>
  );
}
