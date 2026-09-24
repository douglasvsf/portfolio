import { LogOut } from "@godzilla/icons";
import { AppHeader as ShellHeader, Avatar, AvatarFallback, AvatarImage, Badge, appContainerClassName, cn } from "@godzilla/ui";
import { signOut } from "@/app/spotify/actions";
import { SystemLocaleSwitcher } from "@/components/layout/system-locale-switcher";
import { routes } from "@/config/spotify";
import type { SpotifyDictionary } from "@/content/spotify";
import type { Locale } from "@/i18n/config";
import { pickImage } from "@/lib/spotify/transform";
import type { SourceMode } from "@/lib/spotify/source";
import type { SpotifyUser } from "@/lib/spotify/types";
import { NavLinks } from "./nav-links";
import { SpotifyBrand } from "./spotify-brand";

export function AppHeader({ user, mode, dict, locale }: { user: SpotifyUser | null; mode: SourceMode; dict: SpotifyDictionary; locale: Locale }) {
  const name = user?.display_name ?? dict.header.fallbackName;
  const avatar = pickImage(user?.images, 64);
  const badge = mode === "live" ? null : dict.header.badges[mode];
  const logoutLabel = dict.header.logout[mode];

  return (
    <ShellHeader
      skipToContent={{ label: dict.common.skipToContent }}
      brand={<SpotifyBrand href={routes.dashboard} />}
      actions={
        <div className="flex items-center gap-3">
          {badge && (
            // No mobile o banner logo abaixo já explica o modo — o selo só ocuparia espaço.
            <Badge variant="outline" className="hidden sm:inline-flex">
              {badge}
            </Badge>
          )}
          <Avatar className="hidden size-8 sm:flex" title={name}>
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
          <SystemLocaleSwitcher locale={locale} />
        </div>
      }
      // Navegação sempre numa segunda linha: com as bandeiras e os rótulos
      // traduzidos (mais longos), a barra principal ficaria apertada.
      below={
        <div className="border-t border-border">
          <NavLinks className={cn(appContainerClassName, "overflow-x-auto py-3 [scrollbar-width:none]")} />
        </div>
      }
    />
  );
}
