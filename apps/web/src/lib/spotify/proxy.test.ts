import { NextRequest } from "next/server";
import { spotifySessionProxy } from "./proxy";
import { SESSION_COOKIE, sealSession, unsealSession } from "./session";

const SECRET = "secret";
const originalEnv = process.env;
const originalFetch = global.fetch;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    SPOTIFY_CLIENT_ID: "id",
    SPOTIFY_CLIENT_SECRET: SECRET,
    SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3000/api/spotify/callback",
  };
});

afterEach(() => {
  process.env = originalEnv;
  global.fetch = originalFetch;
});

function requestWith(session?: { accessToken: string; refreshToken: string; expiresAt: number } | string) {
  const request = new NextRequest("http://127.0.0.1:3000/spotify/dashboard");
  if (session) request.cookies.set(SESSION_COOKIE, typeof session === "string" ? session : sealSession(session, SECRET));
  return request;
}

describe("spotifySessionProxy — renovação do token antes da página renderizar", () => {
  it("sem cookie ou com token ainda válido, segue sem tocar em nada", async () => {
    global.fetch = jest.fn();
    expect((await spotifySessionProxy(requestWith())).cookies.getAll()).toEqual([]);
    expect(
      (await spotifySessionProxy(requestWith({ accessToken: "at", refreshToken: "rt", expiresAt: Date.now() + 3_600_000 }))).cookies.getAll(),
    ).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("token expirando: renova e grava o novo cookie (cifrado)", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: "novo", token_type: "Bearer", scope: "", expires_in: 3600 })),
    );
    const response = await spotifySessionProxy(requestWith({ accessToken: "velho", refreshToken: "rt", expiresAt: Date.now() }));

    const cookie = response.cookies.get(SESSION_COOKIE);
    expect(cookie?.httpOnly).toBe(true);
    expect(unsealSession(cookie?.value, SECRET)).toMatchObject({ accessToken: "novo", refreshToken: "rt" });
  });

  it("refresh revogado encerra a sessão", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response('{"error":"invalid_grant"}', { status: 400 }));
    const response = await spotifySessionProxy(requestWith({ accessToken: "velho", refreshToken: "rt", expiresAt: Date.now() }));
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBe("");
  });

  it("falha temporária (rede) mantém a sessão para a página mostrar o erro amigável", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    const response = await spotifySessionProxy(requestWith({ accessToken: "velho", refreshToken: "rt", expiresAt: Date.now() }));
    expect(response.cookies.get(SESSION_COOKIE)).toBeUndefined();
  });

  it("cookie adulterado é apagado", async () => {
    const response = await spotifySessionProxy(requestWith("lixo"));
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBe("");
  });
});
