import { redirect } from "next/navigation";
import { createWorkspace, signOut } from "@/app/auth/actions";
import { getCurrentAuthState } from "@/lib/auth/workspaces";

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const [{ error }, authState] = await Promise.all([
    searchParams,
    getCurrentAuthState(),
  ]);

  if (!authState.user) {
    redirect("/login");
  }

  if (authState.workspaces.length > 0) {
    redirect("/tasks");
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-xl rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              Första odlingen
            </span>
            <h1 className="mt-3 text-3xl font-semibold">Skapa workspace</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
              Ett workspace är din odling. Alla fröer, bäddar, grödor, uppgifter och
              skördeposter kopplas hit.
            </p>
          </div>
          <form action={signOut}>
            <button className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium">
              Logga ut
            </button>
          </form>
        </div>

        <p className="mt-5 rounded-md bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Inloggad som {authState.user.email}
        </p>

        {error ? (
          <p className="mt-5 rounded-md border border-[var(--harvest)] bg-[#fff0ef] px-4 py-3 text-sm text-[var(--foreground)]">
            {error}
          </p>
        ) : null}

        <form action={createWorkspace} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Namn på odlingen
            <input
              className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]"
              name="name"
              placeholder="Björkbacka odling"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Kort adressnamn
            <input
              className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]"
              name="slug"
              placeholder="bjorkbacka"
            />
          </label>
          <button className="rounded-md bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]">
            Skapa workspace
          </button>
        </form>
      </section>
    </main>
  );
}
