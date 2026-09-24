import { z } from "zod";
import { resilientArray } from "@/lib/http/contract";
import type { LastfmImage, LastfmRecentTrack, LastfmTag, LastfmTopArtist, LastfmTopTrack, LastfmUser } from "./types";

/**
 * Contrato das respostas do Last.fm (JSON derivado do XML antigo deles):
 * números chegam como string, listas de 1 item viram objeto e campos somem
 * sem aviso. Os schemas normalizam isso na borda — o resto do app recebe
 * sempre o mesmo formato.
 */

/** "271" ou 271 → "271" (o Last.fm alterna entre os dois). */
const numericString = z.union([z.string(), z.number()]).transform(String);

const image: z.ZodType<LastfmImage> = z.object({
  "#text": z.string().default(""),
  size: z.enum(["small", "medium", "large", "extralarge", "mega", ""]).catch(""),
});
const images = z.array(image).default([]);

/** Lista que pode vir como objeto único (1 resultado) ou faltar (0 resultados). */
function lastfmList<Item extends z.ZodType>(item: Item, source: string) {
  return z.preprocess(
    (value) => (value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]),
    resilientArray(item, source),
  );
}

const userSchema: z.ZodType<LastfmUser> = z.object({
  name: z.string().min(1),
  realname: z.string().optional(),
  url: z.string(),
  image: images.optional(),
  playcount: numericString.optional(),
  registered: z.object({ unixtime: numericString }).optional(),
});

export const userInfoSchema = z.object({ user: userSchema });

const topArtist: z.ZodType<LastfmTopArtist> = z.object({
  name: z.string().min(1),
  playcount: numericString,
  mbid: z.string().optional(),
  url: z.string(),
  image: images.optional(),
});

export const topArtistsSchema = z.object({
  topartists: z.object({ artist: lastfmList(topArtist, "lastfm user.gettopartists") }),
});

const topTrack: z.ZodType<LastfmTopTrack> = z.object({
  name: z.string().min(1),
  playcount: numericString,
  duration: numericString.optional(),
  mbid: z.string().optional(),
  url: z.string(),
  artist: z.object({ name: z.string().min(1), mbid: z.string().optional(), url: z.string() }),
  image: images.optional(),
});

export const topTracksSchema = z.object({
  toptracks: z.object({ track: lastfmList(topTrack, "lastfm user.gettoptracks") }),
});

const recentTrack: z.ZodType<LastfmRecentTrack> = z.object({
  name: z.string().min(1),
  mbid: z.string().optional(),
  url: z.string(),
  artist: z.object({ "#text": z.string().min(1), mbid: z.string().optional() }),
  album: z.object({ "#text": z.string().default(""), mbid: z.string().optional() }).default({ "#text": "" }),
  image: images.optional(),
  date: z.object({ uts: numericString, "#text": z.string().default("") }).optional(),
  "@attr": z.object({ nowplaying: z.literal("true").optional() }).optional(),
});

export const recentTracksSchema = z.object({
  recenttracks: z.object({ track: lastfmList(recentTrack, "lastfm user.getrecenttracks") }),
});

const tag: z.ZodType<LastfmTag> = z.object({ name: z.string(), count: z.coerce.number() });

export const topTagsSchema = z.object({
  toptags: z.object({ tag: lastfmList(tag, "lastfm artist.gettoptags") }).default({ tag: [] }),
});
