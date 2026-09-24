import { requestOrigin } from "./request-origin";

const request = (headers: Record<string, string>, url = "http://localhost:3000/api/spotify/login") => ({
  headers: new Headers(headers),
  nextUrl: new URL(url),
});

describe("requestOrigin", () => {
  it("usa o Host que o navegador enviou (127.0.0.1), não o host normalizado do Next", () => {
    expect(requestOrigin(request({ host: "127.0.0.1:3000" }))).toBe("http://127.0.0.1:3000");
  });

  it("atrás de proxy usa x-forwarded-host/proto (primeiro valor)", () => {
    expect(
      requestOrigin(request({ host: "internal:3000", "x-forwarded-host": "douglas-szapak.vercel.app", "x-forwarded-proto": "https,http" })),
    ).toBe("https://douglas-szapak.vercel.app");
  });

  it("sem headers cai para a URL da requisição", () => {
    expect(requestOrigin(request({}))).toBe("http://localhost:3000");
  });
});
