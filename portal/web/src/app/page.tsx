import { redirect } from "next/navigation";
import { getCurrentAuthState } from "@/lib/auth/workspaces";

export default async function Home() {
  const authState = await getCurrentAuthState();

  if (!authState.user) {
    redirect("/login");
  }

  redirect("/tasks");
}
