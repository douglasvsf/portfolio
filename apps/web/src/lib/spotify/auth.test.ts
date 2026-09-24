import { buildAuthorizeUrl, exchangeCodeForToken, getSpotifyConfig, refreshAccessToken, SpotifyConfigError } from "./auth";
import { codeChallengeFor, decrypt, encrypt, generateCodeVerifier } from "./crypto";
import { SpotifyApiError } from "./errors";
import { isExpiring, sealSession, sessionFromToken, unsealSession } from "./session";

const config = { clientId: "client-id", clientSecret: "super-secret", redirectUri: "http://127.0.0.1:3000/api/spotify/callback" };
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe("getSpotifyConfig", () => {
  it("lê as variáveis de ambiente", () => {
    expect(
      getSpotifyConfig({ SPOTIFY_CLIENT_ID: "a", SPOTIFY_CLIENT_SECRET: "b", SPOTIFY_REDIRECT_URI: "c" } as unknown as NodeJS.ProcessEnv),
    ).toEqual({ clientId: "a", clientSecret: "b", redirectUri: "c" });
  });

  it("aponta todas as variáveis ausentes", () => {
    expect(() => getSpotifyConfig({} as NodeJS.ProcessEnv)).toThrow(SpotifyConfigError);
    expect(() => getSpotifyConfig({} as NodeJS.ProcessEnv)).toThrow(/SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI/);
  });
});

describe("PKCE", () => {
  it("gera verifier no tamanho da RFC 7636 e challenge S256 em base64url", () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    // Vetor de teste do apêndice B da RFC 7636.
    expect(codeChallengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("monta a URL de autorização só com os scopes necessários", () => {
    const url = new URL(buildAuthorizeUrl(config, { state: "xyz", codeChallenge: "challenge" }));
    expect(url.origin + url.pathname).toBe("https://accounts.spotify.com/authorize");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "client-id",
      response_type: "code",
      redirect_uri: config.redirectUri,
      scope: "user-top-read user-read-recently-played user-read-currently-playing user-read-playback-state",
      state: "xyz",
      code_challenge_method: "S256",
      code_challenge: "challenge",
    });
    expect(url.toString()).not.toContain("super-secret");
  });
});

describe("troca de tokens", () => {
  it("envia code_verifier e autenticação Basic", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: "at", token_type: "Bearer", scope: "", expires_in: 3600, refresh_token: "rt" })),
    );
    global.fetch = fetchMock;

    await expect(exchangeCodeForToken(config, "the-code", "the-verifier")).resolves.toMatchObject({ access_token: "at" });

    const [, init] = fetchMock.mock.calls[0];
    const body = new URLSearchParams(init.body);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code_verifier")).toBe("the-verifier");
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from("client-id:super-secret").toString("base64")}`);
  });

  it("refresh token revogado vira erro 'unauthorized'", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response('{"error":"invalid_grant"}', { status: 400 }));
    await expect(refreshAccessToken(config, "old")).rejects.toMatchObject({ kind: "unauthorized" });
  });

  it("falha de rede vira erro 'network'", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(refreshAccessToken(config, "rt")).rejects.toBeInstanceOf(SpotifyApiError);
    await expect(refreshAccessToken(config, "rt")).rejects.toMatchObject({ kind: "network" });
  });
});

describe("sessão cifrada", () => {
  it("cifra e decifra com a mesma chave", () => {
    const session = sessionFromToken({ access_token: "at", token_type: "Bearer", scope: "", expires_in: 3600, refresh_token: "rt" }, undefined, 0);
    const sealed = sealSession(session, "secret");
    expect(sealed).not.toContain("at");
    expect(unsealSession(sealed, "secret")).toEqual({ accessToken: "at", refreshToken: "rt", expiresAt: 3_600_000 });
  });

  it("rejeita cookie adulterado ou cifrado com outra chave", () => {
    const sealed = encrypt({ accessToken: "at", refreshToken: "rt", expiresAt: 1 }, "secret");
    expect(unsealSession(sealed, "other-secret")).toBeNull();
    expect(unsealSession(`${sealed.slice(0, -4)}AAAA`, "secret")).toBeNull();
    expect(unsealSession("lixo", "secret")).toBeNull();
    expect(decrypt(undefined, "secret")).toBeNull();
  });

  it("mantém o refresh token anterior quando a Spotify não envia um novo", () => {
    const previous = { accessToken: "old", refreshToken: "keep-me", expiresAt: 0 };
    const next = sessionFromToken({ access_token: "new", token_type: "Bearer", scope: "", expires_in: 3600 }, previous, 0);
    expect(next.refreshToken).toBe("keep-me");
  });

  it("considera expirando com menos de 1 minuto de validade", () => {
    expect(isExpiring({ accessToken: "a", refreshToken: "r", expiresAt: 30_000 }, 0)).toBe(true);
    expect(isExpiring({ accessToken: "a", refreshToken: "r", expiresAt: 600_000 }, 0)).toBe(false);
  });
});
