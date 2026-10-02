import type { Locale } from "@/i18n/config";

/**
 * O que só o currículo tem. Todo o resto (resumo, experiências, skills,
 * projetos) vem do conteúdo do site — o PDF nunca diverge dele.
 * Sem telefone e sem contatos de terceiros: o arquivo é público.
 */
export interface CvCopy {
  /** Rótulo do botão de download. */
  download: string;
  /** Selo no topo da home. */
  availability: string;
  sections: { summary: string; experience: string; projects: string; skills: string; education: string };
  stack: string;
  education: { title: string; place: string; period: string }[];
  /** Rodapé do PDF: "{site}" vira o endereço e "{date}" a data de geração. */
  generated: string;
  page: string;
  fileName: string;
}

export const CV_COPY: Record<Locale, CvCopy> = {
  "pt-BR": {
    download: "Baixar CV",
    availability: "Disponível para oportunidades",
    sections: { summary: "Resumo", experience: "Experiência", projects: "Projetos pessoais", skills: "Skills", education: "Formação" },
    stack: "Stack",
    education: [
      { title: "Análise e Desenvolvimento de Sistemas (ADS)", place: "Cesumar", period: "2018 — 2021" },
      { title: "Bootcamp React / React Native / Node.js", place: "Rocketseat", period: "2018 — 2019" },
      { title: "Inglês avançado", place: "Wizard", period: "2015 — 2017" },
    ],
    generated: "Gerado de {site} em {date}",
    page: "Página",
    fileName: "Douglas-Szapak-CV-pt-BR.pdf",
  },
  "en-US": {
    download: "Download résumé",
    availability: "Open to opportunities",
    sections: { summary: "Summary", experience: "Experience", projects: "Personal projects", skills: "Skills", education: "Education" },
    stack: "Stack",
    education: [
      { title: "Systems Analysis and Development (associate degree)", place: "Cesumar", period: "2018 — 2021" },
      { title: "React / React Native / Node.js bootcamp", place: "Rocketseat", period: "2018 — 2019" },
      { title: "Advanced English", place: "Wizard", period: "2015 — 2017" },
    ],
    generated: "Generated from {site} on {date}",
    page: "Page",
    fileName: "Douglas-Szapak-Resume-en-US.pdf",
  },
  "es-ES": {
    download: "Descargar CV",
    availability: "Disponible para oportunidades",
    sections: { summary: "Resumen", experience: "Experiencia", projects: "Proyectos personales", skills: "Skills", education: "Formación" },
    stack: "Stack",
    education: [
      { title: "Análisis y Desarrollo de Sistemas (ADS)", place: "Cesumar", period: "2018 — 2021" },
      { title: "Bootcamp React / React Native / Node.js", place: "Rocketseat", period: "2018 — 2019" },
      { title: "Inglés avanzado", place: "Wizard", period: "2015 — 2017" },
    ],
    generated: "Generado desde {site} el {date}",
    page: "Página",
    fileName: "Douglas-Szapak-CV-es-ES.pdf",
  },
};
