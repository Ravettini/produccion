import { cn } from "../../utils/cn";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-slate-200", className)}
      aria-hidden="true"
    />
  );
}

export function EventListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
          <LoadingSkeleton className="h-5 w-3/4 mb-2" />
          <LoadingSkeleton className="h-4 w-1/2 mb-2" />
          <LoadingSkeleton className="h-4 w-1/3 mb-3" />
          <div className="flex gap-2">
            <LoadingSkeleton className="h-6 w-20 rounded-full" />
            <LoadingSkeleton className="h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingSkeleton className="h-8 w-2/3" />
      <LoadingSkeleton className="h-4 w-1/2" />
      <div className="grid gap-4 sm:grid-cols-2">
        <LoadingSkeleton className="h-24" />
        <LoadingSkeleton className="h-24" />
      </div>
      <LoadingSkeleton className="h-32" />
    </div>
  );
}
