import { Spinner } from "@godzilla/ui";

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  );
}
