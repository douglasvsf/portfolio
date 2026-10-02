import { inflateSync } from "node:zlib";
import { PDFDocument } from "pdf-lib";
import { getContent } from "@/content";
import { CV_COPY } from "@/content/cv";
import { locales } from "@/i18n/config";
import { buildCvPdf } from "./pdf";

const NOW = new Date("2026-10-02T12:00:00Z");

/**
 * Texto que está de fato desenhado nas páginas. O conteúdo de cada página fica
 * num fluxo comprimido (Flate) e cada trecho de texto é gravado em hexadecimal:
 * descomprime, decodifica e junta — é o que um leitor de currículos (ATS) lê.
 */
function pageText(bytes: Uint8Array) {
  const raw = Buffer.from(bytes);
  let text = "";
  let cursor = 0;
  // As fontes padrão do PDF usam a codificação WinAnsi (Windows-1252): é ela que decodifica "—", "ç", "ã"…
  const winAnsi = new TextDecoder("windows-1252");
  for (;;) {
    const start = raw.indexOf("stream", cursor, "latin1");
    if (start < 0) break;
    const end = raw.indexOf("endstream", start, "latin1");
    // Depois de "stream" vem uma quebra de linha (LF ou CR LF) antes dos dados.
    const data = start + 6 + (raw[start + 6] === 13 ? 2 : 1);
    try {
      const content = inflateSync(raw.subarray(data, end)).toString("latin1");
      for (const [, hex] of content.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) text += `${winAnsi.decode(Buffer.from(hex!, "hex"))} `;
    } catch {
      // não é um fluxo comprimido de página (fonte, metadados…)
    }
    cursor = end + 9;
  }
  return text;
}

describe("currículo em PDF", () => {
  it.each(locales)("%s: PDF válido, em A4, com título, idioma e autor", async (locale) => {
    const bytes = await buildCvPdf(locale, NOW);
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");

    const pdf = await PDFDocument.load(bytes);
    const content = getContent(locale);
    expect(pdf.getTitle()).toContain("Douglas Szapak");
    expect(pdf.getTitle()).toContain(content.meta.title.split(" — ")[1]);
    expect(pdf.getAuthor()).toBe("Douglas Szapak");
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(pdf.getPageCount()).toBeLessThanOrEqual(3);
    const { width, height } = pdf.getPage(0).getSize();
    expect([Math.round(width), Math.round(height)]).toEqual([595, 842]);
  });

  it("links clicáveis no cabeçalho: e-mail, LinkedIn, GitHub e o site", async () => {
    const pdf = await PDFDocument.load(await buildCvPdf("pt-BR", NOW));
    const raw = Buffer.from(await pdf.save({ useObjectStreams: false })).toString("latin1");
    for (const target of ["mailto:doug.szapak@gmail.com", "linkedin.com/in/", "https://github.com/douglasvsf", "/pt-BR"]) expect(raw).toContain(target);
  });

  it("o texto das páginas traz nome, cargo, experiências e formação do site", async () => {
    const text = pageText(await buildCvPdf("pt-BR", NOW));
    const content = getContent("pt-BR");
    expect(text).toContain("Douglas Szapak");
    expect(text).toContain("EXPERIÊNCIA");
    // O travessão e as aspas curvas ficam na faixa 0x80–0x9F do WinAnsi, que o TextDecoder do Jest não mapeia: compara sem eles.
    const plain = (value: string) => value.replace(/[\u0080-\u009f–—]/g, "").replace(/\s+/g, " ");
    for (const job of content.experience.items) expect(plain(text)).toContain(plain(job.period));
    expect(text).toContain("Inoa");
    expect(text).toContain("Cesumar");
    expect(text).toContain("GODZILLA ERP");
  });

  it("é público: sem telefone e sem contato de terceiros", async () => {
    for (const locale of locales) {
      const text = pageText(await buildCvPdf(locale, NOW));
      expect(text.length).toBeGreaterThan(2000);
      expect(text).not.toMatch(/99819|hotmail|naian|dygufa|hebert/i);
    }
  });

  it("todo idioma tem os textos do currículo e nome de arquivo próprio", () => {
    const keys = Object.keys(CV_COPY["pt-BR"]).sort();
    for (const locale of locales) {
      expect(Object.keys(CV_COPY[locale]).sort()).toEqual(keys);
      expect(CV_COPY[locale].fileName).toMatch(new RegExp(`${locale}\\.pdf$`));
      expect(CV_COPY[locale].education).toHaveLength(3);
    }
  });
});
