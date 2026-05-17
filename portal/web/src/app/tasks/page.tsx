import Link from "next/link";
import { ModulePage } from "@/app/components/module-page";
import { completeSowingTask, completeTask, completeTransplantTask, registerHarvestForTask } from "@/app/tasks/actions";
import { TasksWorkspace } from "@/app/tasks/tasks-workspace";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { getCrops } from "@/lib/data/crops";
import { getFields } from "@/lib/data/fields";
import { getSeedStockBatches } from "@/lib/data/inventory";
import { getTasks } from "@/lib/data/tasks";

type TasksPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const [{ error }, authState] = await Promise.all([
    searchParams,
    getCurrentAuthState(),
  ]);
  const activeWorkspace = authState.workspaces[0] ?? null;
  const [tasks, crops, fields, stockBatches] = activeWorkspace
    ? await Promise.all([
        getTasks(activeWorkspace.id),
        getCrops(activeWorkspace.id),
        getFields(activeWorkspace.id),
        getSeedStockBatches(activeWorkspace.id),
      ])
    : [[], [], [], []];

  return (
    <ModulePage href="/tasks">
      <section className="tasks-page">
        {!authState.user ? (
          <div className="surface-card surface-card--empty">
            <p className="text-sm leading-6 text-[var(--ink-muted)]">
              Uppgifter är privata och kopplade till ditt workspace.
            </p>
            <Link className="portal-button portal-button--primary mt-4" href="/login">
              Logga in
            </Link>
          </div>
        ) : null}

        {authState.user && !activeWorkspace ? (
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
        ) : null}
      </section>
    </ModulePage>
  );
}
