import type { CurrentlyPlaying, RecentlyPlayedItem, SpotifyArtist, SpotifyImage, SpotifyTrack } from "./types";

/**
 * Funções puras que transformam respostas da Spotify no formato que a UI usa.
 * Nada aqui faz I/O — tudo é coberto por testes unitários.
 */

// ---- Gêneros --------------------------------------------------------------

export interface GenreSlice {
  genre: string;
  /** Quantos artistas do top têm esse gênero. */
  artists: number;
  /** Fração (0–1) dos artistas analisados. */
  share: number;
}

export function normalizeGenre(genre: string) {
  return genre
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Distribuição de gêneros derivada dos artistas: cada artista conta uma vez
 * por gênero. Não representa todo o histórico do usuário — só os artistas
 * que a API devolveu para o período.
 */
export function genreDistribution(artists: SpotifyArtist[], top = 8): GenreSlice[] {
  const counts = new Map<string, number>();
  for (const artist of artists) {
    const genres = new Set((artist.genres ?? []).map(normalizeGenre).filter(Boolean));
    for (const genre of genres) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  const total = artists.length || 1;
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([genre, count]) => ({ genre, artists: count, share: count / total }));
}

export function countGenres(artists: SpotifyArtist[]) {
  return new Set(artists.flatMap((artist) => (artist.genres ?? []).map(normalizeGenre))).size;
}

// ---- Artistas nas top tracks ----------------------------------------------

export type ArtistTrackCount = {
  artist: string;
  tracks: number;
};

/** Quantas das top tracks têm cada artista (feats contam para todos os artistas da faixa). */
export function artistsInTopTracks(tracks: SpotifyTrack[], top = 8): ArtistTrackCount[] {
  const counts = new Map<string, { name: string; tracks: number }>();
  for (const track of tracks) {
    for (const artist of track.artists) {
      const entry = counts.get(artist.id) ?? { name: artist.name, tracks: 0 };
      entry.tracks += 1;
      counts.set(artist.id, entry);
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.tracks - a.tracks || a.name.localeCompare(b.name))
    .slice(0, top)
    .map(({ name, tracks: count }) => ({ artist: name, tracks: count }));
}

// ---- Perfil musical -------------------------------------------------------

// ---- Épocas (ano de lançamento) -------------------------------------------

export type DecadeSlice = {
  /** Ex.: "2010s". */
  decade: string;
  tracks: number;
  share: number;
};

/** Ano de lançamento do álbum da faixa (a Spotify envia "YYYY", "YYYY-MM" ou "YYYY-MM-DD"). */
export function releaseYear(track: SpotifyTrack): number | null {
  const year = Number(track.album.release_date?.slice(0, 4));
  return Number.isInteger(year) && year > 1900 ? year : null;
}

/** Quantas top tracks saíram em cada década — em ordem cronológica. */
export function decadeDistribution(tracks: SpotifyTrack[]): DecadeSlice[] {
  const counts = new Map<number, number>();
  for (const track of tracks) {
    const year = releaseYear(track);
    if (year === null) continue;
    const decade = Math.floor(year / 10) * 10;
    counts.set(decade, (counts.get(decade) ?? 0) + 1);
  }
  const dated = [...counts.values()].reduce((sum, count) => sum + count, 0) || 1;
  return [...counts]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, count]) => ({ decade: `${decade}s`, tracks: count, share: count / dated }));
}

export interface MusicProfile {
  artistsAnalyzed: number;
  tracksAnalyzed: number;
  /** Zero quando a fonte não envia gêneros (Spotify em Development Mode). */
  genresDiscovered: number;
  topGenre: string | null;
  topDecade: DecadeSlice | null;
  newestTrack: SpotifyTrack | null;
  oldestTrack: SpotifyTrack | null;
  /** Fração (0–1) das top tracks marcadas como explícitas. */
  explicitShare: number | null;
  topArtist: SpotifyArtist | null;
  topTrack: SpotifyTrack | null;
  /** Duração média das top tracks, em ms (ignora faixas sem duração). */
  averageTrackMs: number | null;
}

export function musicProfile(artists: SpotifyArtist[], tracks: SpotifyTrack[]): MusicProfile {
  const genres = genreDistribution(artists, 1);
  const decades = decadeDistribution(tracks);
  const dated = tracks.filter((track) => releaseYear(track) !== null);
  const byRelease = [...dated].sort((a, b) => (a.album.release_date ?? "").localeCompare(b.album.release_date ?? ""));
  const timed = tracks.filter((track) => track.duration_ms > 0);

  return {
    artistsAnalyzed: artists.length,
    tracksAnalyzed: tracks.length,
    genresDiscovered: countGenres(artists),
    topGenre: genres[0]?.genre ?? null,
    topDecade: decades.reduce<DecadeSlice | null>((best, slice) => (!best || slice.tracks > best.tracks ? slice : best), null),
    newestTrack: byRelease.at(-1) ?? null,
    oldestTrack: byRelease[0] ?? null,
    explicitShare: tracks.length ? tracks.filter((track) => track.explicit).length / tracks.length : null,
    topArtist: artists[0] ?? null,
    topTrack: tracks[0] ?? null,
    averageTrackMs: timed.length ? timed.reduce((sum, track) => sum + track.duration_ms, 0) / timed.length : null,
  };
}

// ---- Now playing ----------------------------------------------------------

export interface NowPlaying {
  track: SpotifyTrack;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
}

/** Só faixas de música viram "now playing" — anúncios, podcasts e sessão privada viram `null`. */
export function normalizeNowPlaying(data: CurrentlyPlaying | null): NowPlaying | null {
  if (!data?.item || data.currently_playing_type !== "track") return null;
  return {
    track: data.item,
    isPlaying: data.is_playing,
    progressMs: Math.min(data.progress_ms ?? 0, data.item.duration_ms),
    durationMs: data.item.duration_ms,
  };
}

// ---- Recently played ------------------------------------------------------

export interface PlayedDay {
  /** YYYY-MM-DD no fuso informado. */
  day: string;
  items: RecentlyPlayedItem[];
}

export function dayKey(iso: string, timeZone?: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

/** Agrupa a timeline por dia, mais recente primeiro. */
export function groupByDay(items: RecentlyPlayedItem[], timeZone?: string): PlayedDay[] {
  const sorted = [...items].sort((a, b) => b.played_at.localeCompare(a.played_at));
  const days: PlayedDay[] = [];
  for (const item of sorted) {
    const day = dayKey(item.played_at, timeZone);
    const current = days.at(-1);
    if (current?.day === day) current.items.push(item);
    else days.push({ day, items: [item] });
  }
  return days;
}

// ---- Formatação -----------------------------------------------------------

export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatCompact(value: number) {
  return compact.format(value);
}

/** Menor imagem que ainda cobre `size` px (a Spotify manda da maior para a menor). */
export function pickImage(images: SpotifyImage[] | undefined, size: number): string | null {
  if (!images?.length) return null;
  const sorted = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return (sorted.find((image) => (image.width ?? 0) >= size) ?? sorted.at(-1))?.url ?? null;
}

/** Link do item na fonte de origem (Spotify ou Last.fm). */
export function externalUrl(item: { external_urls: { spotify?: string; lastfm?: string } }) {
  return item.external_urls.spotify ?? item.external_urls.lastfm;
}

export function artistNames(track: SpotifyTrack) {
  return track.artists.map((artist) => artist.name).join(", ");
}
