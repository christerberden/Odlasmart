import Link from "next/link";
import { ModulePage } from "@/app/components/module-page";
import { createCrop, deleteCropAction, updateCropPlanAction, updateCropScheduleAction } from "@/app/crops/actions";
import { CropsWorkspace } from "@/app/crops/crops-workspace";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { getCrops } from "@/lib/data/crops";
import { getFields, getSections } from "@/lib/data/fields";
import { getSeedStockBatches } from "@/lib/data/inventory";
import { getPersonalSeeds, getSeedTemplateOptions } from "@/lib/data/seeds";
import { getTasks } from "@/lib/data/tasks";

type CropsPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CropsPage({ searchParams }: CropsPageProps) {
  const [{ error }, authState] = await Promise.all([
    searchParams,
    getCurrentAuthState(),
  ]);
  const activeWorkspace = authState.workspaces[0] ?? null;
  const [personalSeeds, seedTemplates, fields, sections, crops, stockBatches, tasks] = activeWorkspace
    ? await Promise.all([
        getPersonalSeeds(activeWorkspace.id),
        getSeedTemplateOptions(),
        getFields(activeWorkspace.id),
        getSections(activeWorkspace.id),
        getCrops(activeWorkspace.id),
        getSeedStockBatches(activeWorkspace.id),
        getTasks(activeWorkspace.id),
      ])
    : [[], [], [], [], [], [], []];

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
          workspaceName={activeWorkspace.name}
        />
      ) : null}
    </ModulePage>
  );
}
