/**
 * Respostas da API do Last.fm (formato JSON do "ws.audioscrobbler.com/2.0").
 * Só os campos que o app lê. Números chegam como string e atributos XML
 * viram chaves "#text" / "@attr".
 */

export type LastfmPeriod = "overall" | "7day" | "1month" | "3month" | "6month" | "12month";

export interface LastfmImage {
  "#text": string;
  size: "small" | "medium" | "large" | "extralarge" | "mega" | "";
}

export interface LastfmUser {
  name: string;
  realname?: string;
  url: string;
  image?: LastfmImage[];
  playcount?: string;
  registered?: { unixtime: string };
}

export interface LastfmTopArtist {
  name: string;
  playcount: string;
  mbid?: string;
  url: string;
  image?: LastfmImage[];
  "@attr"?: { rank: string };
}

export interface LastfmTopTrack {
  name: string;
  playcount: string;
  /** Segundos (pode vir "0" quando desconhecido). */
  duration?: string;
  mbid?: string;
  url: string;
  artist: { name: string; mbid?: string; url: string };
  image?: LastfmImage[];
  "@attr"?: { rank: string };
}

export interface LastfmRecentTrack {
  name: string;
  mbid?: string;
  url: string;
  artist: { "#text": string; mbid?: string };
  album: { "#text": string; mbid?: string };
  image?: LastfmImage[];
  /** Ausente na faixa que está tocando agora. */
  date?: { uts: string; "#text": string };
  "@attr"?: { nowplaying?: "true" };
}

export interface LastfmTag {
  name: string;
  count: number;
}

export interface LastfmErrorResponse {
  error: number;
  message: string;
}

export interface UserInfoResponse {
  user: LastfmUser;
}

export interface TopArtistsResponse {
  topartists: { artist: LastfmTopArtist[] };
}

export interface TopTracksResponse {
  toptracks: { track: LastfmTopTrack[] };
}

export interface RecentTracksResponse {
  recenttracks: { track: LastfmRecentTrack[] | LastfmRecentTrack };
}

export interface TopTagsResponse {
  toptags: { tag: LastfmTag[] };
}
