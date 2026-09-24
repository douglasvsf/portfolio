import Link from "next/link";
import { AppBrand } from "@godzilla/ui";

/** Marca do app no padrão do portfólio (ponto pulsante + texto mono). "SPOTIFY" some no mobile. */
export function SpotifyBrand({ href }: { href: string }) {
  return (
    <AppBrand asChild>
      <Link href={href} aria-label="GODZILLA Spotify Stats">
        <span>
          GODZILLA<span className="text-primary"><span className="hidden sm:inline">/SPOTIFY</span> STATS</span>
        </span>
      </Link>
    </AppBrand>
  );
}
