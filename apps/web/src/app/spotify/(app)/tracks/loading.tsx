"use client";

import { useTranslation } from "@godzilla/ui";
import { Card } from "@godzilla/ui";
import { PageHeaderSkeleton, TrackCardSkeleton } from "@/components/spotify/common/skeletons";

export default function Loading() {
  const t = useTranslation();
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label={t.loading}>
      <PageHeaderSkeleton />
      <Card className="p-2">
        {Array.from({ length: 10 }, (_, index) => (
          <TrackCardSkeleton key={index} />
        ))}
      </Card>
    </div>
  );
}
