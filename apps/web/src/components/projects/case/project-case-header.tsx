import { ArrowUpRight } from "@godzilla/icons";
import { Button } from "@godzilla/ui";
import { Reveal } from "@/components/motion/motion";
import type { Project } from "@/content/projects";
import { fmt } from "@/i18n/message";

/** Abertura do case: empresa · período, título, stack principal e resumo. */
export function ProjectCaseHeader({ project, companySiteLabel }: { project: Project; companySiteLabel: string }) {
  return (
    <Reveal className="flex flex-col gap-5">
      <p className="font-mono text-overline uppercase tracking-widest text-primary">
        {project.company}
        <span className="text-muted-foreground"> · {project.period}</span>
      </p>
      <h1 className="text-glow text-h1 font-black leading-tight tracking-tight sm:text-display">{project.title}</h1>
      <p className="font-mono text-body-sm text-muted-foreground">{project.technologies.slice(0, 3).join(" · ")}</p>
      <p className="max-w-3xl text-body-lg text-muted-foreground">{project.summary}</p>
      {project.companyUrl && (
        <div>
          <Button asChild variant="outline" size="sm" className="font-mono hover:border-primary">
            <a href={project.companyUrl} target="_blank" rel="noopener noreferrer">
              {fmt(companySiteLabel, { company: project.company ?? "" })}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </div>
      )}
    </Reveal>
  );
}
