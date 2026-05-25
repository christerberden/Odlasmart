import Link from "next/link";
import { ModulePage } from "@/app/components/module-page";
import {
  createField,
  createSection,
  deleteField,
  deleteSection,
  updateField,
  updateFieldPlacement,
  updateSection,
} from "@/app/fields/actions";
import { FieldsWorkspace } from "@/app/fields/fields-workspace";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { getCrops } from "@/lib/data/crops";
import { buildFamilyOptions, DEFAULT_FAMILY_OPTIONS } from "@/lib/data/family-options";
import { getFields, getSections } from "@/lib/data/fields";
import { getPersonalSeeds, getSeedTemplateOptions } from "@/lib/data/seeds";

type FieldsPageProps = {
  searchParams: Promise<{
    error?: string;
    field?: string;
    year?: string;
    section?: string;
    newField?: string;
  }>;
};

function getSelectedYear(value: string | undefined) {
  const currentYear = new Date().getFullYear();
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : currentYear;
}

export default async function FieldsPage({ searchParams }: FieldsPageProps) {
  const [{ error, field, section, newField, year }, authState] = await Promise.all([
    searchParams,
    getCurrentAuthState(),
  ]);
  const selectedYear = getSelectedYear(year);
  const activeWorkspace = authState.workspaces[0] ?? null;
  const [sections, fields, crops, personalSeeds, seedTemplates] = activeWorkspace
    ? await Promise.all([
        getSections(activeWorkspace.id),
        getFields(activeWorkspace.id),
        getCrops(activeWorkspace.id),
        getPersonalSeeds(activeWorkspace.id),
        getSeedTemplateOptions(),
      ])
    : [[], [], [], [], []];
  const familyOptions = buildFamilyOptions([
    ...DEFAULT_FAMILY_OPTIONS,
    ...personalSeeds.map((seed) => seed.family),
    ...seedTemplates.map((seed) => seed.family),
  ]);

  return (
    <ModulePage href="/fields" focus={[]} firstBuild={[]}>
      {!authState.user ? (
        <div className="rounded-[22px] border border-[var(--border)] bg-white/90 p-5 shadow-[0_18px_40px_rgba(22,58,54,0.06)]">
          <p className="text-sm leading-6 text-[var(--ink-muted)]">
            Odlingsytor &auml;r privata och kopplade till ditt workspace.
          </p>
          <Link className="mt-4 inline-flex rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white" href="/login">
            Logga in
          </Link>
        </div>
      ) : null}

      {authState.user && !activeWorkspace ? (
        <div className="rounded-[22px] border border-[var(--border)] bg-white/90 p-5 shadow-[0_18px_40px_rgba(22,58,54,0.06)]">
          <p className="text-sm leading-6 text-[var(--ink-muted)]">
            Kontot saknar workspace. Skapa f&ouml;rsta odlingen innan du l&auml;gger till ytor.
          </p>
          <Link className="mt-4 inline-flex rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white" href="/onboarding">
            Skapa workspace
          </Link>
        </div>
      ) : null}

      {activeWorkspace ? (
        <FieldsWorkspace
          createFieldAction={createField}
          createSectionAction={createSection}
          crops={crops}
          deleteFieldAction={deleteField}
          deleteSectionAction={deleteSection}
          error={error}
          familyOptions={familyOptions}
          fields={fields}
          initialFieldId={field}
          initialSectionId={section}
          openNewFieldOnLoad={newField === "1"}
          selectedYear={selectedYear}
          sections={sections}
          updateFieldAction={updateField}
          updateFieldPlacementAction={updateFieldPlacement}
          updateSectionAction={updateSection}
        />
      ) : null}
    </ModulePage>
  );
}
