"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { routes } from "@/config/spotify";
import { DEMO_COOKIE, OAUTH_COOKIE, SESSION_COOKIE } from "@/lib/spotify/session";

/** Logout (e saída do modo demo): apaga todos os cookies do app e volta para a landing. */
export async function signOut() {
  const store = await cookies();
  for (const name of [SESSION_COOKIE, OAUTH_COOKIE, DEMO_COOKIE]) store.delete(name);
  redirect(routes.landing);
}
