import { Badge, cn } from "@godzilla/ui";

/**
 * Tecnologias de um projeto como tags do Design System. Dentro de um card com
 * `group`, ganham destaque sutil no hover do card.
 */
export function ProjectTechnologies({ items, label, className }: { items: string[]; label?: string; className?: string }) {
  return (
    <ul aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <li key={item}>
          <ProjectTechnology name={item} />
        </li>
      ))}
    </ul>
  );
}

export function ProjectTechnology({ name }: { name: string }) {
  return (
    <Badge variant="tag" className="transition-colors duration-(--duration-base) group-hover:border-primary/40 group-hover:text-foreground">
      {name}
    </Badge>
  );
}
