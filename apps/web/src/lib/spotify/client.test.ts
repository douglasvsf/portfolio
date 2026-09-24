import { z } from "zod";
import { buildUrl, retryableSpotifyError, spotifyFetch } from "./client";
import { getCurrentlyPlaying, getTopArtists } from "./endpoints";
import { SpotifyApiError } from "./errors";
import { mockTopArtists } from "./mock-data";

const originalFetch = global.fetch;
const anything = z.unknown();

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init);
/** Um Response novo por chamada (o corpo só pode ser lido uma vez). */
const always = (make: () => Response) => jest.fn(async () => make());

describe("buildUrl", () => {
  it("monta a URL e ignora parâmetros indefinidos", () => {
    expect(buildUrl("/me/top/artists", { time_range: "short_term", limit: 50, offset: undefined })).toBe(
      "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50",
    );
  });
});

describe("spotifyFetch", () => {
  it("envia o Bearer token e aplica o cache pedido", async () => {
    const fetchMock = always(() => json({ ok: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await spotifyFetch("/me", "token-123", { schema: anything, revalidate: 60 });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit & { next?: unknown }];
    expect(init.headers).toEqual({ Authorization: "Bearer token-123" });
    expect(init.next).toEqual({ revalidate: 60 });
  });

  it("sem revalidate não usa cache", async () => {
    const fetchMock = always(() => json({}));
    global.fetch = fetchMock as unknown as typeof fetch;
    await spotifyFetch("/me/player", "t", { schema: anything });
    expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].cache).toBe("no-store");
  });

  it("204 e corpo vazio viram null (nada tocando)", async () => {
    global.fetch = always(() => new Response(null, { status: 204 })) as unknown as typeof fetch;
    await expect(getCurrentlyPlaying("t")).resolves.toBeNull();

    global.fetch = always(() => new Response("", { status: 200 })) as unknown as typeof fetch;
    await expect(getCurrentlyPlaying("t")).resolves.toBeNull();
  });

  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [418, "unknown"],
  ])("status %i vira erro '%s' sem novas tentativas", async (status, kind) => {
    const fetchMock = always(() => json({ error: { status } }, { status }));
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(spotifyFetch("/me", "t", { schema: anything })).rejects.toMatchObject({ kind, status });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("retry", () => {
  it("falha transitória (5xx) é repetida e pode se recuperar", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(json({}, { status: 503 }))
      .mockResolvedValueOnce(json({ id: "ok" }));
    global.fetch = fetchMock;

    await expect(spotifyFetch("/me", "t", { schema: anything })).resolves.toEqual({ id: "ok" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("desiste depois de 2 novas tentativas e mantém o tipo do erro", async () => {
    const fetchMock = always(() => json({}, { status: 503 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(spotifyFetch("/me", "t", { schema: anything })).rejects.toMatchObject({ kind: "unavailable" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("timeout e falha de rede têm tipos próprios e também são repetidos", async () => {
    const timeout = jest.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    global.fetch = timeout;
    await expect(spotifyFetch("/me", "t", { schema: anything })).rejects.toMatchObject({ kind: "timeout" });
    expect(timeout).toHaveBeenCalledTimes(3);

    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(spotifyFetch("/me", "t", { schema: anything })).rejects.toMatchObject({ kind: "network" });
  });

  it("rate limit respeita o Retry-After; sem ele, não insiste", () => {
    expect(retryableSpotifyError(new SpotifyApiError("rate_limited", "", 429, 2))).toEqual({ retry: true, afterMs: 2000 });
    expect(retryableSpotifyError(new SpotifyApiError("rate_limited", "", 429))).toEqual({ retry: false });
    expect(retryableSpotifyError(new SpotifyApiError("unauthorized", "", 401))).toEqual({ retry: false });
  });

  it("Retry-After longo demais não segura a requisição do usuário", async () => {
    const fetchMock = always(() => json({}, { status: 429, headers: { "Retry-After": "30" } }));
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(spotifyFetch("/me", "t", { schema: anything })).rejects.toMatchObject({ kind: "rate_limited", retryAfter: 30 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("contrato", () => {
  it("JSON inválido vira invalid_response", async () => {
    global.fetch = always(() => new Response("<html>oops</html>", { status: 200 })) as unknown as typeof fetch;
    await expect(spotifyFetch("/me", "t", { schema: anything })).rejects.toMatchObject({ kind: "invalid_response" });
  });

  it("getTopArtists devolve os itens validados (ou lista vazia)", async () => {
    const items = mockTopArtists("short_term", 2);
    global.fetch = always(() => json({ items, total: 2, limit: 2, offset: 0, next: null })) as unknown as typeof fetch;
    await expect(getTopArtists("t", "short_term", 2)).resolves.toEqual(items);
  });
});
