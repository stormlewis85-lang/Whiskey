import { Skeleton } from "@/components/ui/skeleton";

export function ActivityCardSkeleton() {
  return (
    <div
      className="px-5 py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      {/* Header: avatar + user info */}
      <div className="flex gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>

      {/* Bottle card */}
      <div
        className="flex gap-3 overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.04)",
          padding: "12px",
        }}
      >
        <Skeleton className="w-[70px] h-[90px] rounded-lg flex-shrink-0" />
        <div className="flex flex-col gap-2 flex-1 py-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-5 w-12 rounded-full mt-auto" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-3">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}
