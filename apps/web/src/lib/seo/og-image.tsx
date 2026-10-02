import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Imagem de compartilhamento (Open Graph): o cartão que aparece quando alguém
 * cola o link no LinkedIn, WhatsApp, Slack ou X. Gerada por código, no build,
 * com a identidade do site — fundo escuro, verde neon, a fonte Geist e o kaiju.
 *
 * O motor que desenha (satori) não usa as fontes do navegador nem lê WebP:
 * por isso as fontes ficam em arquivo (lib/seo/fonts) e o kaiju em PNG.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const NEON = "#a3ff3c";
const BACKGROUND = "#08090a";

/**
 * Caminhos escritos por extenso (nada montado em tempo de execução): assim o
 * empacotador sabe exatamente quais 4 arquivos a rota precisa, em vez de levar
 * o projeto inteiro junto.
 */
const loadAssets = () =>
  Promise.all([
    readFile(join(process.cwd(), "src/lib/seo/fonts/geist-sans-latin-900-normal.woff")),
    readFile(join(process.cwd(), "src/lib/seo/fonts/geist-sans-latin-400-normal.woff")),
    readFile(join(process.cwd(), "src/lib/seo/fonts/geist-mono-latin-500-normal.woff")),
    readFile(join(process.cwd(), "public/images/og-kaiju.png")),
  ]);

interface OgContent {
  /** Linha pequena no topo, em tom de terminal (ex.: "$ whoami"). */
  eyebrow: string;
  /** Texto principal; "\n" quebra a linha. */
  title: string;
  subtitle: string;
  /** Pílulas no rodapé (tecnologias ou números). */
  tags?: string[];
}

export async function renderOgImage({ eyebrow, title, subtitle, tags = [] }: OgContent) {
  const [black, regular, mono, kaiju] = await loadAssets();
  const lines = title.split("\n");
  // Título longo (nome de case) precisa de corpo menor para caber em duas linhas.
  const longest = Math.max(...lines.map((line) => line.length));
  const titleSize = longest <= 9 ? 124 : longest <= 14 ? 84 : longest <= 22 ? 66 : 54;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: BACKGROUND,
          // Grade discreta e um clarão verde atrás do kaiju, como no topo do site.
          backgroundImage: `radial-gradient(circle at 82% 52%, rgba(163,255,60,0.26), rgba(163,255,60,0) 40%), linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 48px 48px, 48px 48px",
          color: "#f4f4f5",
          fontFamily: "Geist",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- o satori só entende <img> */}
        <img src={`data:image/png;base64,${kaiju.toString("base64")}`} alt="" width={540} height={278} style={{ position: "absolute", right: -30, bottom: 96 }} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", width: "100%", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", fontFamily: "Geist Mono", fontSize: 26, letterSpacing: 2 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: NEON, marginRight: 14 }} />
            GODZILLA<span style={{ color: NEON }}>.DEV</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 660 }}>
            <div style={{ fontFamily: "Geist Mono", fontSize: 26, color: NEON, marginBottom: 14 }}>{eyebrow}</div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: titleSize, fontWeight: 900, lineHeight: 0.98, letterSpacing: -2, textShadow: "0 0 34px rgba(163,255,60,0.45)" }}>
              {lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
            <div style={{ fontFamily: "Geist Mono", fontSize: 25, color: "#a1a1aa", marginTop: 22 }}>{subtitle}</div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Geist Mono", fontSize: 22, color: "#d4d4d8" }}>
            {tags.map((tag) => (
              <div key={tag} style={{ display: "flex", padding: "8px 18px", marginRight: 12, borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", backgroundColor: "rgba(8,9,10,0.75)" }}>
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: black, weight: 900, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
