import type { HTMLAttributes, ReactNode } from "react";
import { SectionHeading, cn } from "@godzilla/ui";
import { Reveal } from "@/components/motion/motion";

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Âncora da seção (usada pelo menu: `#${id}`). */
  id: string;
  /** Numeração exibida acima do título (`// 01`). */
  index?: string;
  title: ReactNode;
  description?: ReactNode;
  /** `muted` destaca a seção com uma faixa de fundo — alterne para ritmo visual. */
  tone?: "default" | "muted";
  children: ReactNode;
}

export function Section({ id, index, title, description, tone = "default", className, children, ...props }: SectionProps) {
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn("scroll-mt-16", tone === "muted" && "border-t border-border bg-card/40", className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <SectionHeading index={index} title={title} description={description} titleId={titleId} />
        </Reveal>
        {children}
      </div>
    </section>
  );
}
