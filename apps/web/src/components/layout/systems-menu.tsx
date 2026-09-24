import { ChevronDown } from "@godzilla/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@godzilla/ui";
import type { SystemsMenu as SystemsMenuContent } from "@/content/types";

/** Último item do menu: dropdown com os sistemas publicados junto com o site. */
export function SystemsMenu({ label, items }: SystemsMenuContent) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="group inline-flex items-center gap-1 rounded-sm outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:text-primary">
        {label}
        <ChevronDown
          className="size-(--size-icon-sm) transition-transform duration-(--duration-fast) group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12} className="w-72 p-1.5">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="cursor-pointer">
            <a href={item.href} className="flex flex-col items-start gap-0.5 px-3 py-2.5">
              <span className="font-mono text-body-sm font-semibold text-foreground">{item.label}</span>
              <span className="whitespace-normal text-caption text-muted-foreground">{item.description}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
