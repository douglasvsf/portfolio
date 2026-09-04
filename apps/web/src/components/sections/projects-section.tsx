import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { getProjects } from "@/lib/api";

export async function ProjectsSection() {
  const projects = await getProjects();

  return (
    <section id="projetos" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading
        index="03"
        title="Projetos"
        description="Iniciativas que liderei ou das quais fiz parte ao longo da carreira."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {projects.map((project) => (
          <a
            key={project.name}
            href={project.link ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-4 rounded-lg border border-border bg-bg-elevated p-6 transition-colors hover:border-accent"
          >
            <h3 className="text-lg font-semibold group-hover:text-accent">
              {project.name}
            </h3>
            <p className="flex-1 text-sm text-muted">{project.description}</p>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
