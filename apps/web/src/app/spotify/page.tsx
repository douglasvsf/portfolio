import Link from "next/link";
import { cookies } from "next/headers";
import { AlertCircle, ArrowRight, BarChart3, History, ListMusic, Mic2, Play, type LucideIcon } from "@godzilla/icons";
import { AppHeader, Card, CardContent, CardDescription, CardHeader, CardTitle, appContainerClassName, cn } from "@godzilla/ui";
import { routes } from "@/config/spotify";
import { mockCurrentlyPlaying, mockTopArtists, mockTopTracks } from "@/lib/spotify/mock-data";
import { DEMO_COOKIE, SESSION_COOKIE } from "@/lib/spotify/session";
import { isShowcaseAvailable } from "@/lib/spotify/source";
import { artistNames, formatDuration, genreDistribution, normalizeNowPlaying } from "@/lib/spotify/transform";
import { GenreChart } from "@/components/spotify/charts/genre-chart";
import { CoverArt } from "@/components/spotify/common/cover-art";
import { BackToPortfolio } from "@/components/layout/back-to-portfolio";
import { SpotifyBrand } from "@/components/spotify/layout/spotify-brand";

const loginErrors: Record<string, string> = {
  access_denied: "You cancelled the Spotify authorization. Connect again whenever you're ready.",
  state_mismatch: "The login request couldn't be verified. Please try connecting again.",
  auth_failed: "We couldn't complete the Spotify login. Please try again.",
  not_allowlisted:
    "This Spotify account isn't allow-listed. The app runs in Spotify's Development Mode (limited to invited users) — try the demo instead.",
  session_expired: "Your session ended. Connect Spotify again or explore the demo.",
  not_configured: "Spotify login isn't configured on this deployment yet — explore the demo instead.",
};

const features: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Mic2, title: "Top Artists", description: "Your most-played artists over the last 4 weeks, 6 months or year, with genres and links to Spotify." },
  { icon: ListMusic, title: "Top Tracks", description: "A ranked list of your favourite songs with covers, albums and durations." },
  { icon: History, title: "Recently Played", description: "A timeline of your last 50 plays, grouped by day in your own time zone." },
  { icon: BarChart3, title: "Music Insights", description: "Genre distribution, artists across your top tracks and a live now-playing card." },
];

const ctaPrimary =
  "inline-flex h-(--size-control-lg) items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const ctaSecondary =
  "inline-flex h-(--size-control-lg) items-center justify-center gap-2 rounded-full border border-input px-6 font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function LandingPage({ searchParams }: PageProps<"/spotify">) {
  const error = (await searchParams).error;
  const errorMessage = typeof error === "string" ? loginErrors[error] : undefined;

  const store = await cookies();
  const hasSession = Boolean(store.get(SESSION_COOKIE) || store.get(DEMO_COOKIE)?.value === "1");
  // Com a vitrine configurada, o visitante vê as estatísticas reais do dono em vez do mock.
  const exploreLabel = isShowcaseAvailable() ? "Explore Douglas's live stats" : "View Demo";

  // Prévia do dashboard com os dados do demo — o visitante vê o produto antes de conectar.
  const previewArtists = mockTopArtists("medium_term", 20);
  const previewTracks = mockTopTracks("medium_term", 4);
  const previewNow = normalizeNowPlaying(mockCurrentlyPlaying(0));

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        skipToContent={{ label: "Skip to content" }}
        brand={<SpotifyBrand href={routes.landing} />}
        actions={<BackToPortfolio label="Back to portfolio" shortLabel="Portfolio" />}
      />

      <main id="content" className="flex flex-1 flex-col">
        <section className="bg-aura relative pb-16 pt-12 sm:pt-20">
          <div className={cn(appContainerClassName, "flex flex-col items-center gap-6 text-center")}>
            {errorMessage && (
              <p role="alert" className="flex max-w-xl items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-left text-body-sm">
                <AlertCircle className="mt-0.5 size-(--size-icon-sm) shrink-0 text-warning" aria-hidden="true" />
                {errorMessage}
              </p>
            )}
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-caption text-primary">
              Spotify Web API · OAuth PKCE · Next.js
            </span>
            <h1 className="text-h1 font-extrabold leading-none tracking-tight sm:text-display">
              YOUR MUSIC.
              <br />
              <span className="text-primary text-glow">YOUR STATS.</span>
            </h1>
            <p className="max-w-xl text-body-lg text-muted-foreground">Discover your Spotify listening habits.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {hasSession ? (
                <Link href={routes.dashboard} className={ctaPrimary}>
                  Open dashboard
                  <ArrowRight className="size-(--size-icon-sm)" aria-hidden="true" />
                </Link>
              ) : (
                <a href={routes.login} className={ctaPrimary}>
                  <Play className="size-(--size-icon-sm) fill-current" aria-hidden="true" />
                  Connect Spotify
                </a>
              )}
              <a href={routes.demo} className={ctaSecondary} data-testid="view-demo">
                {exploreLabel}
              </a>
            </div>
            <p className="text-caption text-muted-foreground">Read-only access · we never post, follow or change anything on your account.</p>
          </div>

          {/* Prévia do dashboard (dados do demo) */}
          <div className={cn(appContainerClassName, "mt-14 grid max-w-5xl gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]")} aria-label="Dashboard preview">
            <Card className="shadow-glow">
              <CardHeader>
                <CardTitle>Genre Distribution</CardTitle>
                <CardDescription>Derived from your top artists</CardDescription>
              </CardHeader>
              <CardContent>
                <GenreChart data={genreDistribution(previewArtists, 6)} />
              </CardContent>
            </Card>
            <div className="flex flex-col gap-4">
              {previewNow && (
                <Card className="flex items-center gap-4 p-5">
                  <CoverArt images={[]} seed={previewNow.track.album.id} alt="" size={64} />
                  <div className="min-w-0">
                    <p className="text-overline font-semibold uppercase tracking-widest text-primary">Now playing</p>
                    <p className="truncate font-semibold">{previewNow.track.name}</p>
                    <p className="truncate text-body-sm text-muted-foreground">{artistNames(previewNow.track)}</p>
                  </div>
                </Card>
              )}
              <Card className="p-3">
                <p className="px-2 pb-2 pt-1 text-overline font-semibold uppercase tracking-widest text-muted-foreground">Top tracks</p>
                <ol>
                  {previewTracks.map((track, index) => (
                    <li key={track.id} className="flex items-center gap-3 rounded-md px-2 py-2">
                      <span className="w-4 font-mono text-caption text-muted-foreground">{index + 1}</span>
                      <CoverArt images={[]} seed={track.album.id} alt="" size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-sm font-medium">{track.name}</span>
                        <span className="block truncate text-caption text-muted-foreground">{artistNames(track)}</span>
                      </span>
                      <span className="font-mono text-caption text-muted-foreground">{formatDuration(track.duration_ms)}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16" aria-labelledby="features-title">
          <div className={appContainerClassName}>
            <h2 id="features-title" className="mb-8 text-center text-h3 font-bold">
              Everything the Spotify API can tell you
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="flex flex-col gap-3 p-5 transition-colors hover:border-primary/40">
                  <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <Icon className="size-(--size-icon-md)" aria-hidden="true" />
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-body-sm text-muted-foreground">{description}</p>
                </Card>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-caption text-muted-foreground">
              Stats are limited to what the Spotify Web API provides: top items for three time ranges and your last 50 plays.
              This is not a full listening history or a Wrapped replacement.
            </p>
          </div>
        </section>

        <section className={cn(appContainerClassName, "pb-20")}>
          <Card className="bg-aura mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 py-12 text-center">
            <h2 className="text-h3 font-bold">Connect your Spotify</h2>
            <p className="max-w-md text-muted-foreground">See your own top artists, tracks and genres in seconds — or explore without logging in first.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {!hasSession && (
                <a href={routes.login} className={ctaPrimary}>
                  Connect Spotify
                </a>
              )}
              <a href={routes.demo} className={ctaSecondary}>
                {exploreLabel}
              </a>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
