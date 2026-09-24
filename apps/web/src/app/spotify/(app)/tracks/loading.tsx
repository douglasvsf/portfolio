import { Card } from "@godzilla/ui";
import { PageHeaderSkeleton, TrackCardSkeleton } from "@/components/spotify/common/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading top tracks">
      <PageHeaderSkeleton />
      <Card className="p-2">
        {Array.from({ length: 10 }, (_, index) => (
          <TrackCardSkeleton key={index} />
        ))}
      </Card>
    </div>
  );
}
