"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { cn } from "@godzilla/ui";
import { MAX_RAGE, type RageState } from "./rage";

// O three.js só é baixado quando a cena vai mesmo aparecer (nunca no servidor nem no celular).
const KaijuScene = dynamic(() => import("./kaiju-scene"), { ssr: false });

/**
 * Caixa da cena, um pouco maior que o palco (a cidade passa das bordas) e com
 * as bordas esmaecidas. A imagem estática e o canvas usam EXATAMENTE a mesma
 * caixa: a imagem é uma captura do primeiro quadro da cena, então a troca de
 * uma pela outra não se percebe.
 */
const SCENE_BOX = "absolute -inset-x-[18%] -inset-y-[10%] [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_78%)]";
/**
 * O canvas é sempre bem mais largo que o palco (o raio precisa atravessar a
 * tela), mas com o kaiju no mesmo lugar: a caixa cresce igual para os dois
 * lados e o centro não muda. Trocar o tamanho do canvas na hora do disparo
 * apagaria o desenho por um instante — por isso só a máscara muda.
 */
const CANVAS_BOX = "absolute -inset-x-[150%] -inset-y-[10%]";
/** Calmo: a mesma elipse esmaecida da imagem estática, recalculada para a caixa larga (troca imperceptível). */
const CANVAS_MASK_CALM = "[mask-image:radial-gradient(24.04%_70.71%_at_center,black_55%,transparent_78%)]";
/** No disparo: só esmaece em cima e embaixo — o raio vai até a borda da tela. */
const CANVAS_MASK_UNLEASHED = "[mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]";

/** Tela grande, sem "reduzir movimento" e com WebGL: só então vale carregar o 3D. */
function canRender3d() {
  if (!window.matchMedia("(min-width: 1024px)").matches) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Palco do kaiju. A imagem estática (children) é o que todo mundo vê primeiro —
 * e o que fica no celular, sem WebGL ou com animações desligadas. No desktop,
 * depois que a página está pronta e ociosa, a cena 3D carrega; quando já
 * desenhou os primeiros quadros, entra no lugar da imagem. Fora da tela, a
 * cena para de renderizar.
 *
 * Também mostra o medidor de fúria: cada clique no kaiju enche um segmento; no
 * último, ele solta o sopro atômico.
 */
export function KaijuStage({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [rage, setRage] = useState<RageState>({ level: 0, phase: "calm" });
  const markReady = useCallback(() => setReady(true), []);
  const unleashed = rage.phase !== "calm";

  useEffect(() => {
    if (!canRender3d()) return;
    const start = () => setEnabled(true);
    const idle = window.requestIdleCallback?.(start, { timeout: 2500 }) ?? window.setTimeout(start, 1200);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !stage.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.05 });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, [enabled]);

  return (
    // Mesma proporção e largura que a ilustração tinha: o layout do topo não muda.
    <div ref={stage} className="relative mx-auto aspect-[900/875] w-full max-w-[520px]">
      <div className={cn(SCENE_BOX, ready && "invisible")}>{children}</div>
      {enabled && (
        <div
          data-testid="kaiju-3d"
          data-ready={ready}
          data-rage={rage.level}
          data-phase={rage.phase}
          className={cn(CANVAS_BOX, unleashed ? CANVAS_MASK_UNLEASHED : CANVAS_MASK_CALM, "pointer-events-auto", !ready && "opacity-0")}
        >
          <KaijuScene active={visible} onReady={markReady} onRage={setRage} />
        </div>
      )}
      {(rage.level > 0 || unleashed) && <RageMeter rage={rage} />}
    </div>
  );
}

/** Dez segmentos que enchem a cada clique, do verde ao azul; no disparo, piscam. */
function RageMeter({ rage }: { rage: RageState }) {
  const filled = rage.phase === "calm" ? rage.level : rage.phase === "cooling" ? 0 : MAX_RAGE;
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 bottom-[3%] z-10 flex justify-center gap-1", rage.phase === "firing" && "animate-pulse")}>
      {Array.from({ length: MAX_RAGE }, (_, index) => {
        const on = index < filled;
        const heat = Math.round((index / (MAX_RAGE - 1)) * 100);
        return (
          <span
            key={index}
            className={cn("h-1.5 w-5 rounded-full transition-colors duration-200", !on && "bg-foreground/15")}
            style={on ? { backgroundColor: `color-mix(in srgb, #52c8ff ${heat}%, #a3ff3c)`, boxShadow: "0 0 8px currentColor" } : undefined}
          />
        );
      })}
    </div>
  );
}
