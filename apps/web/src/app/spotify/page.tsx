import Link from "next/link";
import { cookies } from "next/headers";
import { AlertCircle, ArrowRight, BarChart3, History, ListMusic, Mic2, Play, type LucideIcon } from "@godzilla/icons";
import { AppHeader, Card, CardContent, CardDescription, CardHeader, CardTitle, appContainerClassName, cn } from "@godzilla/ui";
import { routes } from "@/config/spotify";
import { getSpotifyDictionary } from "@/content/spotify";
import { getRequestLocale } from "@/i18n/request";
import { mockCurrentlyPlaying, mockTopArtists, mockTopTracks } from "@/lib/spotify/mock-data";
import { DEMO_COOKIE, SESSION_COOKIE } from "@/lib/spotify/session";
import { isShowcaseAvailable } from "@/lib/spotify/source";
import { isLastfmConfigured } from "@/lib/lastfm/client";
import { artistNames, formatDuration, genreDistribution, normalizeNowPlaying } from "@/lib/spotify/transform";
import { BackToPortfolio } from "@/components/layout/back-to-portfolio";
import { SystemLocaleSwitcher } from "@/components/layout/system-locale-switcher";
import { GenreChart } from "@/components/spotify/charts/genre-chart";
import { CoverArt } from "@/components/spotify/common/cover-art";
import { LastfmForm } from "@/components/spotify/landing/lastfm-form";
import { SpotifyBrand } from "@/components/spotify/layout/spotify-brand";

/** Ícones dos 4 destaques, na ordem de `landing.features` no dicionário. */
const featureIcons: LucideIcon[] = [Mic2, ListMusic, History, BarChart3];

const ctaPrimary =
  "inline-flex h-(--size-control-lg) items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const ctaSecondary =
  "inline-flex h-(--size-control-lg) items-center justify-center gap-2 rounded-full border border-input px-6 font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function LandingPage({ searchParams }: PageProps<"/spotify">) {
  const locale = await getRequestLocale();
  const dict = getSpotifyDictionary(locale);
  const t = dict.landing;

  const error = (await searchParams).error;
  const errorMessage = typeof error === "string" ? t.loginErrors[error] : undefined;
  const lastfmError = typeof error === "string" ? t.lastfmErrors[error] : undefined;
  const showLastfm = isLastfmConfigured();

  const store = await cookies();
  const hasSession = Boolean(store.get(SESSION_COOKIE) || store.get(DEMO_COOKIE));
  // Com a vitrine configurada, o visitante vê as estatísticas reais do dono em vez do mock.
  const exploreLabel = isShowcaseAvailable() ? t.exploreShowcase : t.viewDemo;

  // Prévia do dashboard com os dados do demo — o visitante vê o produto antes de conectar.
  const previewArtists = mockTopArtists("medium_term", 20);
  const previewTracks = mockTopTracks("medium_term", 4);
  const previewNow = normalizeNowPlaying(mockCurrentlyPlaying(0));

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        skipToContent={{ label: dict.common.skipToContent }}
        brand={<SpotifyBrand href={routes.landing} />}
        actions={
          <div className="flex items-center gap-4 sm:gap-6">
            <BackToPortfolio label={dict.common.backToPortfolio} />
            <SystemLocaleSwitcher locale={locale} />
          </div>
        }
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
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-caption text-primary">{t.badge}</span>
            <h1 className="text-h1 font-extrabold leading-none tracking-tight sm:text-display">
              {t.titleTop}
              <br />
              <span className="text-primary text-glow">{t.titleBottom}</span>
            </h1>
            <p className="max-w-xl text-body-lg text-muted-foreground">{t.subtitle}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {hasSession ? (
                <Link href={routes.dashboard} className={ctaPrimary}>
                  {t.openDashboard}
                  <ArrowRight className="size-(--size-icon-sm)" aria-hidden="true" />
                </Link>
              ) : (
                <a href={routes.login} className={ctaPrimary}>
                  <Play className="size-(--size-icon-sm) fill-current" aria-hidden="true" />
                  {t.connect}
                </a>
              )}
              <a href={routes.demo} className={ctaSecondary} data-testid="view-demo">
                {exploreLabel}
              </a>
            </div>
            <p className="text-caption text-muted-foreground">{t.readOnly}</p>
            {showLastfm && (
              <a href="#lastfm" className="text-body-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                {t.lastfmHint}
              </a>
            )}
          </div>

          {/* Prévia do dashboard (dados do demo) */}
          <div
            className={cn(appContainerClassName, "mt-14 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]")}
            aria-label={t.previewLabel}
          >
            <Card className="shadow-glow">
              <CardHeader>
                <CardTitle>{t.previewGenres}</CardTitle>
                <CardDescription>{t.previewGenresDescription}</CardDescription>
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
                    <p className="text-overline font-semibold uppercase tracking-widest text-primary">{dict.nowPlaying.label}</p>
                    <p className="truncate font-semibold">{previewNow.track.name}</p>
                    <p className="truncate text-body-sm text-muted-foreground">{artistNames(previewNow.track)}</p>
                  </div>
                </Card>
              )}
              <Card className="p-3">
                <p className="px-2 pb-2 pt-1 text-overline font-semibold uppercase tracking-widest text-muted-foreground">{dict.tracks.title}</p>
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

        {showLastfm && (
          <section className={cn(appContainerClassName, "pt-4")} aria-label={dict.lastfmForm.sectionLabel}>
            <LastfmForm error={lastfmError} dict={dict} />
          </section>
        )}

        <section className="py-16" aria-labelledby="features-title">
          <div className={appContainerClassName}>
            <h2 id="features-title" className="mb-8 text-center text-h3 font-bold">
              {t.featuresTitle}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.features.map(({ title, description }, index) => {
                const Icon = featureIcons[index] ?? BarChart3;
                return (
                  <Card key={title} className="flex flex-col gap-3 p-5 transition-colors hover:border-primary/40">
                    <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Icon className="size-(--size-icon-md)" aria-hidden="true" />
                    </span>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-body-sm text-muted-foreground">{description}</p>
                  </Card>
                );
              })}
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-caption text-muted-foreground">{t.limitations}</p>
          </div>
        </section>

        <section className={cn(appContainerClassName, "pb-20")}>
          <Card className="bg-aura mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 py-12 text-center">
            <h2 className="text-h3 font-bold">{t.ctaTitle}</h2>
            <p className="max-w-md text-muted-foreground">{t.ctaDescription}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {!hasSession && (
                <a href={routes.login} className={ctaPrimary}>
                  {t.connect}
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
