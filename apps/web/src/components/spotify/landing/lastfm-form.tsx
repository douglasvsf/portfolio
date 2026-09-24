import { Button, Card, Input, Label } from "@godzilla/ui";
import { routes } from "@/config/spotify";

/**
 * Entrada pelo Last.fm: formulário GET simples (funciona sem JavaScript) que
 * valida o usuário no servidor e abre o dashboard. Sem limite de usuários,
 * ao contrário do login da Spotify em Development Mode.
 */
export function LastfmForm({ error }: { error?: string }) {
  return (
    <Card id="lastfm" className="mx-auto flex max-w-4xl scroll-mt-24 flex-col gap-6 p-6 sm:p-10 md:flex-row md:items-center">
      <div className="flex flex-1 flex-col gap-2">
        <span className="font-mono text-caption uppercase tracking-widest text-primary">No invite needed</span>
        <h2 className="text-h3 font-bold">Use your Last.fm</h2>
        <p className="text-body-sm text-muted-foreground">
          Spotify only lets invited accounts log in to this app. If you scrobble your Spotify plays to{" "}
          <a href="https://www.last.fm/settings/applications" target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
            Last.fm
          </a>
          , type your username to see your stats — with genres from Last.fm tags.
        </p>
      </div>
      <form action={routes.lastfm} method="get" className="flex w-full flex-col gap-2 md:max-w-xs" data-testid="lastfm-form">
        <Label htmlFor="lastfm-username">Last.fm username</Label>
        <div className="flex gap-2">
          <Input
            id="lastfm-username"
            name="username"
            required
            minLength={2}
            maxLength={15}
            pattern="[a-zA-Z][\w\-]{1,14}"
            autoComplete="username"
            placeholder="e.g. rj"
            invalid={Boolean(error)}
            aria-describedby={error ? "lastfm-error" : undefined}
          />
          <Button type="submit">See stats</Button>
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
