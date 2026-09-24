"use client";

import Image from "next/image";
import { ArrowRight } from "@godzilla/icons";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@godzilla/ui";
import type { SystemItem } from "@/content/types";

/** Carrossel dos sistemas publicados: 1 card por vez no mobile, 2 a partir de md. */
export function SystemsCarousel({ items, openLabel }: { items: SystemItem[]; openLabel: string }) {
  return (
    <Carousel aria-label={items.map((item) => item.name).join(", ")}>
      <CarouselContent>
        {items.map((system, index) => (
          <CarouselItem key={system.href} className="md:basis-1/2" aria-label={`${index + 1} / ${items.length}`}>
            {/* Link comum: cada sistema tem o próprio layout raiz (e o Design System é estático). */}
            <a href={system.href} className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="flex h-full flex-col overflow-hidden transition-colors duration-(--duration-base) group-hover:border-primary">
                <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-background">
                  <Image
                    src={system.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 560px, 100vw"
                    className="object-cover object-top transition-transform duration-(--duration-slow) group-hover:scale-[1.03]"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-h4 group-hover:text-primary">{system.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription>{system.description}</CardDescription>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                  <div className="flex flex-wrap gap-2">
                    {system.tags.map((tag) => (
                      <Badge key={tag} variant="tag">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-body-sm text-primary">
                    {openLabel}
                    <ArrowRight className="size-(--size-icon-sm) transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </CardFooter>
              </Card>
            </a>
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="mt-6 flex items-center justify-between gap-4">
        <CarouselDots />
        <div className="ml-auto flex gap-2">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </div>
    </Carousel>
  );
}
