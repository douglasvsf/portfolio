import { redirect } from "next/navigation";
import { Sparkles } from "@godzilla/icons";
import { appContainerClassName, cn } from "@godzilla/ui";
import { routes } from "@/config/spotify";
import { getSpotifySource } from "@/lib/spotify/source";
import type { SpotifyUser } from "@/lib/spotify/types";
import { AppHeader } from "@/components/spotify/layout/app-header";

/** Área do dashboard: exige sessão da Spotify, vitrine ou modo demo. */
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


  return (
    <div className="flex flex-1 flex-col">
      <AppHeader user={user} mode={source.mode} />
      {source.mode !== "live" && (
        <div className="border-b border-primary/20 bg-primary/10 px-4 py-2 text-center text-body-sm" data-testid="mode-banner">
          <Sparkles className="mr-1.5 inline size-(--size-icon-sm) text-primary" aria-hidden="true" />
          {source.mode === "showcase" ? (
            <>
              You&apos;re viewing <strong>{user?.display_name ?? "the owner"}&apos;s real Spotify stats</strong>, updated live.
            </>
          ) : source.mode === "lastfm" ? (
            <>
              Stats from <strong>Last.fm</strong> for <strong>{user?.id ?? "this user"}</strong>, built from their scrobbles.
            </>
          ) : (
            <>
              You&apos;re exploring <strong>demo data</strong>.
            </>
          )}{" "}
          <a href={routes.login} className="font-medium text-primary underline-offset-4 hover:underline">
            Connect your Spotify
          </a>{" "}
          to see your own stats.
        </div>
      )}
      <main id="content" className={cn(appContainerClassName, "flex flex-1 flex-col gap-8 py-8")}>
        {children}
      </main>
    </div>
  );
}
