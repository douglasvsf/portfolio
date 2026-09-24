import { getOwnerAccessToken, isOwnerConfigured, resetOwnerTokenCache } from "./owner";

const originalFetch = global.fetch;
const originalEnv = process.env;

const tokenResponse = (accessToken: string) =>
  new Response(JSON.stringify({ access_token: accessToken, token_type: "Bearer", scope: "", expires_in: 3600 }));

beforeEach(() => {
  resetOwnerTokenCache();
  process.env = {
    ...originalEnv,
    SPOTIFY_CLIENT_ID: "id",
    SPOTIFY_CLIENT_SECRET: "secret",
    SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3000/api/spotify/callback",
    SPOTIFY_OWNER_REFRESH_TOKEN: "owner-refresh",
  };
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env = originalEnv;
  jest.restoreAllMocks();
});

describe("modo vitrine (dono)", () => {
  it("só fica disponível com as credenciais e o refresh token do dono", () => {
    expect(isOwnerConfigured()).toBe(true);
    expect(isOwnerConfigured({ ...process.env, SPOTIFY_OWNER_REFRESH_TOKEN: "" })).toBe(false);
    expect(isOwnerConfigured({ SPOTIFY_OWNER_REFRESH_TOKEN: "x" } as unknown as NodeJS.ProcessEnv)).toBe(false);
  });

  it("troca o refresh token do dono por um access token e reaproveita enquanto é válido", async () => {
    const fetchMock = jest.fn().mockResolvedValue(tokenResponse("access-1"));
    global.fetch = fetchMock;

    await expect(getOwnerAccessToken()).resolves.toBe("access-1");
    await expect(getOwnerAccessToken()).resolves.toBe("access-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new URLSearchParams(fetchMock.mock.calls[0][1].body).get("refresh_token")).toBe("owner-refresh");
  });

  it("chamadas simultâneas compartilham o mesmo refresh", async () => {
    const fetchMock = jest.fn().mockResolvedValue(tokenResponse("access-1"));
    global.fetch = fetchMock;

    await Promise.all([getOwnerAccessToken(), getOwnerAccessToken(), getOwnerAccessToken()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renova quando o token está perto de expirar", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(tokenResponse("access-1")).mockResolvedValueOnce(tokenResponse("access-2"));

    await expect(getOwnerAccessToken()).resolves.toBe("access-1");
    await expect(getOwnerAccessToken(Date.now() + 3600 * 1000)).resolves.toBe("access-2");
  });

  it("propaga a falha (a fonte de dados cai para o demo mockado)", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response('{"error":"invalid_grant"}', { status: 400 }));
    await expect(getOwnerAccessToken()).rejects.toMatchObject({ kind: "unauthorized" });
  });
});
