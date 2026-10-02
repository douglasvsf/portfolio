import type { LucideIcon } from "@godzilla/icons";
import { Linkedin, Mail } from "@godzilla/icons";
import { Card } from "@godzilla/ui";
import type { ContactFormCopy, ContactIcon, ContactLink } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { Section, type SectionProps } from "@/components/layout/section";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion";
import { ContactForm } from "./contact-form";

const icons: Record<ContactIcon, LucideIcon> = {
  mail: Mail,
  linkedin: Linkedin,
};

export interface ContactSectionProps extends Omit<SectionProps, "children"> {
  links: ContactLink[];
  form: ContactFormCopy;
  locale: Locale;
}

export function ContactSection({ links, form, locale, ...section }: ContactSectionProps) {
  const email = links.find((link) => link.icon === "mail")?.value ?? "";
  return (
    <Section {...section}>
      <Reveal className="mb-6">
        <ContactForm copy={form} locale={locale} email={email} />
      </Reveal>
      <Stagger as="ul" className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        {links.map((link) => {
          const Icon = icons[link.icon];
          const external = link.href.startsWith("http");
          return (
            <StaggerItem as="li" key={link.href} className="min-w-[220px] flex-1">
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
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
}
