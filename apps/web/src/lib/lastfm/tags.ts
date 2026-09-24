import type { SpotifyArtist } from "@/lib/spotify/types";
import { lastfmFetch } from "./client";
import type { TopTagsResponse } from "./types";

/**
 * Gêneros a partir das tags do Last.fm (artist.getTopTags). A Spotify não
 * envia gêneros para apps em Development Mode — as tags preenchem essa lacuna
 * para qualquer fonte (Spotify, vitrine ou Last.fm).
 */

const TAGS_CACHE_SECONDS = 60 * 60 * 24 * 7; // tags de artista mudam pouco
const MAX_TAGS_PER_ARTIST = 3;
/** Tags com peso relativo menor que isso (0–100) são ruído. */
const MIN_TAG_COUNT = 10;
const CONCURRENCY = 5;

/** Tags populares que não são gênero musical. */
const NOT_GENRES = new Set([
  "seen live", "favorites", "favourite", "favorite", "favourites", "love", "loved", "awesome", "beautiful",
  "amazing", "best", "cool", "good", "great", "albums i own", "my favorite", "under 2000 listeners", "spotify",
  "male vocalists", "female vocalists", "female vocalist", "male vocalist", "singer-songwriter", "british", "american",
  "brazilian", "brasil", "brazil", "usa", "uk", "french", "canadian", "australian", "swedish", "german", "japanese",
  "korean", "90s", "80s", "70s", "60s", "00s", "2000s", "2010s", "2020s", "all", "music", "classic",
]);

/** Filtra ruído e o próprio nome do artista (tag comum no Last.fm). */
export function pickGenreTags(tags: { name: string; count: number }[], artistName: string, max = MAX_TAGS_PER_ARTIST) {
  const artist = artistName.trim().toLowerCase();
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const name = tag.name.trim().toLowerCase();
    if (!name || tag.count < MIN_TAG_COUNT || NOT_GENRES.has(name) || name === artist || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
    if (result.length === max) break;
  }
  return result;
}

export async function getArtistGenres(artistName: string): Promise<string[]> {
  const data = await lastfmFetch<TopTagsResponse>(
    "artist.gettoptags",
    { artist: artistName, autocorrect: 1 },
    { revalidate: TAGS_CACHE_SECONDS },
  );
  return pickGenreTags(data.toptags?.tag ?? [], artistName);
}

/** Executa `task` sobre os itens com no máximo `limit` chamadas simultâneas. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Preenche `genres` dos artistas que vieram sem. Falha em um artista não
 * derruba a página — ele só fica sem gênero.
 */
export async function withLastfmGenres(artists: SpotifyArtist[], limit = 25): Promise<SpotifyArtist[]> {
  const targets = artists.slice(0, limit);
  const genres = await mapWithConcurrency(targets, CONCURRENCY, (artist) =>
    artist.genres?.length ? Promise.resolve(artist.genres) : getArtistGenres(artist.name).catch(() => []),
  );
  return artists.map((artist, index) => (index < targets.length ? { ...artist, genres: genres[index] } : artist));
}
