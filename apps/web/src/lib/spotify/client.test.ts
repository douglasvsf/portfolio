import { buildUrl, spotifyFetch } from "./client";
import { getCurrentlyPlaying, getTopArtists } from "./endpoints";
import { mockTopArtists } from "./mock-data";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init);

describe("buildUrl", () => {
  it("monta a URL e ignora parâmetros indefinidos", () => {
    expect(buildUrl("/me/top/artists", { time_range: "short_term", limit: 50, offset: undefined })).toBe(
      "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50",
    );
  });
});

describe("spotifyFetch", () => {
  it("envia o Bearer token e aplica o cache pedido", async () => {
    const fetchMock = jest.fn().mockResolvedValue(json({ ok: true }));
    global.fetch = fetchMock;

    await spotifyFetch("/me", "token-123", { revalidate: 60 });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({ Authorization: "Bearer token-123" });
    expect(init.next).toEqual({ revalidate: 60 });
  });

  it("sem revalidate não usa cache", async () => {
    const fetchMock = jest.fn().mockResolvedValue(json({}));
    global.fetch = fetchMock;
    await spotifyFetch("/me/player", "t");
    expect(fetchMock.mock.calls[0][1].cache).toBe("no-store");
  });

  it("204 e corpo vazio viram null (nada tocando)", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await expect(getCurrentlyPlaying("t")).resolves.toBeNull();

    global.fetch = jest.fn().mockResolvedValue(new Response("", { status: 200 }));
    await expect(getCurrentlyPlaying("t")).resolves.toBeNull();
  });

  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [429, "rate_limited"],
    [503, "unavailable"],
    [418, "unknown"],
  ])("status %i vira erro '%s'", async (status, kind) => {
    global.fetch = jest.fn().mockResolvedValue(json({ error: { status } }, { status, headers: { "Retry-After": "7" } }));
    await expect(spotifyFetch("/me", "t")).rejects.toMatchObject({ kind, status });
  });

  it("guarda o Retry-After do rate limit", async () => {
    global.fetch = jest.fn().mockResolvedValue(json({}, { status: 429, headers: { "Retry-After": "7" } }));
    await expect(spotifyFetch("/me", "t")).rejects.toMatchObject({ retryAfter: 7 });
  });

  it("timeout e falha de rede têm tipos próprios", async () => {
    global.fetch = jest.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    await expect(spotifyFetch("/me", "t")).rejects.toMatchObject({ kind: "timeout" });

    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(spotifyFetch("/me", "t")).rejects.toMatchObject({ kind: "network" });
  });
});

describe("endpoints", () => {
  it("getTopArtists devolve os itens da página (ou lista vazia)", async () => {
    const items = mockTopArtists("short_term", 2);
    global.fetch = jest.fn().mockResolvedValue(json({ items, total: 2, limit: 2, offset: 0, next: null }));
    await expect(getTopArtists("t", "short_term", 2)).resolves.toEqual(items);

    global.fetch = jest.fn().mockResolvedValue(json({ total: 0 }));
    await expect(getTopArtists("t", "long_term")).resolves.toEqual([]);
  });
});
