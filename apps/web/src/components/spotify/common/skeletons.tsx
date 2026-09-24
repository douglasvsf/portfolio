import { Card, Skeleton } from "@godzilla/ui";

export function StatsCardSkeleton() {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Skeleton className="h-3 w-20" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-md" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </Card>
  );
}

export function ArtistCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-3">
      <Skeleton className="h-4 w-6" />
      <Skeleton className="size-14 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56 max-w-full" />
      </div>
    </div>
  );
}

export function TrackCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="h-4 w-6" />
      <Skeleton className="size-11 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-48 max-w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="hidden h-3 w-10 sm:block" />
    </div>
  );
}

export function ChartSkeleton({ className = "h-72" }: { className?: string }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-64 max-w-full" />
      <Skeleton className={`${className} w-full`} />
    </Card>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-10 w-64 max-w-full" />
    </div>
  );
}
