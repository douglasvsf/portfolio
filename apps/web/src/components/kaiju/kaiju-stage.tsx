"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { cn } from "@godzilla/ui";

// O three.js só é baixado quando a cena vai mesmo aparecer (nunca no servidor nem no celular).
const KaijuScene = dynamic(() => import("./kaiju-scene"), { ssr: false });

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
 * Palco do kaiju. A imagem (children) é o que todo mundo vê primeiro — e o que
 * fica no celular, sem WebGL ou com animações desligadas. No desktop, depois
 * que a página está pronta e ociosa, a cena 3D carrega por cima e a imagem some.
 * Fora da tela, a cena para de renderizar.
 */
export function KaijuStage({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const markReady = useCallback(() => setReady(true), []);

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
    <div ref={stage} className="relative">
      <div className={cn("transition-opacity duration-700", ready && "opacity-0")}>{children}</div>
      {enabled && (
        <div
          data-testid="kaiju-3d"
          data-ready={ready}
          className={cn(
            "pointer-events-auto absolute -inset-x-[18%] -inset-y-[10%] opacity-0 transition-opacity duration-700",
            // Some nas bordas: os prédios não são cortados pelo retângulo do canvas.
            "[mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_78%)]",
            ready && "opacity-100",
          )}
        >
          <KaijuScene active={visible} onReady={markReady} />
        </div>
      )}
    </div>
  );
}
