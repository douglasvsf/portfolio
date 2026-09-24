import { Music } from "@godzilla/icons";

/** Arte do card "Top genre" — gêneros não têm imagem na API. */
export function Genre() {
  return (
    <div className="flex size-[52px] shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary" aria-hidden="true">
      <Music className="size-6" />
    </div>
  );
}
