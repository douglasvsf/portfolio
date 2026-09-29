import { ArrowUpRight } from "@godzilla/icons";
import { Button } from "@godzilla/ui";
import { Reveal } from "@/components/motion/motion";
import type { Project } from "@/content/projects";
import type { ProjectsSectionCopy } from "@/content/types";
import { fmt } from "@/i18n/message";

type HeaderCopy = Pick<ProjectsSectionCopy, "companySite" | "open" | "code" | "personalBadge">;

/**
 * Abertura do case: empresa (ou "Projeto pessoal") · período, título, stack
 * principal e resumo. Profissional leva ao site da empresa; pessoal, ao
 * produto no ar e ao código.
 */
export function ProjectCaseHeader({ project, copy }: { project: Project; copy: HeaderCopy }) {
  const buttonClass = "font-mono hover:border-primary";
  return (
    <Reveal className="flex flex-col gap-5">
      <p className="font-mono text-overline uppercase tracking-widest text-primary">
        {project.company ?? copy.personalBadge}
        <span className="text-muted-foreground"> · {project.period}</span>
      </p>
      <h1 className="text-glow text-h1 font-black leading-tight tracking-tight sm:text-display">{project.title}</h1>
      <p className="font-mono text-body-sm text-muted-foreground">{project.technologies.slice(0, 3).join(" · ")}</p>
      <p className="max-w-3xl text-body-lg text-muted-foreground">{project.summary}</p>
      {(project.companyUrl || project.liveUrl || project.codeUrl) && (
        <div className="flex flex-wrap gap-3">
          {project.companyUrl && (
            <Button asChild variant="outline" size="sm" className={buttonClass}>
              <a href={project.companyUrl} target="_blank" rel="noopener noreferrer">
                {fmt(copy.companySite, { company: project.company ?? "" })}
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          )}
          {project.liveUrl && (
            // Os apps (/erp, /stocks…) têm layout raiz próprio: navegação completa.
            <Button asChild size="sm" className="font-mono">
              <a href={project.liveUrl}>
                {copy.open} {project.title}
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          )}
          {project.codeUrl && (
            <Button asChild variant="outline" size="sm" className={buttonClass}>
              <a href={project.codeUrl} target="_blank" rel="noopener noreferrer">
                {copy.code}
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          )}
        </div>
      )}
    </Reveal>
  );
}
