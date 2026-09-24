import Image from "next/image";
import { Disc3, Mic2 } from "@godzilla/icons";
import { cn } from "@godzilla/ui";
import { pickImage } from "@/lib/spotify/transform";
import type { SpotifyImage } from "@/lib/spotify/types";

export interface CoverArtProps {
  images: SpotifyImage[] | undefined;
  /** Usado para gerar uma capa determinística quando não há imagem (modo demo). */
  seed: string;
  alt: string;
  size: number;
  variant?: "album" | "artist";
  className?: string;
}

function hueFrom(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 100 + (hash % 90); // faixa verde → ciano, dentro da identidade do app
}

/** Capa de álbum / foto de artista. Sem imagem, desenha uma arte gerada a partir do id. */
export function CoverArt({ images, seed, alt, size, variant = "album", className }: CoverArtProps) {
  const src = pickImage(images, size * 2);
  const shape = variant === "artist" ? "rounded-full" : "rounded-md";

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        unoptimized
        className={cn("shrink-0 bg-muted object-cover", shape, className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const hue = hueFrom(seed);
  const Icon = variant === "artist" ? Mic2 : Disc3;
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("flex shrink-0 items-center justify-center text-foreground/80", shape, className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 70% 32%), hsl(${hue + 40} 60% 12%))`,
      }}
    >
      <Icon className="size-2/5" aria-hidden="true" />
    </div>
  );
}
