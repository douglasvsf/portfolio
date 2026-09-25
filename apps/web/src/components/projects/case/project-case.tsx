import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@godzilla/icons";
import { cn } from "@godzilla/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion";
import type { Project } from "@/content/projects";
import type { ProjectsSectionCopy } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { ProjectMetrics } from "../project-metric";
import { ProjectTechnologies } from "../project-technology";
import { ProjectArchitecture } from "./project-architecture";
import { ProjectCaseHeader } from "./project-case-header";

interface ProjectCaseProps {
  project: Project & { case: NonNullable<Project["case"]> };
  copy: ProjectsSectionCopy;
  locale: Locale;
  previous?: Project;
  next?: Project;
}

/**
 * Página de case. Conteúdo à esquerda (contexto → decisões); à direita, fixo
 * no desktop, a ficha técnica: stack e escala. No mobile a ficha vem logo
 * depois do cabeçalho. Seções sem informação real (ex.: resultado) não aparecem.
 */
export function ProjectCase({ project, copy, locale, previous, next }: ProjectCaseProps) {
  const { case: story } = project;
  const labels = copy.case;

  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 sm:py-24">
      <Link
        href={`/${locale}#projects`}
        className="inline-flex w-fit items-center gap-2 rounded-sm font-mono text-body-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <ArrowLeft className="size-(--size-icon-sm)" aria-hidden="true" />
        {labels.back}
      </Link>

      <ProjectCaseHeader project={project} companySiteLabel={copy.companySite} />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
        <aside className="flex flex-col gap-8 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <CaseBlock title={labels.stack}>
            <ProjectTechnologies items={project.technologies} label={labels.stack} />
          </CaseBlock>
          {project.metrics.length > 0 && (
            <CaseBlock title={labels.scale}>
              <ProjectMetrics metrics={project.metrics} className="grid-cols-2 sm:grid-cols-2" />
            </CaseBlock>
          )}
        </aside>

        <div className="flex flex-col gap-12">
          <CaseBlock title={labels.context}>
            <p className="text-body-lg text-muted-foreground">{story.context}</p>
          </CaseBlock>

          <CaseBlock title={labels.challenge}>
            <p className="text-body-lg text-muted-foreground">{story.challenge}</p>
          </CaseBlock>

          <CaseBlock title={labels.role}>
            <Stagger as="ul" stagger={0.05} className="flex flex-col gap-3">
              {story.role.map((item) => (
                <StaggerItem as="li" key={item} className="flex gap-3 text-body text-muted-foreground">
                  <span className="font-mono text-primary" aria-hidden="true">
                    ▹
                  </span>
                  {item}
                </StaggerItem>
              ))}
            </Stagger>
          </CaseBlock>

          <CaseBlock title={labels.architecture} hint={labels.architectureHint}>
            <ProjectArchitecture nodes={story.architecture} />
          </CaseBlock>

          {story.result && (
            <CaseBlock title={labels.result}>
              <p className="border-l-2 border-primary pl-4 text-body-lg text-foreground">{story.result}</p>
            </CaseBlock>
          )}

          <CaseBlock title={labels.decisions}>
            <Stagger as="ul" className="grid gap-4 sm:grid-cols-2">
              {story.decisions.map((decision) => (
                <StaggerItem as="li" key={decision.title} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
                  <h3 className="text-body font-semibold text-foreground">{decision.title}</h3>
                  <p className="text-body-sm text-muted-foreground">{decision.description}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </CaseBlock>
        </div>
      </div>

      <CaseNavigation locale={locale} previous={previous} next={next} labels={labels} />
    </article>
  );
}

/** Bloco com rótulo no estilo terminal (`// Contexto`), mesmo tom do `// 03` das seções. */
function CaseBlock({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Reveal>
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="font-mono text-overline uppercase tracking-widest text-primary">
            <span aria-hidden="true">{"// "}</span>
            {title}
          </h2>
          {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
        </header>
        {children}
      </section>
    </Reveal>
  );
}

function CaseNavigation({ locale, previous, next, labels }: { locale: Locale; previous?: Project; next?: Project; labels: ProjectsSectionCopy["case"] }) {
  if (!previous && !next) return null;
  const linkClass = cn(
    "group flex flex-col gap-1 rounded-lg border border-border bg-card p-5 transition-colors duration-(--duration-base)",
    "hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  );
  return (
    <nav aria-label={`${labels.previous} / ${labels.next}`} className="grid gap-4 border-t border-border pt-10 sm:grid-cols-2">
      {previous ? (
        <Link href={`/${locale}/projetos/${previous.id}`} className={linkClass}>
          <span className="inline-flex items-center gap-2 font-mono text-caption text-muted-foreground">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {labels.previous}
          </span>
          <span className="font-semibold group-hover:text-primary">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={`/${locale}/projetos/${next.id}`} className={cn(linkClass, "sm:items-end sm:text-right")}>
          <span className="inline-flex items-center gap-2 font-mono text-caption text-muted-foreground">
            {labels.next}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
          <span className="font-semibold group-hover:text-primary">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
