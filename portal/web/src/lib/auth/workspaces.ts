import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "member" | "viewer";
};

type WorkspaceMemberRow = {
  role: WorkspaceSummary["role"];
  workspaces: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export async function getCurrentAuthState() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      workspaces: [] as WorkspaceSummary[],
    };
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return {
      user,
      workspaces: [] as WorkspaceSummary[],
    };
  }

  const workspaces = ((data ?? []) as unknown as WorkspaceMemberRow[])
    .filter((row) => row.workspaces)
    .map((row) => ({
      id: row.workspaces!.id,
      name: row.workspaces!.name,
      slug: row.workspaces!.slug,
      role: row.role,
    }));

  return {
    user,
    workspaces,
  };
}

export function slugifyWorkspaceName(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "odling";
}
