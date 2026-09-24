/**
 * Tipos das respostas da Spotify Web API usadas pelo app — só os campos que
 * a interface realmente lê.
 *
 * `popularity` e `followers` são opcionais: desde fev/2026 a Spotify deixou
 * de enviá-los para apps em Development Mode, e a UI precisa funcionar sem eles.
 */

export type TimeRange = "short_term" | "medium_term" | "long_term";

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface ExternalUrls {
  spotify?: string;
  /** Itens vindos do Last.fm apontam para a página deles lá. */
  lastfm?: string;
}

export interface SpotifyArtistSimplified {
  id: string;
  name: string;
  external_urls: ExternalUrls;
}

export interface SpotifyArtist extends SpotifyArtistSimplified {
  images: SpotifyImage[];
  genres?: string[];
  popularity?: number;
  followers?: { total: number };
  /** Só no Last.fm: quantas vezes o usuário ouviu no período. */
  playcount?: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  /** "YYYY", "YYYY-MM" ou "YYYY-MM-DD" conforme release_date_precision. */
  release_date?: string;
  release_date_precision?: "year" | "month" | "day";
  album_type?: "album" | "single" | "compilation";
  external_urls: ExternalUrls;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  /** Ausente quando a fonte não informa (Last.fm). */
  explicit?: boolean;
  popularity?: number;
  /** Só no Last.fm: quantas vezes o usuário ouviu no período. */
  playcount?: number;
  album: SpotifyAlbum;
  artists: SpotifyArtistSimplified[];
  external_urls: ExternalUrls;
}

export interface Paging<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

export type TopArtistsResponse = Paging<SpotifyArtist>;
export type TopTracksResponse = Paging<SpotifyTrack>;

export interface RecentlyPlayedItem {
  track: SpotifyTrack;
  /** ISO 8601. */
  played_at: string;
}

export interface RecentlyPlayedResponse {
  items: RecentlyPlayedItem[];
  next: string | null;
}

export interface CurrentlyPlaying {
  is_playing: boolean;
  progress_ms: number | null;
  /** Timestamp (ms) em que o progresso foi medido pela Spotify. */
  timestamp: number;
  currently_playing_type: "track" | "episode" | "ad" | "unknown";
  /** `null` para anúncios, episódios ou sessão privada. */
  item: SpotifyTrack | null;
}

export interface PlaybackState extends CurrentlyPlaying {
  device: { name: string; type: string; volume_percent: number | null } | null;
  shuffle_state: boolean;
  repeat_state: "off" | "track" | "context";
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  images: SpotifyImage[];
  external_urls: ExternalUrls;
}

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  scope: string;
  /** Segundos. */
  expires_in: number;
  /** A Spotify pode omitir no refresh — nesse caso o anterior continua válido. */
  refresh_token?: string;
}
