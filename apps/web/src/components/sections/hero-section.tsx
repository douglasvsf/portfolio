import { Button, Typography } from "@godzilla/ui";
import type { LinkItem } from "@/content/types";

export interface HeroSectionProps {
  id: string;
  /** Linha de "terminal" acima do título. */
  prompt: string;
  title: string;
  subtitle: string;
  description: string;
  primaryCta: LinkItem;
  secondaryCta?: LinkItem;
}

export function HeroSection({ id, prompt, title, subtitle, description, primaryCta, secondaryCta }: HeroSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden border-b border-border"
    >
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-25 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-24">
        <span className="font-mono text-body-sm text-primary">{prompt}</span>

        <Typography
          variant="display"
          id={`${id}-title`}
          className="text-glow text-6xl font-black sm:text-8xl"
        >
          {title}
        </Typography>

        <Typography variant="body-lg" className="font-mono text-muted-foreground sm:text-h4">
          {subtitle}
        </Typography>

        <Typography variant="body" className="max-w-xl text-muted-foreground">
          {description}
        </Typography>

        <div className="mt-4 flex flex-wrap gap-4">
          <Button asChild size="lg" className="font-mono font-semibold hover:shadow-glow">
            <a href={primaryCta.href}>{primaryCta.label}</a>
          </Button>
          {secondaryCta ? (
            <Button asChild size="lg" variant="outline" className="font-mono font-semibold hover:border-primary">
              <a href={secondaryCta.href}>{secondaryCta.label}</a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="kaiju-divider absolute bottom-0 h-6 w-full bg-primary/60" aria-hidden="true" />
    </section>
  );
}
