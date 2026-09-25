import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@godzilla/icons";
import { cn } from "@godzilla/ui";
import type { Project } from "@/content/projects";
import type { ProjectsSectionCopy } from "@/content/types";
import { fmt } from "@/i18n/message";
import { ProjectMetrics } from "./project-metric";
import { ProjectTechnologies } from "./project-technology";

/** Dados de card: o projeto sem o texto longo do case (que só a página do case usa). */
export type ProjectCardData = Omit<Project, "case">;

export type ProjectCardCopy = Pick<ProjectsSectionCopy, "viewCase" | "open" | "code" | "companySite" | "personalBadge">;

/**
 * Card base: borda que acende, glow discreto e leve subida no hover (só com
 * movimento permitido). O link principal "estica" sobre o card inteiro —
 * clicar em qualquer ponto abre o destino, sem links aninhados.
 */
const cardClassName = cn(
  "group relative flex h-full flex-col rounded-lg border border-border bg-card text-card-foreground shadow-xs",
  "transition-[transform,border-color,box-shadow] duration-(--duration-base) ease-out",
  "hover:border-primary/60 hover:shadow-[0_0_28px_hsl(var(--primary)/0.12)] motion-safe:hover:-translate-y-1",
  "focus-within:border-primary/60",
);

const stretchedLink = cn(
  "inline-flex items-center gap-1.5 rounded-sm font-mono text-body-sm font-semibold text-primary",
  "after:absolute after:inset-0 after:rounded-lg after:content-['']",
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
);

const secondaryLink = cn(
  "relative z-10 inline-flex items-center gap-1 rounded-sm font-mono text-caption text-muted-foreground",
  "underline-offset-4 transition-colors hover:text-primary hover:underline",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
);

/** Case profissional: empresa, período, problema resolvido, escala e stack. */
export function ProjectCard({ project, copy, caseHref, headingLevel = "h4" }: { project: ProjectCardData; copy: ProjectCardCopy; caseHref: string; headingLevel?: "h3" | "h4" }) {
  const Heading = headingLevel;
  return (
    <article className={cn(cardClassName, "gap-6 p-6 sm:p-8")}>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-mono text-overline uppercase tracking-widest text-primary">{project.company}</p>
          <p className="font-mono text-caption text-muted-foreground">{project.period}</p>
        </div>
        <Heading className="text-h3 font-semibold leading-tight tracking-tight">{project.title}</Heading>
        <p className="max-w-3xl text-body text-muted-foreground">{project.summary}</p>
      </header>

      <ProjectMetrics metrics={project.metrics} />
      <ProjectTechnologies items={project.technologies} />

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        {project.companyUrl ? (
          <a href={project.companyUrl} target="_blank" rel="noopener noreferrer" className={secondaryLink}>
            {fmt(copy.companySite, { company: project.company ?? "" })}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        ) : (
          <span />
        )}
        <Link href={caseHref} className={stretchedLink}>
          {copy.viewCase}
          <span className="sr-only">: {project.title}</span>
          <ArrowRight className="size-(--size-icon-sm) transition-transform duration-(--duration-base) group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}

/** Projeto pessoal: no ar e com código aberto. */
export function PersonalProjectCard({ project, copy, headingLevel = "h4" }: { project: ProjectCardData; copy: ProjectCardCopy; headingLevel?: "h3" | "h4" }) {
  const Heading = headingLevel;
  return (
    <article className={cn(cardClassName, "gap-5 p-6")}>
      <header className="flex flex-col gap-2">
        <p className="font-mono text-caption text-muted-foreground">
          {copy.personalBadge} · {project.period}
        </p>
        <Heading className="text-h4 font-semibold leading-snug">{project.title}</Heading>
        <p className="text-body-sm text-muted-foreground">{project.summary}</p>
      </header>

      <ProjectTechnologies items={project.technologies} />

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        {project.codeUrl ? (
          <a href={project.codeUrl} target="_blank" rel="noopener noreferrer" className={secondaryLink}>
            {copy.code}
            <span className="sr-only">: {project.title}</span>
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        ) : (
          <span />
        )}
        {project.liveUrl && (
          // Outros apps (/stocks, /spotify, /design-system) têm layout raiz próprio: navegação completa.
          <a href={project.liveUrl} className={stretchedLink}>
            {copy.open}
            <span className="sr-only">: {project.title}</span>
            <ArrowUpRight className="size-(--size-icon-sm) transition-transform duration-(--duration-base) group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        )}
      </footer>
    </article>
  );
}
