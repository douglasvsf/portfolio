import type { LucideIcon } from "@godzilla/icons";
import { Linkedin, Mail } from "@godzilla/icons";
import { Card } from "@godzilla/ui";
import type { ContactIcon, ContactLink } from "@/content/types";
import { Section, type SectionProps } from "@/components/layout/section";

const icons: Record<ContactIcon, LucideIcon> = {
  mail: Mail,
  linkedin: Linkedin,
};

export interface ContactSectionProps extends Omit<SectionProps, "children"> {
  links: ContactLink[];
}

export function ContactSection({ links, ...section }: ContactSectionProps) {
  return (
    <Section {...section}>
      <ul className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        {links.map((link) => {
          const Icon = icons[link.icon];
          const external = link.href.startsWith("http");
          return (
            <li key={link.href} className="min-w-[220px] flex-1">
              <a
                href={link.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group block h-full rounded-lg"
              >
                <Card className="flex h-full items-center gap-4 p-5 transition-colors duration-(--duration-base) group-hover:border-primary">
                  <Icon className="size-(--size-icon-lg) shrink-0 text-primary" aria-hidden="true" />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
                      {link.label}
                    </span>
                    <span className="truncate font-medium">{link.value}</span>
                  </span>
                </Card>
              </a>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
