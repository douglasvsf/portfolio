"use client";

import { useTranslation } from "@godzilla/ui";
import { PageHeaderSkeleton, TrackCardSkeleton } from "@/components/spotify/common/skeletons";

export default function Loading() {
  const t = useTranslation();
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label={t.loading}>
      <PageHeaderSkeleton />
      <div className="ml-3 border-l border-border pl-3">
        {Array.from({ length: 8 }, (_, index) => (
          <TrackCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
