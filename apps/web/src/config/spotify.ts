import type { TimeRange } from "@/lib/spotify/types";

/** Base de todas as rotas do app dentro do portfólio. */
export const SPOTIFY_BASE_PATH = "/spotify";

export const routes = {
  landing: SPOTIFY_BASE_PATH,
  dashboard: `${SPOTIFY_BASE_PATH}/dashboard`,
  artists: `${SPOTIFY_BASE_PATH}/artists`,
  tracks: `${SPOTIFY_BASE_PATH}/tracks`,
  recentlyPlayed: `${SPOTIFY_BASE_PATH}/recently-played`,
  login: "/api/spotify/login",
  demo: "/api/spotify/demo",
  nowPlaying: "/api/spotify/now-playing",
} as const;

/** Só o necessário para ler estatísticas — nenhuma permissão de escrita. */
export const SPOTIFY_SCOPES = [
  "user-top-read",
  "user-read-recently-played",
  "user-read-currently-playing",
  "user-read-playback-state",
] as const;

export const TIME_RANGES: Record<TimeRange, { label: string; short: string }> = {
  short_term: { label: "Last 4 weeks", short: "4 weeks" },
  medium_term: { label: "Last 6 months", short: "6 months" },
  long_term: { label: "Last year", short: "1 year" },
};

export const DEFAULT_TIME_RANGE: TimeRange = "short_term";

export function parseTimeRange(value: unknown): TimeRange {
  return typeof value === "string" && value in TIME_RANGES ? (value as TimeRange) : DEFAULT_TIME_RANGE;
}

/** Tempo de cache (segundos) de cada tipo de dado — ver lib/spotify/endpoints.ts. */
export const CACHE_SECONDS = {
  top: 300,
  recentlyPlayed: 30,
  profile: 3600,
} as const;

/** Intervalo de atualização do "Now playing" no navegador. */
export const NOW_PLAYING_POLL_MS = 20_000;

export const TOP_LIMIT = 50;
export const RECENTLY_PLAYED_LIMIT = 50;
