"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput, Spinner, cn } from "@godzilla/ui";
import { useStocksDictionary } from "@/content/stocks";
import { sectorLabel } from "@/lib/stocks/sectors";

const SEARCH_DEBOUNCE_MS = 350;

/** Busca + filtro de setor — escrevem na URL, e a página (server) refaz a consulta. */
export function MarketFilters({ sectors }: { sectors: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const dict = useStocksDictionary();

  function update(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  useEffect(() => {
    if (search === (searchParams.get("q") ?? "")) return;
    const timeout = setTimeout(() => update({ q: search.trim() }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara só quando o texto muda
  }, [search]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onClear={() => setSearch("")}
        placeholder={dict.filters.searchPlaceholder}
        aria-label={dict.filters.searchLabel}
        className="sm:w-80"
      />
      <select
        aria-label={dict.filters.sectorLabel}
        value={searchParams.get("sector") ?? ""}
        onChange={(event) => update({ sector: event.target.value })}
        className={cn(
          "h-(--size-control-md) rounded-md border border-input bg-background px-3 text-body-sm text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <option value="">{dict.filters.allSectors}</option>
        {sectors
          .map((sector) => ({ sector, label: sectorLabel(sector, dict) }))
          .sort((a, b) => a.label.localeCompare(b.label))
          .map(({ sector, label }) => (
            <option key={sector} value={sector}>
              {label}
            </option>
          ))}
      </select>
      {isPending && <Spinner size="sm" />}
    </div>
  );
}
