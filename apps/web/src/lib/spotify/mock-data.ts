import type {
  CurrentlyPlaying,
  RecentlyPlayedItem,
  SpotifyArtist,
  SpotifyTrack,
  SpotifyUser,
  TimeRange,
} from "./types";

/**
 * Dados do modo demo. Artistas, músicas e anos de lançamento são reais
 * (durações aproximadas), mas sem imagens — as capas são geradas pela UI —
 * e os rankings são fictícios. Espelham o que a Spotify envia em Development
 * Mode: sem popularity/followers. Os gêneros representam as tags que o
 * Last.fm acrescenta quando está configurado.
 */

const spotifyUrl = (type: string, id: string) => ({ spotify: `https://open.spotify.com/${type}/${id}` });

interface ArtistSeed {
  id: string;
  name: string;
  genres: string[];
  tracks: [title: string, album: string, seconds: number][];
}

const seeds: ArtistSeed[] = [
  { id: "gojira", name: "Gojira", genres: ["progressive metal", "groove metal", "french metal"], tracks: [["Stranded", "Magma", 272], ["Silvera", "Magma", 213], ["Amazonia", "Fortitude", 301], ["Flying Whales", "From Mars to Sirius", 464]] },
  { id: "arctic-monkeys", name: "Arctic Monkeys", genres: ["indie rock", "rock", "garage rock"], tracks: [["Do I Wanna Know?", "AM", 272], ["R U Mine?", "AM", 201], ["505", "Favourite Worst Nightmare", 253], ["Arabella", "AM", 207]] },
  { id: "tame-impala", name: "Tame Impala", genres: ["psychedelic rock", "neo-psychedelic", "indie rock"], tracks: [["The Less I Know The Better", "Currents", 216], ["Let It Happen", "Currents", 467], ["Borderline", "The Slow Rush", 237]] },
  { id: "metallica", name: "Metallica", genres: ["thrash metal", "hard rock", "metal"], tracks: [["Master of Puppets", "Master of Puppets", 515], ["Enter Sandman", "Metallica", 331], ["One", "...And Justice for All", 446]] },
  { id: "daft-punk", name: "Daft Punk", genres: ["electronic", "french house", "electro"], tracks: [["Get Lucky", "Random Access Memories", 369], ["Instant Crush", "Random Access Memories", 337], ["One More Time", "Discovery", 320]] },
  { id: "radiohead", name: "Radiohead", genres: ["alternative rock", "art rock", "rock"], tracks: [["Weird Fishes/Arpeggi", "In Rainbows", 318], ["Reckoner", "In Rainbows", 290], ["Paranoid Android", "OK Computer", 387]] },
  { id: "qotsa", name: "Queens of the Stone Age", genres: ["stoner rock", "alternative rock", "hard rock"], tracks: [["No One Knows", "Songs for the Deaf", 278], ["Go With The Flow", "Songs for the Deaf", 187], ["Make It Wit Chu", "Era Vulgaris", 290]] },
  { id: "kendrick-lamar", name: "Kendrick Lamar", genres: ["hip hop", "rap", "west coast hip hop"], tracks: [["HUMBLE.", "DAMN.", 177], ["Money Trees", "good kid, m.A.A.d city", 386], ["Not Like Us", "Not Like Us", 274]] },
  { id: "sepultura", name: "Sepultura", genres: ["thrash metal", "groove metal", "brazilian metal"], tracks: [["Roots Bloody Roots", "Roots", 212], ["Refuse / Resist", "Chaos A.D.", 199]] },
  { id: "bring-me-the-horizon", name: "Bring Me The Horizon", genres: ["metalcore", "alternative metal", "rock"], tracks: [["Can You Feel My Heart", "Sempiternal", 228], ["Throne", "That's The Spirit", 191], ["Kingslayer", "POST HUMAN: SURVIVAL HORROR", 213]] },
  { id: "the-strokes", name: "The Strokes", genres: ["garage rock", "indie rock", "rock"], tracks: [["Reptilia", "Room On Fire", 221], ["Last Nite", "Is This It", 193]] },
  { id: "billie-eilish", name: "Billie Eilish", genres: ["pop", "art pop", "electropop"], tracks: [["BIRDS OF A FEATHER", "HIT ME HARD AND SOFT", 210], ["LUNCH", "HIT ME HARD AND SOFT", 180]] },
  { id: "pitty", name: "Pitty", genres: ["brazilian rock", "rock", "alternative rock"], tracks: [["Me Adora", "Chiaroscope", 197], ["Admirável Chip Novo", "Admirável Chip Novo", 240]] },
  { id: "nirvana", name: "Nirvana", genres: ["grunge", "alternative rock", "rock"], tracks: [["Smells Like Teen Spirit", "Nevermind", 301], ["Come As You Are", "Nevermind", 219]] },
  { id: "system-of-a-down", name: "System Of A Down", genres: ["alternative metal", "nu metal", "metal"], tracks: [["Chop Suey!", "Toxicity", 210], ["Toxicity", "Toxicity", 219], ["Aerials", "Toxicity", 369]] },
  { id: "charli-xcx", name: "Charli xcx", genres: ["pop", "hyperpop", "electropop"], tracks: [["360", "BRAT", 133], ["Von dutch", "BRAT", 164]] },
  { id: "legiao-urbana", name: "Legião Urbana", genres: ["brazilian rock", "mpb", "post-punk"], tracks: [["Tempo Perdido", "Dois", 302], ["Índios", "Dois", 257]] },
  { id: "deftones", name: "Deftones", genres: ["alternative metal", "nu metal", "shoegaze"], tracks: [["Change (In the House of Flies)", "White Pony", 300], ["My Own Summer (Shove It)", "Around the Fur", 214], ["Be Quiet and Drive (Far Away)", "Around the Fur", 308]] },
];

/** Ano de lançamento de cada álbum usado no demo. */
const albumYears: Record<string, number> = {
  Magma: 2016, Fortitude: 2021, "From Mars to Sirius": 2005, AM: 2013, "Favourite Worst Nightmare": 2007,
  Currents: 2015, "The Slow Rush": 2020, "Master of Puppets": 1986, Metallica: 1991, "...And Justice for All": 1988,
  "Random Access Memories": 2013, Discovery: 2001, "In Rainbows": 2007, "OK Computer": 1997, "Songs for the Deaf": 2002,
  "Era Vulgaris": 2007, "DAMN.": 2017, "good kid, m.A.A.d city": 2012, "Not Like Us": 2024, Roots: 1996,
  "Chaos A.D.": 1993, Sempiternal: 2013, "That's The Spirit": 2015, "POST HUMAN: SURVIVAL HORROR": 2020,
  "Room On Fire": 2003, "Is This It": 2001, "HIT ME HARD AND SOFT": 2024, Chiaroscope: 2009,
  "Admirável Chip Novo": 2003, Nevermind: 1991, Toxicity: 2001, BRAT: 2024, Dois: 1986, "White Pony": 2000,
  "Around the Fur": 1997,
};

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const mockArtists: SpotifyArtist[] = seeds.map((seed) => ({
  id: seed.id,
  name: seed.name,
  genres: seed.genres,
  images: [],
  external_urls: spotifyUrl("artist", seed.id),
}));

const EXPLICIT_ARTISTS = new Set(["kendrick-lamar", "system-of-a-down", "charli-xcx"]);

export const mockTracks: SpotifyTrack[] = seeds.flatMap((seed) =>
  seed.tracks.map(([title, album, seconds]) => ({
    id: `${seed.id}-${slug(title)}`,
    name: title,
    duration_ms: seconds * 1000,
    explicit: EXPLICIT_ARTISTS.has(seed.id),
    album: {
      id: `${seed.id}-${slug(album)}`,
      name: album,
      images: [],
      release_date: String(albumYears[album] ?? 2020),
      release_date_precision: "year" as const,
      external_urls: spotifyUrl("album", slug(album)),
    },
    artists: [{ id: seed.id, name: seed.name, external_urls: spotifyUrl("artist", seed.id) }],
    external_urls: spotifyUrl("track", `${seed.id}-${slug(title)}`),
  })),
);

export const mockUser: SpotifyUser = {
  id: "godzilla-demo",
  display_name: "Demo Listener",
  images: [],
  external_urls: { spotify: "https://open.spotify.com" },
};

/**
 * Embaralhamento determinístico (mesma saída a cada chamada) para que cada
 * período tenha um ranking diferente, mas estável entre recarregamentos.
 */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed;
  // mulberry32 — PRNG pequeno e com boa distribuição, suficiente para mocks.
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

const rangeSeed: Record<TimeRange, number> = { short_term: 7, medium_term: 42, long_term: 1954 };

/** Ranking do período: o embaralhamento parte da lista base, mantendo os favoritos perto do topo. */
function rankFor<T>(items: T[], range: TimeRange): T[] {
  const head = items.slice(0, 6);
  const tail = items.slice(6);
  return [...seededShuffle(head, rangeSeed[range]), ...seededShuffle(tail, rangeSeed[range] + 1)];
}

export function mockTopArtists(range: TimeRange, limit: number) {
  return rankFor(mockArtists, range).slice(0, limit);
}

export function mockTopTracks(range: TimeRange, limit: number) {
  return seededShuffle(mockTracks, rangeSeed[range]).slice(0, limit);
}

/** Uma música a cada ~4–7 min, com uma pausa de "noite" — sempre relativo ao momento atual. */
export function mockRecentlyPlayed(limit: number, now = Date.now()): RecentlyPlayedItem[] {
  const tracks = seededShuffle(mockTracks, 99);
  const items: RecentlyPlayedItem[] = [];
  let cursor = now - 3 * 60_000;
  for (let index = 0; index < limit; index++) {
    const track = tracks[index % tracks.length];
    items.push({ track, played_at: new Date(cursor).toISOString() });
    cursor -= track.duration_ms + ((index * 37) % 5) * 60_000;
    if (index === 17) cursor -= 9 * 60 * 60_000;
  }
  return items;
}

/** Música "tocando" cujo progresso anda com o relógio — ideal para demonstrar o player. */
export function mockCurrentlyPlaying(now = Date.now()): CurrentlyPlaying {
  const track = mockTracks[0];
  return {
    is_playing: true,
    progress_ms: now % track.duration_ms,
    timestamp: now,
    currently_playing_type: "track",
    item: track,
  };
}
