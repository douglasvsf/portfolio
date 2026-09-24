import { Button, Card, Input, Label } from "@godzilla/ui";
import { routes } from "@/config/spotify";
import type { SpotifyDictionary } from "@/content/spotify";

/**
 * Entrada pelo Last.fm: formulário GET simples (funciona sem JavaScript) que
 * valida o usuário no servidor e abre o dashboard. Sem limite de usuários,
 * ao contrário do login da Spotify em Development Mode.
 */
export function LastfmForm({ error, dict }: { error?: string; dict: SpotifyDictionary }) {
  const t = dict.lastfmForm;
  const [before, after = ""] = t.description.split("{link}");

  return (
    <Card id="lastfm" className="mx-auto flex max-w-4xl scroll-mt-24 flex-col gap-6 p-6 sm:p-10 md:flex-row md:items-center">
      <div className="flex flex-1 flex-col gap-2">
        <span className="font-mono text-caption uppercase tracking-widest text-primary">{t.eyebrow}</span>
        <h2 className="text-h3 font-bold">{t.title}</h2>
        <p className="text-body-sm text-muted-foreground">
          {before}
          <a href="https://www.last.fm/settings/applications" target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
            Last.fm
          </a>
          {after}
        </p>
      </div>
      <form action={routes.lastfm} method="get" className="flex w-full flex-col gap-2 md:max-w-xs" data-testid="lastfm-form">
        <Label htmlFor="lastfm-username">{t.label}</Label>
        <div className="flex gap-2">
          <Input
            id="lastfm-username"
            name="username"
            required
            minLength={2}
            maxLength={15}
            pattern="[a-zA-Z][\w\-]{1,14}"
            autoComplete="username"
            placeholder={t.placeholder}
            invalid={Boolean(error)}
            aria-describedby={error ? "lastfm-error" : undefined}
          />
          <Button type="submit">{t.submit}</Button>
        </div>
        {error && (
          <p id="lastfm-error" role="alert" className="text-caption text-destructive">
            {error}
          </p>
        )}
      </form>
    </Card>
  );
}
