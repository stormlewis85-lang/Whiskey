const SkeletonCard = () => (
  <div className="card-elevated p-0 overflow-hidden animate-pulse">
    <div className="aspect-[4/5] bg-muted" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="h-4 bg-muted rounded w-16" />
        <div className="h-4 bg-muted rounded w-12" />
      </div>
    </div>
  </div>
);

export const SkeletonStats = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-8 bg-muted rounded w-36 animate-pulse" />
      <div className="h-9 bg-muted rounded w-24 animate-pulse" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card-elevated p-4 md:p-6 animate-pulse">
          <div className="h-3 bg-muted rounded w-20 mb-3" />
          <div className="h-7 bg-muted rounded w-16" />
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonCard;
