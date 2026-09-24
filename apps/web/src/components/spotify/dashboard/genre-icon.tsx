import { Calendar, Music } from "@godzilla/icons";

const artClass = "flex size-[52px] shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary";

/** Arte do card "Top genre" — gêneros não têm imagem na API. */
export function Genre() {
  return (
    <div className={artClass} aria-hidden="true">
      <Music className="size-6" />
    </div>
  );
}

/** Arte do card "Top era". */
export function Era() {
  return (
    <div className={artClass} aria-hidden="true">
      <Calendar className="size-6" />
    </div>
  );
}
