import Image from "next/image";
import { Button, Typography } from "@godzilla/ui";
import { KaijuStage } from "@/components/kaiju/kaiju-stage";
import type { LinkItem } from "@/content/types";

export interface HeroSectionProps {
  id: string;
  /** Linha de "terminal" acima do título. */
  prompt: string;
  /** Nome em destaque; cada palavra ocupa uma linha. */
  title: string;
  subtitle: string;
  /** Linha discreta que explica o tema kaiju do site. */
  fanNote: string;
  description: string;
  primaryCta: LinkItem;
  secondaryCta?: LinkItem;
}

export function HeroSection({ id, prompt, title, subtitle, fanNote, description, primaryCta, secondaryCta }: HeroSectionProps) {
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

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="relative z-10 flex flex-col gap-6">
          <span className="font-mono text-body-sm text-primary">{prompt}</span>

          {/* Marca, não texto corrido: não "pinta" de azul ao selecionar a página. */}
          <Typography variant="display" id={`${id}-title`} className="text-glow select-none text-6xl font-black uppercase sm:text-8xl">
            {title.split(" ").map((word) => (
              <span key={word} className="block">
                {word}{" "}
              </span>
            ))}
          </Typography>

          <Typography variant="body-lg" className="font-mono text-muted-foreground sm:text-h4">
            {subtitle}
          </Typography>

          <Typography variant="body" className="max-w-xl text-muted-foreground">
            {description}
          </Typography>

          <p className="flex max-w-xl items-start gap-2 font-mono text-body-sm text-muted-foreground">
            <span className="text-primary" aria-hidden="true">
              {"//"}
            </span>
            {fanNote}
          </p>

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

        {/*
         * O kaiju: ao lado do texto no desktop; no mobile vira fundo decorativo
         * (canto inferior, transparente) para não empurrar o conteúdo. Uma única
         * imagem — só a posição muda com o breakpoint.
         */}
        <div
          className="pointer-events-none absolute -right-16 bottom-4 w-72 select-none opacity-25 sm:w-96 lg:relative lg:right-auto lg:bottom-auto lg:w-auto lg:opacity-100"
          aria-hidden="true"
        >
          <div className="absolute inset-[15%] hidden rounded-full bg-primary opacity-20 blur-[90px] lg:block" />
          {/*
           * A imagem é uma captura do primeiro quadro da cena 3D (mesmo enquadramento):
           * no desktop, quando a cena carrega, entra no lugar dela sem que se perceba.
           */}
          <KaijuStage>
            <Image src="/images/kaiju-poster.webp" alt="" fill priority draggable={false} sizes="(min-width: 1024px) 710px, 520px" />
          </KaijuStage>
        </div>
      </div>

      <div className="kaiju-divider absolute bottom-0 h-6 w-full bg-primary/60" aria-hidden="true" />
    </section>
  );
}
