import { PageHeaderSkeleton, TrackCardSkeleton } from "@/components/spotify/common/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading recently played">
      <PageHeaderSkeleton />
      <div className="ml-3 border-l border-border pl-3">
        {Array.from({ length: 8 }, (_, index) => (
          <TrackCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
