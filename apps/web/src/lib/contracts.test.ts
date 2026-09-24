/**
 * Testes de contrato: as respostas reais gravadas em `__fixtures__` precisam
 * passar pelos schemas, e desvios conhecidos das APIs (campo sumindo, tipo
 * trocado, lista virando objeto) precisam ser absorvidos ou barrados.
 */
import brapiList from "./__fixtures__/brapi-list.json";
import brapiQuote from "./__fixtures__/brapi-quote-petr4.json";
import lastfmRecentTracks from "./__fixtures__/lastfm-recent-tracks.json";
import lastfmTopArtists from "./__fixtures__/lastfm-top-artists.json";
import lastfmTopTags from "./__fixtures__/lastfm-top-tags.json";
import lastfmTopTracks from "./__fixtures__/lastfm-top-tracks.json";
import lastfmUserInfo from "./__fixtures__/lastfm-user-info.json";
import { ContractError, contractReporter, parseContract } from "./http/contract";
import { splitRecentTracks, toArtist, toTopTrack, toUser } from "./lastfm/adapter";
import * as lastfm from "./lastfm/schemas";
import * as brapi from "./stocks/schemas";

jest.mock("server-only", () => ({}));

let reports: jest.SpyInstance;
beforeEach(() => {
  reports = jest.spyOn(contractReporter, "report").mockImplementation(() => {});
});
afterEach(() => reports.mockRestore());

const clone = <T>(value: T): T => structuredClone(value);

describe("Last.fm — fixtures reais", () => {
  it("todas as respostas gravadas cumprem o contrato sem descartar nada", () => {
    const user = parseContract(lastfm.userInfoSchema, lastfmUserInfo, "fixture");
    const artists = parseContract(lastfm.topArtistsSchema, lastfmTopArtists, "fixture").topartists.artist;
    const tracks = parseContract(lastfm.topTracksSchema, lastfmTopTracks, "fixture").toptracks.track;
    const recent = parseContract(lastfm.recentTracksSchema, lastfmRecentTracks, "fixture").recenttracks.track;
    const tags = parseContract(lastfm.topTagsSchema, lastfmTopTags, "fixture").toptags.tag;

    expect(artists).toHaveLength(lastfmTopArtists.topartists.artist.length);
    expect(tracks).toHaveLength(lastfmTopTracks.toptracks.track.length);
    expect(recent).toHaveLength(lastfmRecentTracks.recenttracks.track.length);
    expect(tags.length).toBeGreaterThan(0);
    expect(reports).not.toHaveBeenCalled();

    // E o adapter converte tudo sem exceção.
    expect(toUser(user.user).display_name).toBeTruthy();
    expect(artists.map(toArtist).every((artist) => artist.name)).toBe(true);
    expect(tracks.map(toTopTrack).every((track) => track.artists.length)).toBe(true);
    expect(splitRecentTracks(recent).history.length).toBeGreaterThan(0);
  });
});

describe("Last.fm — desvios", () => {
  it("números como number em vez de string são normalizados", () => {
    const data = clone(lastfmTopArtists);
    (data.topartists.artist[0] as { playcount: unknown }).playcount = 42;
    expect(parseContract(lastfm.topArtistsSchema, data, "drift").topartists.artist[0].playcount).toBe("42");
  });

  it("lista de 1 item vinda como objeto vira array", () => {
    const [only] = lastfmRecentTracks.recenttracks.track;
    const data = { recenttracks: { track: only } };
    expect(parseContract(lastfm.recentTracksSchema, data, "drift").recenttracks.track).toHaveLength(1);
  });

  it("item sem campo essencial é descartado e reportado, o resto segue", () => {
    const data = clone(lastfmTopTracks);
    delete (data.toptracks.track[0] as { name?: string }).name;
    const tracks = parseContract(lastfm.topTracksSchema, data, "drift").toptracks.track;
    expect(tracks).toHaveLength(lastfmTopTracks.toptracks.track.length - 1);
    expect(reports).toHaveBeenCalledWith(expect.objectContaining({ dropped: 1 }));
  });

  it("tamanho de imagem desconhecido e campos extras não quebram", () => {
    const data = clone(lastfmUserInfo) as { user: { image: { size: string }[]; novidade?: string } };
    data.user.image[0].size = "gigante";
    data.user.novidade = "campo novo";
    const user = parseContract(lastfm.userInfoSchema, data, "drift").user;
    expect(user.image?.[0].size).toBe("");
    expect(user).not.toHaveProperty("novidade");
  });

  it("artista sem tags vira lista vazia", () => {
    expect(parseContract(lastfm.topTagsSchema, {}, "drift").toptags.tag).toEqual([]);
  });

  it("perfil sem nome quebra o contrato", () => {
    expect(() => parseContract(lastfm.userInfoSchema, { user: { url: "u" } }, "drift")).toThrow(ContractError);
  });
});

describe("brapi — fixtures reais", () => {
  it("lista e cotação gravadas cumprem o contrato", () => {
    const list = parseContract(brapi.quoteListSchema, brapiList, "fixture");
    expect(list.stocks).toHaveLength(brapiList.stocks.length);
    expect(list.stocks[0]).not.toHaveProperty("subsector");

    const [quote] = parseContract(brapi.quoteResultsSchema, brapiQuote, "fixture").results;
    expect(quote.symbol).toBe("PETR4");
    expect(quote.historicalDataPrice).toHaveLength(brapiQuote.results[0].historicalDataPrice.length);
    expect(reports).not.toHaveBeenCalled();
  });
});

describe("brapi — desvios", () => {
  it("indicador opcional ausente ou com tipo trocado vira null", () => {
    const data = clone(brapiQuote) as { results: Record<string, unknown>[] };
    delete data.results[0].priceEarnings;
    data.results[0].marketCap = "n/a";
    const [quote] = parseContract(brapi.quoteResultsSchema, data, "drift").results;
    expect(quote.priceEarnings).toBeNull();
    expect(quote.marketCap).toBeNull();
  });

  it("vela sem data é descartada, as demais ficam", () => {
    const data = clone(brapiQuote) as { results: { historicalDataPrice: Record<string, unknown>[] }[] };
    delete data.results[0].historicalDataPrice[0].date;
    const [quote] = parseContract(brapi.quoteResultsSchema, data, "drift").results;
    expect(quote.historicalDataPrice).toHaveLength(brapiQuote.results[0].historicalDataPrice.length - 1);
  });

  it("ação sem ticker sai da lista; logo nula é aceita", () => {
    const data = clone(brapiList) as { stocks: Record<string, unknown>[] };
    delete data.stocks[0].stock;
    data.stocks[1].logo = null;
    const list = parseContract(brapi.quoteListSchema, data, "drift");
    expect(list.stocks).toHaveLength(brapiList.stocks.length - 1);
    expect(list.stocks[0].logo).toBeNull();
  });

  it("preço como string quebra o contrato (não exibimos cotação duvidosa)", () => {
    const data = clone(brapiQuote) as { results: Record<string, unknown>[] };
    data.results[0].regularMarketPrice = "50,00";
    expect(() => parseContract(brapi.quoteResultsSchema, data, "drift")).toThrow(ContractError);
  });

  it("paginação ausente quebra o contrato", () => {
    const data = clone(brapiList) as Record<string, unknown>;
    delete data.totalPages;
    expect(() => parseContract(brapi.quoteListSchema, data, "drift")).toThrow(ContractError);
  });
});
