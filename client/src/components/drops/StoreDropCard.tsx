import { Check, Navigation, Store } from "lucide-react";

export interface StoreDrop {
  id: string;
  store: {
    name: string;
    initials: string;
    location: string;
    distance: string;
  };
  timeAgo: string;
  bottle: {
    name: string;
    type: string;
    onWishlist?: boolean;
  };
}

interface StoreDropCardProps {
  drop: StoreDrop;
  onGetDirections?: () => void;
  onViewStore?: () => void;
}

export function StoreDropCard({ drop, onGetDirections, onViewStore }: StoreDropCardProps) {
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
        {/* Store logo */}
        <div
          className="flex-shrink-0 flex items-center justify-center font-semibold"
          style={{
            width: "40px",
            height: "40px",
            background: "hsl(var(--popover))",
            borderRadius: "10px",
            fontSize: "0.75rem",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {drop.store.initials}
        </div>

        {/* Store info */}
        <div className="flex-1">
          <div className="font-medium text-foreground" style={{ fontSize: "0.85rem", marginBottom: "2px" }}>
            {drop.store.name}
          </div>
          <div className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
            {drop.store.location} · {drop.store.distance}
          </div>
        </div>

        {/* Time badge */}
        <div
          className="text-primary"
          style={{
            fontSize: "0.65rem",
            background: "rgba(212,164,76,0.12)",
            padding: "4px 10px",
            borderRadius: "12px",
          }}
        >
          {drop.timeAgo}
        </div>
      </div>

      {/* Bottle content */}
      <div className="p-4">
        <div className="flex gap-3 items-center">
          {/* Bottle image placeholder */}
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: "50px",
              height: "70px",
              background: "linear-gradient(145deg, hsl(var(--accent)), hsl(var(--background)))",
              borderRadius: "8px",
            }}
          >
            <svg
              width="24"
              height="44"
              viewBox="0 0 24 44"
              fill="none"
              style={{ color: "hsl(var(--primary) / 0.6)" }}
            >
              <rect x="8" y="0" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <path d="M5 6 L5 38 Q5 42 8 42 L16 42 Q19 42 19 38 L19 6 Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </div>

          {/* Bottle info */}
          <div className="flex-1">
            <div className="font-display" style={{ fontSize: "1rem", marginBottom: "4px" }}>
              {drop.bottle.name}
            </div>
            <div className="text-muted-foreground" style={{ fontSize: "0.7rem", marginBottom: "6px" }}>
              {drop.bottle.type}
            </div>
            {drop.bottle.onWishlist && (
              <span
                className="inline-flex items-center gap-1"
                style={{ fontSize: "0.65rem", color: "hsl(var(--success))" }}
              >
                <Check className="w-3 h-3" />
                On your wishlist
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex gap-2.5 px-4 pb-4">
        <button
          onClick={onGetDirections}
          className="flex-1 flex items-center justify-center gap-2 bg-transparent text-foreground cursor-pointer font-medium"
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: "0.75rem",
          }}
        >
          <Navigation className="w-3.5 h-3.5" />
          Get Directions
        </button>
        <button
          onClick={onViewStore}
          className="flex-1 flex items-center justify-center gap-2 bg-transparent text-foreground cursor-pointer font-medium"
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: "0.75rem",
          }}
        >
          <Store className="w-3.5 h-3.5" />
          View Store
        </button>
      </div>
    </div>
  );
}
