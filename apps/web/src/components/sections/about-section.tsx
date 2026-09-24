import Image from "next/image";
import { Card, Typography, cn } from "@godzilla/ui";
import type { Fact, Photo } from "@/content/types";
import { Section, type SectionProps } from "@/components/layout/section";

export interface AboutSectionProps extends Omit<SectionProps, "children"> {
  photo?: Photo;
  paragraphs: string[];
  facts: Fact[];
}

export function AboutSection({ photo, paragraphs, facts, ...section }: AboutSectionProps) {
  return (
    <Section {...section}>
      <div className={cn("grid items-start gap-12", photo && "md:grid-cols-[minmax(0,280px)_1fr]")}>
        {photo ? <ProfilePhoto photo={photo} /> : null}

        <div className="flex flex-col gap-4">
          {paragraphs.map((paragraph) => (
            <Typography key={paragraph} variant="body-lg" className="text-muted-foreground">
              {paragraph}
            </Typography>
          ))}
        </div>
      </div>

      <dl className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {facts.map((fact) => (
          <Card key={fact.label} className="p-5">
            <dt className="font-mono text-caption uppercase tracking-wider text-muted-foreground">{fact.label}</dt>
            <dd className="mt-2 text-h4 font-semibold text-primary">{fact.value}</dd>
          </Card>
        ))}
      </dl>
    </Section>
  );
}

export interface ProfilePhotoProps {
  photo: Photo;
  className?: string;
}

/** Foto com moldura neon — o brilho fica atrás da imagem, não sobre ela. */
export function ProfilePhoto({ photo, className }: ProfilePhotoProps) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[280px]", className)}>
      <div className="absolute -inset-3 rounded-xl bg-primary opacity-20 blur-2xl" aria-hidden="true" />
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes="280px"
        priority
        className="relative aspect-square w-full rounded-xl border-2 border-primary object-cover shadow-glow"
      />
    </div>
  );
}
