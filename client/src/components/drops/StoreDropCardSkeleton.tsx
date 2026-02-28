import { Skeleton } from "@/components/ui/skeleton";

export function StoreDropCardSkeleton() {
  return (
    <div
      className="overflow-hidden mb-3"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: "16px",
      }}
    >
      {/* Store header */}
      <div
        className="flex items-center gap-3"
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <Skeleton className="w-10 h-10 rounded-[10px] flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      {/* Bottle content */}
      <div className="p-4">
        <div className="flex gap-3 items-center">
          <Skeleton className="w-[50px] h-[70px] rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex gap-2.5 px-4 pb-4">
        <Skeleton className="flex-1 h-11 rounded-[10px]" />
        <Skeleton className="flex-1 h-11 rounded-[10px]" />
      </div>
    </div>
  );
}
