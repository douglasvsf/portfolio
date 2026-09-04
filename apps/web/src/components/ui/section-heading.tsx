interface SectionHeadingProps {
  index: string;
  title: string;
  description?: string;
}

export function SectionHeading({ index, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-12 flex flex-col gap-3">
      <span className="font-mono text-sm text-accent">{`// ${index}`}</span>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description ? (
        <p className="max-w-2xl text-muted">{description}</p>
      ) : null}
    </div>
  );
}
