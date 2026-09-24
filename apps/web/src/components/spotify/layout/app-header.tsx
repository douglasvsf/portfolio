import Link from "next/link";
import { LogOut } from "@godzilla/icons";
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@godzilla/ui";
import { signOut } from "@/app/spotify/actions";
import { routes } from "@/config/spotify";
import { pickImage } from "@/lib/spotify/transform";
import type { SpotifyUser } from "@/lib/spotify/types";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

export function AppHeader({ user, demo }: { user: SpotifyUser | null; demo: boolean }) {
  const name = user?.display_name ?? "Spotify listener";
  const avatar = pickImage(user?.images, 64);

  return (
    <header className="sticky top-0 z-(--z-sticky) border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={routes.dashboard} aria-label="GODZILLA Spotify Stats — overview">
          <Brand />
        </Link>

        <NavLinks className="hidden lg:flex" />

        <div className="flex items-center gap-3">
          {demo && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              Demo
            </Badge>
          )}
          <div className="flex items-center gap-2">
            <Avatar className="size-8" title={name}>
              {avatar && <AvatarImage src={avatar} alt="" />}
              <AvatarFallback className="text-caption">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-36 truncate text-body-sm font-medium sm:inline lg:hidden">{name}</span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title={demo ? "Exit demo" : "Logout"}
              className="inline-flex size-(--size-control-sm) items-center justify-center whitespace-nowrap rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:w-auto sm:gap-2 sm:px-3 lg:w-(--size-control-sm) lg:px-0"
            >
              <LogOut className="size-(--size-icon-sm)" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only sm:text-body-sm lg:sr-only">{demo ? "Exit demo" : "Logout"}</span>
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-border lg:hidden">
        <NavLinks className="mx-auto max-w-6xl overflow-x-auto px-4 py-2 [scrollbar-width:none]" />
      </div>
    </header>
  );
}
