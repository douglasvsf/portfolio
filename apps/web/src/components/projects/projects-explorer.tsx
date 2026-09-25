"use client";

import { useState, type ReactNode } from "react";
import { Stagger, StaggerItem } from "@/components/motion/motion";
import type { ProjectCategory, ProjectDiscipline } from "@/content/projects";
import type { ProjectsSectionCopy } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { PersonalProjectCard, ProjectCard, type ProjectCardData } from "./project-card";
import { ProjectFilters, type FilterOption } from "./project-filters";
import { ProjectTimeline, ProjectTimelineItem } from "./project-timeline";

type Filter = "all" | ProjectCategory | ProjectDiscipline;

const matches = (project: ProjectCardData, filter: Filter) =>
  filter === "all" || project.category === filter || project.discipline === filter;

const CATEGORIES: ProjectCategory[] = ["professional", "personal"];
const DISCIPLINES: ProjectDiscipline[] = ["frontend", "backend", "fullstack"];

/**
 * Filtros + listas. Os projetos chegam prontos do servidor (sem o texto longo
 * dos cases); aqui só se decide o que mostrar. Filtros de área só aparecem
 * quando há pelo menos um projeto naquela área.
 */
export function ProjectsExplorer({ projects, copy, locale }: { projects: ProjectCardData[]; copy: ProjectsSectionCopy; locale: Locale }) {
  const [filter, setFilter] = useState<Filter>("all");

  const count = (value: Filter) => projects.filter((project) => matches(project, value)).length;
  const options: FilterOption<Filter>[] = [
    { value: "all", label: copy.filters.all, count: projects.length },
    ...CATEGORIES.map((value) => ({ value, label: copy.filters[value], count: count(value) })),
    ...DISCIPLINES.map((value) => ({ value, label: copy.filters[value], count: count(value) })).filter((option) => option.count > 0),
  ];

  const visible = projects.filter((project) => matches(project, filter));
  const professional = visible.filter((project) => project.category === "professional");
  const personal = visible.filter((project) => project.category === "personal");

  return (
    <div className="flex flex-col gap-12">
      <ProjectFilters label={copy.filtersLabel} options={options} value={filter} onChange={setFilter} />

      {/* key: trocar o filtro remonta a lista e reanima a entrada dos cards. */}
      <div key={filter} className="flex flex-col gap-16" aria-live="polite">
        {professional.length > 0 && (
          <ProjectGroup title={copy.groups.professional.title} description={copy.groups.professional.description}>
            <ProjectTimeline>
              {professional.map((project) => (
                <ProjectTimelineItem key={project.id}>
                  <ProjectCard project={project} copy={copy} caseHref={`/${locale}/projetos/${project.id}`} />
                </ProjectTimelineItem>
              ))}
            </ProjectTimeline>
          </ProjectGroup>
        )}

        {personal.length > 0 && (
          <ProjectGroup title={copy.groups.personal.title} description={copy.groups.personal.description}>
            <Stagger as="ul" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {personal.map((project) => (
                <StaggerItem as="li" key={project.id}>
                  <PersonalProjectCard project={project} copy={copy} />
                </StaggerItem>
              ))}
            </Stagger>
          </ProjectGroup>
        )}

        {visible.length === 0 && <p className="text-body text-muted-foreground">{copy.empty}</p>}
      </div>
    </div>
  );
}

function ProjectGroup({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6" aria-label={title}>
      <div className="flex items-center gap-4">
        <h3 className="shrink-0 font-mono text-overline uppercase tracking-widest text-primary">{title}</h3>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
      {description && <p className="-mt-3 text-body-sm text-muted-foreground">{description}</p>}
      {children}
    </section>
  );
}
