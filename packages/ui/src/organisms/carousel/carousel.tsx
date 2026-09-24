"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "@godzilla/icons";
import { useTranslation } from "@godzilla/i18n";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/button/button";

/*
 * Carousel — port do componente do shadcn/ui (Embla Carousel), com os
 * rótulos acessíveis vindos do i18n do Design System e indicadores (dots).
 */

type CarouselApi = UseEmblaCarouselType[1];
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];

interface CarouselContextValue {
  carouselRef: UseEmblaCarouselType[0];
  api: CarouselApi;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  selectedIndex: number;
  snapCount: number;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

export function useCarousel() {
  const context = useContext(CarouselContext);
  if (!context) throw new Error("useCarousel precisa estar dentro de <Carousel />");
  return context;
}

export interface CarouselProps extends HTMLAttributes<HTMLDivElement> {
  opts?: CarouselOptions;
}

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(({ opts, className, children, ...props }, ref) => {
  const [carouselRef, api] = useEmblaCarousel({ align: "start", ...opts });
  const [state, setState] = useState({ canScrollPrev: false, canScrollNext: false, selectedIndex: 0, snapCount: 0 });

  const onSelect = useCallback((embla: CarouselApi) => {
    if (!embla) return;
    setState({
      canScrollPrev: embla.canScrollPrev(),
      canScrollNext: embla.canScrollNext(),
      selectedIndex: embla.selectedScrollSnap(),
      snapCount: embla.scrollSnapList().length,
    });
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("select", onSelect).on("reInit", onSelect);
    return () => {
      api.off("select", onSelect).off("reInit", onSelect);
    };
  }, [api, onSelect]);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollNext();
    }
  };

  return (
    <CarouselContext.Provider value={{ carouselRef, api, scrollPrev, scrollNext, ...state }}>
      <div
        ref={ref}
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
});
Carousel.displayName = "Carousel";

export const CarouselContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef } = useCarousel();
    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div ref={ref} className={cn("-ml-4 flex", className)} {...props} />
      </div>
    );
  },
);
CarouselContent.displayName = "CarouselContent";

export const CarouselItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    aria-roledescription="slide"
    className={cn("min-w-0 shrink-0 grow-0 basis-full pl-4", className)}
    {...props}
  />
));
CarouselItem.displayName = "CarouselItem";

type NavButtonProps = Omit<ComponentProps<typeof Button>, "onClick">;

export const CarouselPrevious = forwardRef<HTMLButtonElement, NavButtonProps>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel();
  const t = useTranslation();
  return (
    <Button ref={ref} variant={variant} size={size} className={cn("rounded-full", className)} disabled={!canScrollPrev} onClick={scrollPrev} {...props}>
      <ArrowLeft aria-hidden="true" />
      <span className="sr-only">{t.previous}</span>
    </Button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

export const CarouselNext = forwardRef<HTMLButtonElement, NavButtonProps>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel();
  const t = useTranslation();
  return (
    <Button ref={ref} variant={variant} size={size} className={cn("rounded-full", className)} disabled={!canScrollNext} onClick={scrollNext} {...props}>
      <ArrowRight aria-hidden="true" />
      <span className="sr-only">{t.next}</span>
    </Button>
  );
});
CarouselNext.displayName = "CarouselNext";

/** Indicadores de posição — um por "snap" (página) do carrossel. */
export function CarouselDots({ className }: { className?: string }) {
  const { api, selectedIndex, snapCount } = useCarousel();
  const t = useTranslation();
  if (snapCount <= 1) return null;

  return (
    <div className={cn("flex items-center", className)}>
      {Array.from({ length: snapCount }, (_, index) => (
        // Área de toque de 24px (WCAG 2.5.8) com o indicador visual menor dentro.
        <button
          key={index}
          type="button"
          aria-label={`${t.goToSlide} ${index + 1}`}
          aria-current={index === selectedIndex ? "true" : undefined}
          onClick={() => api?.scrollTo(index)}
          className="group inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-2 rounded-full bg-muted-foreground/40 transition-all duration-(--duration-base)",
              index === selectedIndex ? "w-6 bg-primary" : "w-2 group-hover:bg-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  );
}
