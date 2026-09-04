export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden border-b border-border"
    >
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "var(--color-accent)" }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-24">
        <span className="font-mono text-sm text-accent">$ whoami</span>

        <h1 className="text-glow text-6xl font-black tracking-tight sm:text-8xl">
          GODZILLA
        </h1>

        <p className="font-mono text-lg text-muted sm:text-xl">Full Stack Developer</p>

        <p className="max-w-xl text-muted">
          Portfolio pessoal construído com uma stack moderna, mostrando projetos,
          experiência e forma de trabalhar. Em constante evolução — assim como um kaiju
          que nunca para de crescer.
        </p>

        <div className="mt-4 flex flex-wrap gap-4">
          <a
            href="#projetos"
            className="rounded-md bg-accent px-6 py-3 font-mono text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
          >
            Ver projetos
          </a>
          <a
            href="#sobre"
            className="rounded-md border border-border-strong px-6 py-3 font-mono text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Sobre mim
          </a>
        </div>
      </div>

      <div className="kaiju-divider absolute bottom-0 h-6 w-full bg-accent/60" />
    </section>
  );
}
