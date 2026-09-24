import { LogOut } from "@godzilla/icons";
import { AppHeader as ShellHeader, Avatar, AvatarFallback, AvatarImage, Badge, appContainerClassName, cn } from "@godzilla/ui";
import { signOut } from "@/app/spotify/actions";
import { routes } from "@/config/spotify";
import { pickImage } from "@/lib/spotify/transform";
import type { SourceMode } from "@/lib/spotify/source";
import type { SpotifyUser } from "@/lib/spotify/types";
import { NavLinks } from "./nav-links";
import { SpotifyBrand } from "./spotify-brand";

const badges: Record<SourceMode, string | null> = { live: null, showcase: "Live showcase", lastfm: "Last.fm", demo: "Demo" };
const logoutLabels: Record<SourceMode, string> = { live: "Logout", showcase: "Exit showcase", lastfm: "Exit Last.fm", demo: "Exit demo" };

export function AppHeader({ user, mode }: { user: SpotifyUser | null; mode: SourceMode }) {
  const name = user?.display_name ?? "Spotify listener";
  const avatar = pickImage(user?.images, 64);
  const logoutLabel = logoutLabels[mode];

  return (
    <ShellHeader
      skipToContent={{ label: "Skip to content" }}
      brand={<SpotifyBrand href={routes.dashboard} />}
      nav={<NavLinks className="hidden lg:flex" />}
      actions={
        <div className="flex items-center gap-3">
          {badges[mode] && (
            // No mobile o banner logo abaixo já explica o modo — o selo só ocuparia espaço.
            <Badge variant="outline" className="hidden sm:inline-flex">
              {badges[mode]}
            </Badge>
          )}
          <Avatar className="size-8" title={name}>
            {avatar && <AvatarImage src={avatar} alt="" />}
            <AvatarFallback className="text-caption">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <form action={signOut}>
            <button
              type="submit"
              title={logoutLabel}
              className="inline-flex size-(--size-control-sm) items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            >
              <LogOut className="size-(--size-icon-sm)" aria-hidden="true" />
              <span className="sr-only">{logoutLabel}</span>
            </button>
          </form>
        </div>
      }
      below={
        <div className="border-t border-border lg:hidden">
          <NavLinks className={cn(appContainerClassName, "overflow-x-auto py-3 [scrollbar-width:none]")} />
        </div>
      }
    />
  );
}
