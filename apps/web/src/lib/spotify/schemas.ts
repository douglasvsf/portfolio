import { z } from "zod";
import { resilientArray } from "@/lib/http/contract";
import type {
  CurrentlyPlaying,
  ExternalUrls,
  PlaybackState,
  RecentlyPlayedItem,
  SpotifyAlbum,
  SpotifyArtist,
  SpotifyArtistSimplified,
  SpotifyImage,
  SpotifyTrack,
  SpotifyUser,
  TokenResponse,
} from "./types";

/**
 * Contrato das respostas da Spotify Web API que o app consome. A anotação
 * `z.ZodType<Tipo>` garante em tempo de compilação que schema e tipos não
 * divergem. Regras:
 * - essencial (ids, nomes, durações) é obrigatório;
 * - o que a Spotify já removeu/remove em Development Mode (popularity,
 *   followers, genres) é opcional;
 * - campos "decorativos" ausentes ganham um padrão em vez de quebrar.
 */

const externalUrls: z.ZodType<ExternalUrls> = z
  .object({ spotify: z.string().optional(), lastfm: z.string().optional() })
  .default({});

const image: z.ZodType<SpotifyImage> = z.object({
  url: z.string(),
  width: z.number().nullable().default(null),
  height: z.number().nullable().default(null),
});

const images = z.array(image).default([]);

const artistSimplified: z.ZodType<SpotifyArtistSimplified> = z.object({
  id: z.string(),
  name: z.string(),
  external_urls: externalUrls,
});

export const artistSchema: z.ZodType<SpotifyArtist> = z.object({
  id: z.string(),
  name: z.string(),
  external_urls: externalUrls,
  images,
  genres: z.array(z.string()).optional(),
  popularity: z.number().optional(),
  followers: z.object({ total: z.number() }).optional(),
});

const album: z.ZodType<SpotifyAlbum> = z.object({
  id: z.string(),
  name: z.string(),
  images,
  release_date: z.string().optional(),
  // Valor novo/desconhecido não quebra a faixa inteira — só some.
  release_date_precision: z.enum(["year", "month", "day"]).optional().catch(undefined),
  album_type: z.enum(["album", "single", "compilation"]).optional().catch(undefined),
  external_urls: externalUrls,
});

/** Arquivos locais do usuário vêm com `id: null` — não são faixas do catálogo e são descartados. */
export const trackSchema: z.ZodType<SpotifyTrack> = z.object({
  id: z.string(),
  name: z.string(),
  duration_ms: z.number(),
  explicit: z.boolean().optional(),
  popularity: z.number().optional(),
  album,
  artists: z.array(artistSimplified).min(1),
  external_urls: externalUrls,
});

export const topArtistsSchema = z.object({ items: resilientArray(artistSchema, "spotify /me/top/artists") });

export const topTracksSchema = z.object({ items: resilientArray(trackSchema, "spotify /me/top/tracks") });

const recentlyPlayedItem: z.ZodType<RecentlyPlayedItem> = z.object({
  track: trackSchema,
  played_at: z.iso.datetime({ offset: true }),
});

export const recentlyPlayedSchema = z.object({
  items: resilientArray(recentlyPlayedItem, "spotify /me/player/recently-played"),
});

export const currentlyPlayingSchema: z.ZodType<CurrentlyPlaying> = z.object({
  is_playing: z.boolean(),
  progress_ms: z.number().nullable().default(null),
  timestamp: z.number(),
  currently_playing_type: z.enum(["track", "episode", "ad", "unknown"]).catch("unknown"),
  // Episódio de podcast, anúncio ou arquivo local não viram "now playing" — e não quebram nada.
  item: trackSchema.nullable().catch(null),
});

export const playbackStateSchema: z.ZodType<PlaybackState> = z.object({
  is_playing: z.boolean(),
  progress_ms: z.number().nullable().default(null),
  timestamp: z.number(),
  currently_playing_type: z.enum(["track", "episode", "ad", "unknown"]).catch("unknown"),
  item: trackSchema.nullable().catch(null),
  device: z
    .object({ name: z.string(), type: z.string(), volume_percent: z.number().nullable().default(null) })
    .nullable()
    .default(null),
  shuffle_state: z.boolean().default(false),
  repeat_state: z.enum(["off", "track", "context"]).catch("off"),
});

export const userSchema: z.ZodType<SpotifyUser> = z.object({
  id: z.string(),
  display_name: z.string().nullable().default(null),
  images,
  external_urls: externalUrls,
});

export const tokenSchema: z.ZodType<TokenResponse> = z.object({
  access_token: z.string().min(1),
  token_type: z.literal("Bearer"),
  scope: z.string().default(""),
  expires_in: z.number().positive(),
  refresh_token: z.string().optional(),
});
