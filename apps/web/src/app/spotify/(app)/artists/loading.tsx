"use client";

import { useTranslation } from "@godzilla/ui";
import { Card, Skeleton } from "@godzilla/ui";
import { ArtistCardSkeleton, PageHeaderSkeleton } from "@/components/spotify/common/skeletons";

export default function Loading() {
  const t = useTranslation();
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label={t.loading}>
      <PageHeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="flex flex-col items-center gap-3 p-6">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="size-28 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {Array.from({ length: 8 }, (_, index) => (
          <ArtistCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
