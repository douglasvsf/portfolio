"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation, useScroll, useSpring, type Variants } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@godzilla/ui";

/**
 * Animações de entrada ao rolar a página (Motion).
 *
 * - `LazyMotion` + componentes `m.*` carregam só o pacote de animações DOM
 *   (~15 KB), não a biblioteca inteira.
 * - `reducedMotion="user"`: quem desligou animações no sistema vê tudo
 *   estático (acessibilidade).
 * - Cada bloco anima uma vez só, quando entra na tela.
 * - O hero fica de fora: título e imagem são o LCP — escondê-los para animar
 *   pioraria o carregamento.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;
/**
 * Anima quando o topo do bloco passa de 10% acima da borda inferior da tela;
 * só na primeira vez. (Uma fração do elemento — ex.: 20% — não serve para
 * listas altas: no celular, 4 cards empilhados exigiriam ~560px visíveis antes
 * de qualquer card aparecer.)
 */
const VIEWPORT = { once: true, amount: "some", margin: "0px 0px -10% 0px" } as const;

/** `custom` = atraso em segundos (o transition da variante tem prioridade sobre a prop). */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay } }),
};

/** Surge de baixo para cima ao entrar na tela. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={fadeUp}
      custom={delay}
      inherit={false}
    >
      {children}
    </m.div>
  );
}

const container = (stagger: number): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
});

type ListTag = "ul" | "ol" | "dl" | "div";

/**
 * Lista/grade cujos itens (`StaggerItem`) aparecem em cascata. Mantém a
 * semântica: renderiza o `ul`/`ol`/`dl`/`div` original.
 */
export function Stagger({ as = "div", children, className, stagger = 0.08 }: { as?: ListTag; children: ReactNode; className?: string; stagger?: number }) {
  // inherit=false: listas aninhadas (métricas dentro de um card que também anima) decidem sozinhas
  // quando aparecer — sem isso, o estado "hidden" do pai podia sobrescrever o da lista filha.
  const props = { className, initial: "hidden", whileInView: "visible", viewport: VIEWPORT, variants: container(stagger), inherit: false, children };
  if (as === "ul") return <m.ul {...props} />;
  if (as === "ol") return <m.ol {...props} />;
  if (as === "dl") return <m.dl {...props} />;
  return <m.div {...props} />;
}

export function StaggerItem({ as = "div", children, className }: { as?: "li" | "div"; children: ReactNode; className?: string }) {
  return as === "li" ? (
    <m.li className={className} variants={fadeUp}>
      {children}
    </m.li>
  ) : (
    <m.div className={className} variants={fadeUp}>
      {children}
    </m.div>
  );
}

/** Barra fina no topo que acompanha a rolagem da página. */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <m.div
      aria-hidden="true"
      style={{ scaleX }}
      className={cn("fixed inset-x-0 top-0 z-(--z-modal) h-0.5 origin-left bg-primary shadow-glow", className)}
    />
  );
}
