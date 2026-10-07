import { buildBrCode, crc16, parseBrCode } from "./brcode";
import { assertSafeUrl, isPublicAddress, safeLookup, safePost } from "./safe-http";
import { signPayload, verifySignature } from "./signature";

describe("BR Code do Pix", () => {
  const input = { pixKey: "2c7a8f0e-6b0e-4b5e-9a62-0f5d1f3f8a11", amountCents: 12_345, merchantName: "Loja Kaiju 1234", merchantCity: "São Paulo", txid: "ABC123XYZ" };

  it("CRC16-CCITT bate com o vetor de teste padrão", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("monta os campos do padrão EMV, com valor, recebedor e txid, e fecha com CRC válido", () => {
    const code = buildBrCode(input);
    const { fields, crcValid } = parseBrCode(code);
    expect(crcValid).toBe(true);
    expect(fields).toMatchObject({ "00": "01", "01": "12", "52": "0000", "53": "986", "54": "123.45", "58": "BR", "59": "LOJA KAIJU 1234", "60": "SAO PAULO" });
    expect(fields["26"]).toBe(`0014br.gov.bcb.pix0136${input.pixKey}`);
    expect(fields["62"]).toBe("0509ABC123XYZ");
    expect(code.slice(-8, -4)).toBe("6304");
  });

  it("qualquer caractere alterado invalida o CRC", () => {
    const code = buildBrCode(input);
    expect(parseBrCode(code.replace("123.45", "923.45")).crcValid).toBe(false);
  });

  it("descrição sem acento e cortada para caber no campo; txid fora do padrão é recusado", () => {
    const { fields } = parseBrCode(buildBrCode({ ...input, description: "Pedido nº 42 — café ".repeat(10) }));
    expect(fields["26"]!.length).toBeLessThanOrEqual(99);
    expect(fields["26"]).toMatch(/02\d{2}PEDIDO N 42 CAFE/);
    expect(() => buildBrCode({ ...input, txid: "com-hifen" })).toThrow();
    expect(() => buildBrCode({ ...input, txid: "A".repeat(26) })).toThrow();
  });
});

describe("assinatura dos webhooks", () => {
  const secret = "whsec_teste";
  const body = JSON.stringify({ id: "evt", type: "charge.paid" });

  it("o mesmo segredo confere; corpo, segredo ou horário diferentes, não", () => {
    const now = 1_800_000_000;
    const header = signPayload(secret, body, now);
    expect(header).toMatch(/^t=1800000000,v1=[a-f0-9]{64}$/);
    expect(verifySignature(secret, body, header, now + 10)).toBe(true);
    expect(verifySignature(secret, body.replace("paid", "refunded"), header, now)).toBe(false);
    expect(verifySignature("outro", body, header, now)).toBe(false);
    expect(verifySignature(secret, body, header, now + 301)).toBe(false); // reenvio velho demais
    expect(verifySignature(secret, body, undefined, now)).toBe(false);
    expect(verifySignature(secret, body, "t=abc,v1=", now)).toBe(false);
  });
});

describe("proteção contra SSRF no envio de webhooks", () => {
  it("só endereços públicos passam", () => {
    for (const address of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) expect(isPublicAddress(address)).toBe(true);
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.0.10",
      "169.254.169.254", // metadados da nuvem
      "100.64.0.1",
      "0.0.0.0",
      "224.0.0.1",
      "::1",
      "fe80::1",
      "fd00::1",
      "::ffff:127.0.0.1",
      "::ffff:169.254.169.254",
      "não é ip",
    ])
      expect(isPublicAddress(address)).toBe(false);
  });

  it("URL precisa ser https, na porta 443, sem credencial e sem host interno", () => {
    expect(assertSafeUrl("https://example.com/webhook").hostname).toBe("example.com");
    for (const url of [
      "http://example.com/hook",
      "https://example.com:8443/hook",
      "https://user:pass@example.com/hook",
      "https://127.0.0.1/hook",
      "https://[::1]/hook",
      "https://169.254.169.254/latest/meta-data",
      "https://localhost/hook",
      "https://api.localhost/hook",
      "https://metadata.google.internal/",
      "ftp://example.com",
      "não é url",
    ])
      expect(() => assertSafeUrl(url)).toThrow();
  });

  it("domínio que resolve para IP interno é recusado na hora da conexão", (done) => {
    safeLookup("localhost", {}, (error) => {
      expect(error?.message).toMatch(/endereço interno/);
      done();
    });
  });

  it("o envio para destino proibido não sai e vira erro registrado, sem exceção", async () => {
    await expect(safePost("http://example.com", "{}", {})).resolves.toMatchObject({ statusCode: null, error: "use uma URL https://" });
    await expect(safePost("https://127.0.0.1/x", "{}", {})).resolves.toMatchObject({ statusCode: null, error: "endereço interno não é aceito" });
  });
});
