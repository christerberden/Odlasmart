import Link from "next/link";
import { redirect } from "next/navigation";
import { signInWithPassword } from "@/app/auth/actions";
import { getCurrentAuthState } from "@/lib/auth/workspaces";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ error }, authState] = await Promise.all([
    searchParams,
    getCurrentAuthState(),
  ]);

  if (authState.user) {
    redirect(authState.workspaces.length > 0 ? "/tasks" : "/onboarding");
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          Odlingsportal
        </span>
        <h1 className="mt-3 text-3xl font-semibold">Logga in</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
          Fortsätt till dina odlingar, fröer, grödor och skörd.
        </p>

        {error ? (
          <p className="mt-5 rounded-md border border-[var(--harvest)] bg-[#fff0ef] px-4 py-3 text-sm text-[var(--foreground)]">
            {error}
          </p>
        ) : null}

        <form action={signInWithPassword} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            E-post
            <input
              className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Lösenord
            <input
              className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={6}
              required
            />
          </label>
          <button className="rounded-md bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]">
            Logga in
          </button>
        </form>

        <p className="mt-5 text-sm text-[var(--ink-muted)]">
          Ny användare?{" "}
          <Link className="font-semibold text-[var(--primary-strong)]" href="/signup">
            Skapa konto
          </Link>
        </p>
      </section>
    </main>
  );
}
