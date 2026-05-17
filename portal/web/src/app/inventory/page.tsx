import Link from "next/link";
import { ModulePage } from "@/app/components/module-page";
import { deleteInventorySeed, saveInventorySeed } from "@/app/inventory/actions";
import { InventoryWorkspace } from "@/app/inventory/inventory-workspace";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { getSeedStockBatches } from "@/lib/data/inventory";
import { getPersonalSeeds, getSeedTemplateOptions } from "@/lib/data/seeds";

type InventoryPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const [{ error }, authState] = await Promise.all([
    searchParams,
    getCurrentAuthState(),
  ]);
  const activeWorkspace = authState.workspaces[0] ?? null;
  const [personalSeeds, stockBatches, seedTemplates] = activeWorkspace
    ? await Promise.all([
        getPersonalSeeds(activeWorkspace.id),
        getSeedStockBatches(activeWorkspace.id),
        getSeedTemplateOptions(),
      ])
    : [[], [], []];

  return (
    <ModulePage href="/inventory" focus={[]} firstBuild={[]}>
      {!authState.user ? (
        <section className="surface inventory-auth-card">
          <p className="section-kicker">Personlig databas</p>
          <h3>Mina fröer</h3>
          <p>Frölagret är privat och kopplat till ditt workspace.</p>
          <Link className="button-primary" href="/login">
            Logga in
          </Link>
        </section>
      ) : null}

      {authState.user && !activeWorkspace ? (
        <section className="surface inventory-auth-card">
          <p className="section-kicker">Personlig databas</p>
          <h3>Mina fröer</h3>
          <p>Kontot saknar workspace. Skapa första odlingen innan du lägger till fröer.</p>
          <Link className="button-primary" href="/onboarding">
            Skapa workspace
          </Link>
        </section>
      ) : null}

      {activeWorkspace ? (
        <InventoryWorkspace
          deleteInventorySeedAction={deleteInventorySeed}
          error={error}
          personalSeeds={personalSeeds}
          saveInventorySeedAction={saveInventorySeed}
          seedTemplates={seedTemplates}
          stockBatches={stockBatches}
        />
      ) : null}
    </ModulePage>
  );
}
