import { redirect } from "next/navigation";
import { Sparkles } from "@godzilla/icons";
import { appContainerClassName, cn } from "@godzilla/ui";
import { routes } from "@/config/spotify";
import { getSpotifyDictionary } from "@/content/spotify";
import { getRequestLocale } from "@/i18n/request";
import { RichText } from "@/i18n/rich";
import { getSpotifySource } from "@/lib/spotify/source";
import type { SpotifyUser } from "@/lib/spotify/types";
import { AppHeader } from "@/components/spotify/layout/app-header";

/** Área do dashboard: exige sessão da Spotify, vitrine, Last.fm ou modo demo. */
export default async function DashboardLayout({ children }: LayoutProps<"/spotify">) {
  const source = await getSpotifySource();
  if (!source) redirect(`${routes.landing}?error=session_expired`);

  const locale = await getRequestLocale();
  const dict = getSpotifyDictionary(locale);

  // O perfil é só decorativo — se falhar, o header usa um nome genérico.
  let user: SpotifyUser | null = null;
  try {
    user = await source.getProfile();
  } catch {
    user = null;
  }

  const banner =
    source.mode === "showcase"
      ? { text: dict.banner.showcase, name: user?.display_name ?? dict.banner.ownerFallback }
      : source.mode === "lastfm"
        ? { text: dict.banner.lastfm, name: user?.id ?? "" }
        : source.mode === "demo"
          ? { text: dict.banner.demo, name: "" }
          : null;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader user={user} mode={source.mode} dict={dict} locale={locale} />
      {banner && (
        <div className="border-b border-primary/20 bg-primary/10 px-4 py-2 text-center text-body-sm" data-testid="mode-banner">
          <Sparkles className="mr-1.5 inline size-(--size-icon-sm) text-primary" aria-hidden="true" />
          <RichText text={banner.text} vars={{ name: banner.name }} />{" "}
          <a href={routes.login} className="font-medium text-primary underline-offset-4 hover:underline">
            {dict.banner.connect}
          </a>{" "}
          {dict.banner.suffix}
        </div>
      )}
      <main id="content" className={cn(appContainerClassName, "flex flex-1 flex-col gap-8 py-8")}>
        {children}
      </main>
    </div>
  );
}
