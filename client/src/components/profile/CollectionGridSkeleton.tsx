import { Skeleton } from "@/components/ui/skeleton";

export function CollectionGridSkeleton() {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: "2px",
        padding: "2px 20px 100px",
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton
          key={i}
          className="rounded-lg"
          style={{ aspectRatio: "1" }}
        />
      ))}
    </div>
  );
}
