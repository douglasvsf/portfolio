import type { Project } from "@portfolio/shared";
import { Badge, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cn } from "@godzilla/ui";
import { ExternalLink } from "@godzilla/icons";
import { Section, type SectionProps } from "@/components/layout/section";
import { Stagger, StaggerItem } from "@/components/motion/motion";

export interface ProjectsSectionProps extends Omit<SectionProps, "children"> {
  items: Project[];
}

export function ProjectsSection({ items, ...section }: ProjectsSectionProps) {
  return (
    <Section {...section}>
      <Stagger as="ul" className="grid gap-6 md:grid-cols-2">
        {items.map((project) => (
          <StaggerItem as="li" key={project.name}>
            <ProjectCard project={project} />
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

export interface ProjectCardProps {
  project: Project;
  className?: string;
}

/** Card de projeto. Com `link`, o card inteiro vira um link externo. */
export function ProjectCard({ project, className }: ProjectCardProps) {
  const card = (
    <Card
      className={cn(
        "group flex h-full flex-col transition-colors duration-(--duration-base)",
        project.link && "hover:border-primary",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3 text-h4 leading-snug group-hover:text-primary">
          {project.name}
          {project.link ? <ExternalLink className="mt-1 size-(--size-icon-sm) shrink-0" aria-hidden="true" /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription>{project.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        {project.tags.map((tag) => (
          <Badge key={tag} variant="tag">
            {tag}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );

  return project.link ? (
    <a href={project.link} target="_blank" rel="noopener noreferrer" className="block h-full rounded-lg">
      {card}
    </a>
  ) : (
    card
  );
}
