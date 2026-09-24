import { sealSession } from "./session";
import { resetOwnerTokenCache } from "./owner";

// cookies() do Next é trocado por um Map controlado pelo teste.
const cookieJar = new Map<string, string>();
jest.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined) }),
}));

const originalEnv = process.env;
const originalFetch = global.fetch;
const SECRET = "secret";

const tokenResponse = (accessToken: string) =>
  new Response(JSON.stringify({ access_token: accessToken, token_type: "Bearer", scope: "", expires_in: 3600 }));

/** `getSpotifySource` é memoizado por request (React.cache) — cada teste carrega o módulo do zero. */
async function resolveSource() {
  let source: Awaited<ReturnType<typeof import("./source").getSpotifySource>> = null;
  await jest.isolateModulesAsync(async () => {
    const mod = await import("./source");
    source = await mod.getSpotifySource();
  });
  return source as Awaited<ReturnType<typeof import("./source").getSpotifySource>>;
}

beforeEach(() => {
  cookieJar.clear();
  resetOwnerTokenCache();
  process.env = {
    ...originalEnv,
    SPOTIFY_CLIENT_ID: "id",
    SPOTIFY_CLIENT_SECRET: SECRET,
    SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3000/api/spotify/callback",
    MOCK_MODE: undefined,
    SPOTIFY_OWNER_REFRESH_TOKEN: undefined,
    LASTFM_API_KEY: undefined,
  };
});

afterEach(() => {
  process.env = originalEnv;
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe("getSpotifySource — qual fonte de dados atende o visitante", () => {
  it("sem sessão nem demo não há fonte (a página redireciona para a landing)", async () => {
    expect(await resolveSource()).toBeNull();
  });

  it("MOCK_MODE força o demo para todo mundo", async () => {
    process.env.MOCK_MODE = "true";
    expect((await resolveSource())?.mode).toBe("demo");
  });

  it("?data=mock usa sempre o mock, mesmo com a vitrine configurada", async () => {
    process.env.SPOTIFY_OWNER_REFRESH_TOKEN = "owner";
    cookieJar.set("gss_demo", "mock");
    expect((await resolveSource())?.mode).toBe("demo");
  });

  it("explorar sem login abre a vitrine do dono quando configurada", async () => {
    process.env.SPOTIFY_OWNER_REFRESH_TOKEN = "owner";
    global.fetch = jest.fn().mockResolvedValue(tokenResponse("owner-access"));
    cookieJar.set("gss_demo", "1");
    expect((await resolveSource())?.mode).toBe("showcase");
  });

  it("se o token do dono falhar, a vitrine cai para o demo em vez de quebrar", async () => {
    process.env.SPOTIFY_OWNER_REFRESH_TOKEN = "revoked";
    global.fetch = jest.fn().mockResolvedValue(new Response('{"error":"invalid_grant"}', { status: 400 }));
    jest.spyOn(console, "warn").mockImplementation(() => {});
    cookieJar.set("gss_demo", "1");
    expect((await resolveSource())?.mode).toBe("demo");
  });

  it("usuário do Last.fm válido tem prioridade; inválido é ignorado", async () => {
    process.env.LASTFM_API_KEY = "key";
    cookieJar.set("gss_lastfm", "rj");
    expect((await resolveSource())?.mode).toBe("lastfm");

    cookieJar.set("gss_lastfm", "<script>");
    expect(await resolveSource()).toBeNull();
  });

  it("sessão válida vira a conta do próprio visitante", async () => {
    cookieJar.set("gss_session", sealSession({ accessToken: "at", refreshToken: "rt", expiresAt: Date.now() + 3_600_000 }, SECRET));
    expect((await resolveSource())?.mode).toBe("live");
  });

  it("sessão expirando é renovada em memória; refresh revogado encerra", async () => {
    cookieJar.set("gss_session", sealSession({ accessToken: "old", refreshToken: "rt", expiresAt: Date.now() }, SECRET));
    global.fetch = jest.fn().mockResolvedValue(tokenResponse("new"));
    expect((await resolveSource())?.mode).toBe("live");

    global.fetch = jest.fn().mockResolvedValue(new Response('{"error":"invalid_grant"}', { status: 400 }));
    expect(await resolveSource()).toBeNull();
  });

  it("cookie de sessão adulterado é descartado", async () => {
    cookieJar.set("gss_session", "adulterado");
    expect(await resolveSource()).toBeNull();
  });
});
