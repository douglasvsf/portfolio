import type { NowPlaying } from "@/lib/spotify/transform";
import type { RecentlyPlayedItem, SpotifyArtist, SpotifyImage, SpotifyTrack, SpotifyUser, TimeRange } from "@/lib/spotify/types";
import type { LastfmImage, LastfmPeriod, LastfmRecentTrack, LastfmTopArtist, LastfmTopTrack, LastfmUser } from "./types";

/**
 * Converte as respostas do Last.fm para os mesmos tipos usados pela UI do
 * Spotify — assim todas as telas, gráficos e transformações funcionam com as
 * duas fontes sem nenhuma mudança.
 */

/** Os 3 períodos da UI → períodos equivalentes do Last.fm. */
export const PERIOD_BY_RANGE: Record<TimeRange, LastfmPeriod> = {
  short_term: "1month",
  medium_term: "6month",
  long_term: "12month",
};

/** Imagem genérica (estrela cinza) que o Last.fm devolve quando não tem foto. */
const PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";

const SIZES: Record<string, number> = { small: 34, medium: 64, large: 174, extralarge: 300, mega: 600 };

export function toImages(images: LastfmImage[] | undefined): SpotifyImage[] {
  return (images ?? [])
    .filter((image) => image["#text"] && !image["#text"].includes(PLACEHOLDER_HASH))
    .map((image) => ({ url: image["#text"], width: SIZES[image.size] ?? null, height: SIZES[image.size] ?? null }));
}

/** Last.fm não tem ids estáveis para tudo — o nome normalizado vira o id. */
export function lastfmId(...parts: string[]) {
  return parts
    .join("--")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const artistRef = (name: string, url?: string) => ({ id: lastfmId(name), name, external_urls: { lastfm: url } });

export function toUser(user: LastfmUser): SpotifyUser {
  return {
    id: user.name,
    display_name: user.realname || user.name,
    images: toImages(user.image),
    external_urls: { lastfm: user.url },
  };
}

export function toArtist(artist: LastfmTopArtist): SpotifyArtist {
  return {
    ...artistRef(artist.name, artist.url),
    images: toImages(artist.image),
    genres: [],
    playcount: Number(artist.playcount) || undefined,
  };
}

export function toTopTrack(track: LastfmTopTrack): SpotifyTrack {
  return {
    id: lastfmId(track.artist.name, track.name),
    name: track.name,
    duration_ms: (Number(track.duration) || 0) * 1000,
    playcount: Number(track.playcount) || undefined,
    // user.getTopTracks não informa o álbum.
    album: { id: lastfmId(track.artist.name, track.name, "album"), name: "", images: toImages(track.image), external_urls: {} },
    artists: [artistRef(track.artist.name, track.artist.url)],
    external_urls: { lastfm: track.url },
  };
}

export function toRecentTrack(track: LastfmRecentTrack): SpotifyTrack {
  const artist = track.artist["#text"];
  const album = track.album["#text"];
  return {
    id: lastfmId(artist, track.name),
    name: track.name,
    duration_ms: 0,
    album: { id: lastfmId(artist, album || track.name, "album"), name: album, images: toImages(track.image), external_urls: {} },
    artists: [artistRef(artist)],
    external_urls: { lastfm: track.url },
  };
}

/** A API devolve um objeto (não array) quando há um único item. */
/** Separa o "tocando agora" (sem data) do histórico de scrobbles. O schema já normaliza a lista. */
export function splitRecentTracks(items: LastfmRecentTrack[]): {
  nowPlaying: NowPlaying | null;
  history: RecentlyPlayedItem[];
} {
  const current = items.find((track) => track["@attr"]?.nowplaying === "true");
  return {
    // O Last.fm não informa progresso nem duração — o player mostra só a faixa.
    nowPlaying: current ? { track: toRecentTrack(current), isPlaying: true, progressMs: 0, durationMs: 0 } : null,
    history: items
      .filter((track) => track.date)
      .map((track) => ({ track: toRecentTrack(track), played_at: new Date(Number(track.date!.uts) * 1000).toISOString() })),
  };
}
