import { Wine } from "lucide-react";

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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-0.5 px-5 pb-[100px] pt-0.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick?.(item.id)}
          className="relative overflow-hidden flex items-center justify-center bg-popover border-none cursor-pointer p-0 transition-transform duration-150 active:scale-95 rounded-lg aspect-square"
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Wine className="w-8 h-8 text-primary/40" />
          )}

          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
            <span className="text-foreground block truncate text-[0.55rem]">
              {item.name}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
