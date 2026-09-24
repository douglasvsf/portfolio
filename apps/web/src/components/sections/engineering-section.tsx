import {
  Activity,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  CodeXml,
  FileCheck2,
  FlaskConical,
  GitBranch,
  Globe,
  Lock,
  Palette,
  RefreshCw,
  type LucideIcon,
} from "@godzilla/icons";
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@godzilla/ui";
import { Section, type SectionProps } from "@/components/layout/section";
import type { EngineeringItem, EngineeringKey, Fact, LinkItem } from "@/content/types";

const ICONS: Record<EngineeringKey, LucideIcon> = {
  monorepo: Boxes,
  designSystem: Palette,
  ci: GitBranch,
  tests: FlaskConical,
  contracts: FileCheck2,
  resilience: RefreshCw,
  observability: Activity,
  security: Lock,
  i18n: Globe,
};

export interface EngineeringSectionProps extends Omit<SectionProps, "children"> {
  pipelineLabel: string;
  pipeline: string[];
  stats: Fact[];
  items: EngineeringItem[];
  codeLabel: string;
  repoCta: LinkItem;
  actionsCta: LinkItem;
}

/**
 * "Por trás deste site": as práticas de engenharia do próprio portfólio,
 * cada uma com link para o código que a comprova.
 */
export function EngineeringSection({
  pipelineLabel,
  pipeline,
  stats,
  items,
  codeLabel,
  repoCta,
  actionsCta,
  ...section
}: EngineeringSectionProps) {
  return (
    <Section {...section}>
      <dl className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex flex-col-reverse gap-2 p-5">
            <dt className="text-body-sm text-muted-foreground">{stat.label}</dt>
            <dd className="font-mono text-h3 font-semibold text-primary">{stat.value}</dd>
          </Card>
        ))}
      </dl>

      <Pipeline label={pipelineLabel} steps={pipeline} />

      <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.key}>
            <EngineeringCard item={item} codeLabel={codeLabel} />
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline">
          <a href={repoCta.href} target="_blank" rel="noopener noreferrer">
            <CodeXml aria-hidden="true" />
            {repoCta.label}
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={actionsCta.href} target="_blank" rel="noopener noreferrer">
            <GitBranch aria-hidden="true" />
            {actionsCta.label}
          </a>
        </Button>
      </div>
    </Section>
  );
}

/** Os jobs do CI, no visual de terminal do site. Rodam em paralelo, então não há setas entre eles. */
function Pipeline({ label, steps }: { label: string; steps: string[] }) {
  return (
    <figure className="mt-6 rounded-lg border border-border bg-card p-5 font-mono">
      <figcaption className="text-caption text-muted-foreground">
        <span className="text-primary">$ git push</span> <span aria-hidden="true">→</span> {label}
      </figcaption>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-body-sm">
            <CheckCircle2 className="size-(--size-icon-sm) shrink-0 text-success" aria-hidden="true" />
            {step}
          </li>
        ))}
      </ol>
    </figure>
  );
}

function EngineeringCard({ item, codeLabel }: { item: EngineeringItem; codeLabel: string }) {
  const Icon = ICONS[item.key];
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-4">
        <span className="flex size-10 items-center justify-center rounded-md border border-border bg-background text-primary">
          <Icon className="size-(--size-icon-md)" aria-hidden="true" />
        </span>
        <CardTitle as="h3" className="text-h4 leading-snug">
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <CardDescription>{item.description}</CardDescription>
        <ul className="mt-auto flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="tag">{tag}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-body-sm text-primary underline-offset-4 hover:underline"
        >
          {codeLabel}
          <span className="sr-only">: {item.title}</span>
          <ArrowUpRight className="size-(--size-icon-sm)" aria-hidden="true" />
        </a>
      </CardFooter>
    </Card>
  );
}
