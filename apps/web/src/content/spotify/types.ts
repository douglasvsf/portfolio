import type { SpotifyErrorKind } from "@/lib/spotify/errors";
import type { TimeRange } from "@/lib/spotify/types";

/** Singular/plural — escolhido com Intl.PluralRules (ver plural()). */
export interface Plural {
  one: string;
  other: string;
}

/**
 * Textos do GODZILLA Spotify Stats. Só strings: variáveis entre chaves
 * (`fmt`) e ênfase entre **asteriscos** (`RichText`).
 */
export interface SpotifyDictionary {
  meta: { description: string };
  common: { skipToContent: string; backToPortfolio: string; backShort: string; footer: string; dataBySpotify: string; poweredByLastfm: string };
  ranges: Record<TimeRange, { label: string; short: string }>;
  rangeLabel: string;
  nav: { label: string; overview: string; artists: string; tracks: string; recent: string };
  header: {
    badges: { showcase: string; lastfm: string; demo: string };
    logout: { live: string; showcase: string; lastfm: string; demo: string };
    fallbackName: string;
  };
  banner: { showcase: string; lastfm: string; demo: string; connect: string; suffix: string; ownerFallback: string };
  landing: {
    badge: string;
    titleTop: string;
    titleBottom: string;
    subtitle: string;
    openDashboard: string;
    connect: string;
    exploreShowcase: string;
    viewDemo: string;
    readOnly: string;
    lastfmHint: string;
    previewLabel: string;
    previewGenres: string;
    previewGenresDescription: string;
    featuresTitle: string;
    features: { title: string; description: string }[];
    limitations: string;
    ctaTitle: string;
    ctaDescription: string;
    loginErrors: Record<string, string>;
    lastfmErrors: Record<string, string>;
  };
  lastfmForm: {
    eyebrow: string;
    title: string;
    /** {link} = "Last.fm" com link. */
    description: string;
    label: string;
    placeholder: string;
    submit: string;
    sectionLabel: string;
  };
  overview: {
    title: string;
    /** {range} */
    description: string;
    highlightsLabel: string;
    topArtist: string;
    topTrack: string;
    topGenre: string;
    topEra: string;
    recentlyPlayed: string;
    noData: string;
    nothingYet: string;
    unknown: string;
    /** {n} */
    followers: string;
    /** {n} */
    inTopTracks: string;
    /** {n}, {total} */
    ofTopArtists: string;
    /** {n}, {total} */
    ofTopTracks: string;
    noReleaseDates: string;
    genreTitle: string;
    /** {source}, {n} */
    genreDescription: string;
    genreSourceFallback: string;
    genreSources: { lastfm: string; spotify: string };
    decadeTitle: string;
    /** {n} */
    decadeDescription: string;
    artistsTitle: string;
    /** {n} */
    artistsDescription: string;
    tracksLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    justNow: string;
    /** {n} */
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  };
  profile: {
    title: string;
    artistsAnalyzed: string;
    tracksAnalyzed: string;
    topArtist: string;
    topTrack: string;
    topGenre: string;
    genresDiscovered: string;
    favouriteEra: string;
    newestRelease: string;
    oldestRelease: string;
    explicitTracks: string;
    averageLength: string;
  };
  nowPlaying: { label: string; paused: string; nothing: string; hint: string; progress: string };
  artists: {
    title: string;
    /** {n}, {range} */
    description: string;
    top3: string;
    more: string;
    plays: Plural;
    /** {n} */
    followers: string;
    /** {n} */
    popularity: string;
    emptyTitle: string;
    emptyDescription: string;
    popularityTitle: string;
    popularityDescription: string;
    popularityLabel: string;
  };
  tracks: {
    title: string;
    /** {n}, {range} */
    description: string;
    cover: string;
    track: string;
    artist: string;
    album: string;
    plays: string;
    popularity: string;
    duration: string;
    playsCount: Plural;
    /** {name} */
    coverAlt: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  recent: {
    title: string;
    descriptionSpotify: string;
    descriptionLastfm: string;
    today: string;
    yesterday: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  charts: {
    /** Tooltip do gráfico de gêneros. */
    artistsCount: Plural;
    /** Tooltip do gráfico de décadas. */
    tracksCount: Plural;
  };
  errors: Record<SpotifyErrorKind, { title: string; description: string }> & {
    reconnect: string;
    viewDemo: string;
    tryAgain: string;
    boundaryTitle: string;
    boundaryDescription: string;
  };
}
