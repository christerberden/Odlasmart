import Link from "next/link";
import { ModulePage } from "@/app/components/module-page";
import { resetWorkspaceDataAction } from "@/app/settings/actions";
import { SettingsWorkspace } from "@/app/settings/settings-workspace";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { getCrops } from "@/lib/data/crops";
import { getFields, getSections } from "@/lib/data/fields";
import { getWorkspacePreferences } from "@/lib/data/preferences";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    reset?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [{ error, reset }, authState] = await Promise.all([
    searchParams,
    getCurrentAuthState(),
  ]);
  const activeWorkspace = authState.workspaces[0] ?? null;
  const [sections, fields, crops, preferences] = activeWorkspace
    ? await Promise.all([
        getSections(activeWorkspace.id),
        getFields(activeWorkspace.id),
        getCrops(activeWorkspace.id),
        getWorkspacePreferences(activeWorkspace.id),
      ])
    : [[], [], [], { activeYear: null, weatherLocation: null }];

  return (
    <ModulePage href="/settings">
      {!authState.user ? (
        <section className="portal-card portal-empty-state">
          <p>Logga in för att hantera inställningar.</p>
          <Link className="portal-button portal-button--primary" href="/login">
            Logga in
          </Link>
        </section>
      ) : null}

      {authState.user && !activeWorkspace ? (
        <section className="portal-card portal-empty-state">
          <p>Kontot saknar workspace. Skapa första odlingen innan inställningar kan användas.</p>
          <Link className="portal-button portal-button--primary" href="/onboarding">
            Skapa workspace
          </Link>
        </section>
      ) : null}

      {activeWorkspace ? (
        <SettingsWorkspace
          crops={crops}
          error={error}
          fields={fields}
          initialWeatherLocation={preferences.weatherLocation}
          resetDone={reset === "done"}
          resetWorkspaceDataAction={resetWorkspaceDataAction}
          sections={sections}
        />
      ) : null}
    </ModulePage>
  );
}
