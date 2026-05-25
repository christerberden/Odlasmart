import Link from "next/link";
import { ModulePage } from "@/app/components/module-page";
import { clearAllCropsAction, createCrop, deleteCropAction, purchaseShoppingSeedsAction, updateCropPlanAction, updateCropScheduleAction } from "@/app/crops/actions";
import { importInventorySeeds } from "@/app/inventory/actions";
import { CropsWorkspace } from "@/app/crops/crops-workspace";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { getCrops } from "@/lib/data/crops";
import { getFields, getSections } from "@/lib/data/fields";
import { getSeedStockBatches } from "@/lib/data/inventory";
import { getWorkspacePreferences } from "@/lib/data/preferences";
import { getPersonalSeeds, getSeedTemplateOptions } from "@/lib/data/seeds";
import { getTasks } from "@/lib/data/tasks";

type CropsPageProps = {
  searchParams: Promise<{
    error?: string;
    year?: string;
  }>;
};

function getSelectedYear(value: string | undefined) {
  const currentYear = new Date().getFullYear();
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : currentYear;
}

export default async function CropsPage({ searchParams }: CropsPageProps) {
  const [{ error, year }, authState] = await Promise.all([
    searchParams,
    getCurrentAuthState(),
  ]);
  const selectedYear = getSelectedYear(year);
  const activeWorkspace = authState.workspaces[0] ?? null;
  const [personalSeeds, seedTemplates, fields, sections, crops, stockBatches, tasks, preferences] = activeWorkspace
    ? await Promise.all([
        getPersonalSeeds(activeWorkspace.id),
        getSeedTemplateOptions(),
        getFields(activeWorkspace.id),
        getSections(activeWorkspace.id),
        getCrops(activeWorkspace.id),
        getSeedStockBatches(activeWorkspace.id),
        getTasks(activeWorkspace.id),
        getWorkspacePreferences(activeWorkspace.id),
      ])
    : [[], [], [], [], [], [], [], { activeYear: null, frostWindow: null, weatherLocation: null }];

  return (
    <ModulePage href="/crops">
      {!authState.user ? (
        <section className="portal-card portal-empty-state">
          <p>Grödor är privata och kopplade till ditt workspace.</p>
          <Link className="portal-button portal-button--primary" href="/login">
            Logga in
          </Link>
        </section>
      ) : null}

      {authState.user && !activeWorkspace ? (
        <section className="portal-card portal-empty-state">
          <p>Kontot saknar workspace. Skapa första odlingen innan du lägger till grödor.</p>
          <Link className="portal-button portal-button--primary" href="/onboarding">
            Skapa workspace
          </Link>
        </section>
      ) : null}

      {activeWorkspace ? (
        <CropsWorkspace
          action={createCrop}
          crops={crops}
          error={error}
          fields={fields}
          personalSeeds={personalSeeds}
          sections={sections}
          seedTemplates={seedTemplates}
          stockBatches={stockBatches}
          tasks={tasks}
          deleteCropAction={deleteCropAction}
          updateCropAction={updateCropPlanAction}
          updateScheduleAction={updateCropScheduleAction}
          clearAllCropsAction={clearAllCropsAction}
          importInventorySeedsAction={importInventorySeeds}
          frostWindow={preferences.frostWindow}
          purchaseShoppingSeedsAction={purchaseShoppingSeedsAction}
          selectedYear={selectedYear}
          workspaceName={activeWorkspace.name}
        />
      ) : null}
    </ModulePage>
  );
}
