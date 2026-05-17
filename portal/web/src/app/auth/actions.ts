"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugifyWorkspaceName } from "@/lib/auth/workspaces";

type WorkspaceRpcClient = {
  rpc(
    name: "create_workspace_for_current_user",
    args: {
      workspace_name: string;
      workspace_slug: string;
    },
  ): Promise<{ error: { message: string } | null }>;
};

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signInWithPassword(formData: FormData) {
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/onboarding");
}

export async function signUpWithPassword(formData: FormData) {
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createWorkspace(formData: FormData) {
  const name = getFormString(formData, "name");
  const slug = slugifyWorkspaceName(getFormString(formData, "slug") || name);

  const supabase = await createSupabaseServerClient();
  const rpcClient = supabase as unknown as WorkspaceRpcClient;
  const { error } = await rpcClient.rpc("create_workspace_for_current_user", {
    workspace_name: name,
    workspace_slug: slug,
  });

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}
