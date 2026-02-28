export interface CollectionItem {
  id: string;
  name: string;
  imageUrl?: string;
}

interface MobileCollectionGridProps {
  items: CollectionItem[];
  onItemClick?: (id: string) => void;
}

export function MobileCollectionGrid({ items, onItemClick }: MobileCollectionGridProps) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "2px",
        padding: "2px 20px 100px",
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick?.(item.id)}
          className="relative overflow-hidden flex items-center justify-center bg-transparent border-none cursor-pointer p-0"
          style={{
            aspectRatio: "1",
            background: "hsl(var(--popover))",
            borderRadius: "8px",
          }}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              width="30"
              height="50"
              viewBox="0 0 30 50"
              fill="none"
              style={{ color: "hsl(var(--primary) / 0.4)" }}
            >
              <rect x="10" y="0" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <rect x="8" y="8" width="14" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M6 14 L6 44 Q6 48 10 48 L20 48 Q24 48 24 44 L24 14 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          )}

          {/* Name overlay */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              padding: "6px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
            }}
          >
            <span
              className="text-foreground block truncate"
              style={{ fontSize: "0.55rem" }}
            >
              {item.name}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
