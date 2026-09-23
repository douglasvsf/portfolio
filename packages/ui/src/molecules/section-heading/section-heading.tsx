import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Typography } from "../../atoms/typography/typography";

export interface SectionHeadingProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Numeração exibida acima do título, no estilo de comentário (`// 01`). */
  index?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Nível semântico do título (o visual é sempre o de h2). @default "h2" */
  as?: "h1" | "h2" | "h3";
  /** Id do título — útil para `aria-labelledby` na <section>. */
  titleId?: string;
}

export function SectionHeading({
  index,
  title,
  description,
  as = "h2",
  titleId,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-12 flex flex-col gap-3", className)} {...props}>
      {index ? (
        <span className="font-mono text-body-sm text-primary" aria-hidden="true">{`// ${index}`}</span>
      ) : null}
      <Typography variant="h2" as={as} id={titleId} className="text-h3 sm:text-h2">
        {title}
      </Typography>
      {description ? (
        <Typography variant="body" className="max-w-2xl text-muted-foreground">
          {description}
        </Typography>
      ) : null}
    </div>
  );
}
