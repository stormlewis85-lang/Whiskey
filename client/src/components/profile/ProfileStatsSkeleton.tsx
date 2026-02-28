import { Skeleton } from "@/components/ui/skeleton";

export function ProfileStatsSkeleton() {
  return (
    <div
      className="flex justify-between mx-5"
      style={{
        padding: "20px",
        background: "hsl(var(--card))",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="text-center space-y-2">
          <Skeleton className="h-6 w-8 mx-auto" />
          <Skeleton className="h-2.5 w-14 mx-auto" />
        </div>
      ))}
    </div>
  );
}
