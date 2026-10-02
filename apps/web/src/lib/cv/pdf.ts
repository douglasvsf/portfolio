import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { SITE_URL } from "@/config/site";
import { getContent } from "@/content";
import { CV_COPY } from "@/content/cv";
import { getProjects } from "@/content/projects";
import { CONTACT, REPO_URL } from "@/content/shared";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/message";

/**
 * Currículo em PDF, gerado do mesmo conteúdo do site (nunca diverge dele).
 *
 * PDF de verdade, com texto selecionável — sistemas de recrutamento (ATS)
 * conseguem ler — e links clicáveis. Layout sóbrio de uma coluna, em A4, com
 * as fontes padrão do PDF (Helvetica): arquivo pequeno e que abre em qualquer
 * leitor. Sem telefone nem contato de terceiros: o arquivo é público.
 */

const PAGE = { width: 595.28, height: 841.89 } as const;
const MARGIN = { x: 48, top: 52, bottom: 48 } as const;
const WIDTH = PAGE.width - MARGIN.x * 2;

const INK = rgb(0.09, 0.09, 0.11);
const MUTED = rgb(0.38, 0.4, 0.43);
/** Verde do site, escurecido para ter contraste no papel branco. */
const ACCENT = rgb(0.2, 0.45, 0.02);
const RULE = rgb(0.82, 0.84, 0.86);

/** As fontes padrão do PDF só conhecem o alfabeto latino (WinAnsi): o que não existe nelas vira um equivalente. */
const REPLACEMENTS: Record<string, string> = { "→": "->", "←": "<-", "≥": ">=", "≤": "<=", "✓": "", " ": " ", "‑": "-", "≈": "~" };

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

interface TextStyle {
  font: PDFFont;
  size: number;
  color?: ReturnType<typeof rgb>;
  /** Altura da linha em relação ao tamanho da fonte. */
  leading?: number;
}

/** Cursor de escrita: sabe onde está na página e abre uma nova quando falta espaço. */
class Writer {
  page: PDFPage;
  y = PAGE.height - MARGIN.top;
  readonly pages: PDFPage[] = [];

  constructor(
    private readonly pdf: PDFDocument,
    private readonly fonts: Fonts,
  ) {
    this.page = this.addPage();
  }

  private addPage() {
    const page = this.pdf.addPage([PAGE.width, PAGE.height]);
    this.pages.push(page);
    this.page = page;
    this.y = PAGE.height - MARGIN.top;
    return page;
  }

  /** Garante `height` pontos livres; se não houver, continua na próxima página. */
  ensure(height: number) {
    if (this.y - height < MARGIN.bottom) this.addPage();
  }

  space(height: number) {
    this.y -= height;
  }

  /** Troca caracteres que a fonte não tem (a Helvetica do PDF não conhece setas, por exemplo). */
  clean(text: string, font: PDFFont) {
    const known = new Set(font.getCharacterSet());
    return [...text].map((char) => (known.has(char.codePointAt(0)!) ? char : (REPLACEMENTS[char] ?? ""))).join("");
  }

  private wrap(text: string, style: TextStyle, width: number) {
    const lines: string[] = [];
    let line = "";
    for (const word of this.clean(text, style.font).split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && style.font.widthOfTextAtSize(candidate, style.size) > width) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    if (line) lines.push(line);
    return lines;
  }

  /** Parágrafo com quebra automática. `indent` desloca o texto (para marcadores). */
  text(text: string, style: TextStyle, { indent = 0, bullet }: { indent?: number; bullet?: string } = {}) {
    const lineHeight = style.size * (style.leading ?? 1.38);
    const lines = this.wrap(text, style, WIDTH - indent);
    lines.forEach((line, index) => {
      this.ensure(lineHeight);
      this.y -= lineHeight;
      if (bullet && index === 0) this.page.drawText(bullet, { x: MARGIN.x + indent - 9, y: this.y, size: style.size, font: this.fonts.regular, color: ACCENT });
      this.page.drawText(line, { x: MARGIN.x + indent, y: this.y, size: style.size, font: style.font, color: style.color ?? INK });
    });
  }

  /** Texto à esquerda e outro alinhado à direita na primeira linha (cargo × período). O da esquerda quebra se não couber. */
  row(left: string, leftStyle: TextStyle, right: string, rightStyle: TextStyle) {
    const lineHeight = leftStyle.size * 1.4;
    const rightText = this.clean(right, rightStyle.font);
    const rightWidth = rightStyle.font.widthOfTextAtSize(rightText, rightStyle.size);
    const lines = this.wrap(left, leftStyle, WIDTH - rightWidth - (rightWidth ? 14 : 0));
    this.ensure(lineHeight * lines.length);
    lines.forEach((line, index) => {
      this.y -= lineHeight;
      this.page.drawText(line, { x: MARGIN.x, y: this.y, size: leftStyle.size, font: leftStyle.font, color: leftStyle.color ?? INK });
      if (index === 0) this.page.drawText(rightText, { x: PAGE.width - MARGIN.x - rightWidth, y: this.y, size: rightStyle.size, font: rightStyle.font, color: rightStyle.color ?? MUTED });
    });
  }

  /** Título de seção: maiúsculas em verde com um fio embaixo. Não fica sozinho no fim da página. */
  section(title: string) {
    this.ensure(70);
    this.y -= 22;
    this.page.drawText(this.clean(title.toUpperCase(), this.fonts.bold), { x: MARGIN.x, y: this.y, size: 9.5, font: this.fonts.bold, color: ACCENT });
    this.y -= 5;
    this.page.drawLine({ start: { x: MARGIN.x, y: this.y }, end: { x: PAGE.width - MARGIN.x, y: this.y }, thickness: 0.6, color: RULE });
    this.y -= 3;
  }

  /** Vários links na mesma linha, separados por "·", cada um clicável. */
  links(items: { label: string; url: string }[], style: TextStyle) {
    const lineHeight = style.size * 1.5;
    this.ensure(lineHeight);
    this.y -= lineHeight;
    let x = MARGIN.x;
    items.forEach((item, index) => {
      if (index > 0) {
        this.page.drawText("·", { x: x + 5, y: this.y, size: style.size, font: style.font, color: MUTED });
        x += 14;
      }
      const label = this.clean(item.label, style.font);
      const width = style.font.widthOfTextAtSize(label, style.size);
      this.page.drawText(label, { x, y: this.y, size: style.size, font: style.font, color: style.color ?? INK });
      const annotation = this.pdf.context.register(
        this.pdf.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [x, this.y - 2, x + width, this.y + style.size],
          Border: [0, 0, 0],
          A: { Type: "Action", S: "URI", URI: PDFString.of(item.url) },
        }),
      );
      this.page.node.addAnnot(annotation);
      x += width;
    });
  }
}

const withoutProtocol = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** Monta o currículo do idioma pedido. `now` é a data de geração (rodapé e metadados). */
export async function buildCvPdf(locale: Locale, now = new Date()): Promise<Uint8Array> {
  const content = getContent(locale);
  const copy = CV_COPY[locale];
  const site = new URL(`/${locale}`, SITE_URL).toString();
  const github = REPO_URL.split("/").slice(0, 4).join("/");
  // "Douglas Szapak — Engenheiro de Software Full Stack Sênior" → só o cargo.
  const jobTitle = content.meta.title.split(" — ")[1] ?? content.hero.subtitle;

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${content.footer.owner} — ${jobTitle}`);
  pdf.setAuthor(content.footer.owner);
  pdf.setSubject(content.meta.description);
  pdf.setKeywords(content.skills.groups.flatMap((group) => group.items).slice(0, 30));
  pdf.setLanguage(locale);
  pdf.setCreationDate(now);
  pdf.setModificationDate(now);
  pdf.catalog.set(PDFName.of("ViewerPreferences"), pdf.context.obj({ DisplayDocTitle: true }));

  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };
  const body: TextStyle = { font: fonts.regular, size: 9.6 };
  const small: TextStyle = { font: fonts.regular, size: 8.6, color: MUTED };
  const out = new Writer(pdf, fonts);

  // ---- Cabeçalho ---------------------------------------------------------------
  out.text(content.footer.owner, { font: fonts.bold, size: 24, leading: 1.1 });
  out.space(2);
  out.text(jobTitle, { font: fonts.regular, size: 12, color: ACCENT });
  out.links(
    [
      { label: CONTACT.email, url: `mailto:${CONTACT.email}` },
      { label: CONTACT.linkedinLabel, url: CONTACT.linkedinUrl },
      { label: withoutProtocol(github), url: github },
      { label: withoutProtocol(site), url: site },
    ],
    { font: fonts.regular, size: 8.8, color: MUTED },
  );

  // ---- Resumo: quem é (1º parágrafo) e como trabalha (último) -----------------------
  out.section(copy.sections.summary);
  const paragraphs = content.about.paragraphs;
  for (const paragraph of [paragraphs[0], paragraphs.at(-1)].filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index)) {
    out.text(paragraph, body);
    out.space(3);
  }

  // ---- Experiência -----------------------------------------------------------------
  out.section(copy.sections.experience);
  for (const job of content.experience.items) {
    out.ensure(62);
    out.space(4);
    out.row(`${job.role} — ${job.company}`, { font: fonts.bold, size: 10.4 }, job.period, { font: fonts.regular, size: 9, color: MUTED });
    if (job.location) out.text(job.location, small);
    out.space(2);
    out.text(job.description, body);
    for (const highlight of job.highlights ?? []) out.text(highlight, body, { indent: 12, bullet: "•" });
    if (job.technologies?.length) {
      out.space(1.5);
      out.text(`${copy.stack}: ${job.technologies.join(", ")}`, { font: fonts.italic, size: 8.6, color: MUTED });
    }
    out.space(5);
  }

  // ---- Projetos pessoais (no ar, com código aberto) ---------------------------------
  const personal = getProjects(locale).filter((project) => project.category === "personal");
  if (personal.length) {
    out.section(copy.sections.projects);
    for (const project of personal) {
      out.ensure(40);
      out.space(4);
      const url = project.liveUrl ? new URL(project.liveUrl, SITE_URL).toString() : project.codeUrl;
      out.row(project.title, { font: fonts.bold, size: 10 }, url ? withoutProtocol(url) : "", { font: fonts.regular, size: 8.4, color: MUTED });
      out.text(project.summary, body);
      out.text(`${copy.stack}: ${project.technologies.join(", ")}`, { font: fonts.italic, size: 8.6, color: MUTED });
    }
  }

  // ---- Skills ----------------------------------------------------------------------
  out.section(copy.sections.skills);
  for (const group of content.skills.groups) {
    out.space(3);
    out.text(group.category, { font: fonts.bold, size: 9.4 });
    out.text(group.items.join(" · "), body);
  }

  // ---- Formação --------------------------------------------------------------------
  out.section(copy.sections.education);
  for (const item of copy.education) {
    out.space(3);
    out.row(`${item.title} — ${item.place}`, { font: fonts.regular, size: 9.6 }, item.period, { font: fonts.regular, size: 9, color: MUTED });
  }

  // ---- Rodapé de cada página ---------------------------------------------------------
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "America/Sao_Paulo" }).format(now);
  const generated = out.clean(fmt(copy.generated, { site: withoutProtocol(site), date }), fonts.regular);
  out.pages.forEach((page, index) => {
    const number = `${copy.page} ${index + 1}/${out.pages.length}`;
    page.drawText(generated, { x: MARGIN.x, y: 26, size: 7.6, font: fonts.regular, color: MUTED });
    page.drawText(number, { x: PAGE.width - MARGIN.x - fonts.regular.widthOfTextAtSize(number, 7.6), y: 26, size: 7.6, font: fonts.regular, color: MUTED });
  });

  return pdf.save();
}
