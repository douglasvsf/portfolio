"use client";

import { useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "@godzilla/icons";
import { Button } from "@godzilla/ui";
import { NOT_FOUND_COPY } from "@/content/not-found";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { fmt } from "@/i18n/message";

/** O idioma vem do começo do endereço (/en-US/...); sem prefixo válido, pt-BR. */
export function localeFromPath(pathname: string | null): Locale {
  const first = pathname?.split("/")[1] ?? "";
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

const noopSubscribe = () => () => {};

/** false no HTML do servidor e na hidratação; true logo depois, já no navegador. */
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

type NotFoundViewProps = {
  /**
   * A 404 global é gerada uma vez no build (em /_not-found), sem saber qual
   * endereço falhou. Nesse caso a hidratação usa o mesmo HTML estático (idioma
   * padrão) e só depois troca para o endereço real — senão o texto do servidor
   * diverge do cliente e o React quebra a hidratação (erro #418).
   */
  prerendered?: boolean;
};

/**
 * 404 do portfólio: mesma identidade do site (grade, verde, kaiju), o endereço
 * que falhou em tom de terminal e o caminho de volta para a home no idioma certo.
 */
export function NotFoundView({ prerendered = false }: NotFoundViewProps) {
  const currentPath = usePathname();
  const hydrated = useHydrated();
  const pathname = prerendered && !hydrated ? null : currentPath;
  const locale = localeFromPath(pathname);
  const copy = NOT_FOUND_COPY[locale];
  const home = `/${locale}`;

  // A página global não passa pelo layout do idioma: acerta o lang para leitores de tela.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <main id="content" className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden="true" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <Link href={home} className="flex items-center gap-2 font-mono text-body-sm font-semibold tracking-wider hover:text-primary">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          <span>
            GODZILLA<span className="text-primary">.DEV</span>
          </span>
        </Link>
      </header>

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-16 lg:grid-cols-[1fr_auto]">
        <div className="flex max-w-2xl flex-col gap-6">
          <p className="font-mono text-body-sm text-muted-foreground">
            <span className="text-primary">$</span> {fmt(copy.command, { path: pathname ?? "/" })}
          </p>
          <p className="text-glow font-mono text-[clamp(5rem,18vw,11rem)] font-black leading-none tracking-tighter text-primary" aria-hidden="true">
            404
          </p>
          <h1 className="text-h1 font-black leading-tight tracking-tight">{copy.title}</h1>
          <p className="text-body-lg text-muted-foreground">{copy.lead}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="font-mono font-semibold hover:shadow-glow">
              <Link href={home}>
                <ArrowLeft aria-hidden="true" />
                {copy.home}
              </Link>
            </Button>
            <Link href={`${home}#projects`} className="font-mono text-body-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
              {copy.projects}
            </Link>
            <Link href={`${home}#contact`} className="font-mono text-body-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
              {copy.contact}
            </Link>
          </div>
        </div>

        <div className="pointer-events-none relative hidden select-none lg:block" aria-hidden="true">
          <div className="absolute inset-[15%] rounded-full bg-primary opacity-20 blur-[90px]" />
          <Image src="/images/godzilla-hero.webp" alt="" width={900} height={875} draggable={false} sizes="380px" className="relative w-[380px] opacity-80 grayscale-[35%]" />
        </div>
      </div>
    </main>
  );
}
