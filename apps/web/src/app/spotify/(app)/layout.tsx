import { redirect } from "next/navigation";
import { Sparkles } from "@godzilla/icons";
import { routes } from "@/config/spotify";
import { getSpotifySource } from "@/lib/spotify/source";
import type { SpotifyUser } from "@/lib/spotify/types";
import { AppHeader } from "@/components/spotify/layout/app-header";

/** Área autenticada: exige sessão da Spotify ou modo demo. */
export default async function DashboardLayout({ children }: LayoutProps<"/spotify">) {
  const source = await getSpotifySource();
  if (!source) redirect(`${routes.landing}?error=session_expired`);

  // O perfil é só decorativo — se falhar, o header usa um nome genérico.
  let user: SpotifyUser | null = null;
  try {
    user = await source.getProfile();
  } catch {
    user = null;
  }

  const demo = source.mode === "demo";

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader user={user} demo={demo} />
      {demo && (
        <div className="border-b border-primary/20 bg-primary/10 px-4 py-2 text-center text-body-sm">
          <Sparkles className="mr-1.5 inline size-(--size-icon-sm) text-primary" aria-hidden="true" />
          You&apos;re exploring <strong>demo data</strong>.{" "}
          <a href={routes.login} className="font-medium text-primary underline-offset-4 hover:underline">
            Connect your Spotify
          </a>{" "}
          to see your own stats.
        </div>
      )}
      <main id="content" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
