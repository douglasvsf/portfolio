import { Section, type SectionProps } from "@/components/layout/section";
import { Reveal } from "@/components/motion/motion";
import { getProjects, getSnapshot, type Project } from "@/content/projects";
import type { ProjectsSectionCopy } from "@/content/types";
import type { Locale } from "@/i18n/config";
import type { ProjectCardData } from "./project-card";
import { ProjectSnapshot } from "./project-snapshot";
import { ProjectsExplorer } from "./projects-explorer";

export interface ProjectsSectionProps extends Omit<SectionProps, "children">, ProjectsSectionCopy {
  locale: Locale;
}

/** Tira o texto longo do case: o cliente só recebe o que o card mostra. */
function toCard(project: Project): ProjectCardData {
  const card: ProjectCardData & { case?: unknown } = { ...project };
  delete card.case;
  return card;
}

/**
 * Seção Projetos (Server Component): monta os dados no servidor e entrega ao
 * cliente só o necessário para os cards — o texto longo dos cases fica nas
 * páginas /[lang]/projetos/[slug].
 */
export function ProjectsSection({ locale, id, index, title, description, tone, className, ...copy }: ProjectsSectionProps) {
  const cards = getProjects(locale).map(toCard);

  return (
    <Section id={id} index={index} title={title} description={description} tone={tone} className={className}>
      <div className="flex flex-col gap-12">
        <Reveal>
          <ProjectSnapshot label={copy.snapshotLabel} items={getSnapshot(locale)} />
        </Reveal>
        <ProjectsExplorer projects={cards} copy={copy} locale={locale} />
      </div>
    </Section>
  );
}
