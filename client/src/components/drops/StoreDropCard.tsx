import { Check, Navigation, Store, Clock } from "lucide-react";

export interface StoreDrop {
  id: number;
  storeId: number;
  createdBy: number;
  whiskeyName: string;
  whiskeyType: string | null;
  whiskeyId: number | null;
  price: number | null;
  status: string | null;
  droppedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string | null;
  store: {
    id: number;
    name: string;
    location: string | null;
    address: string | null;
  };
  isWishlistMatch?: boolean;
}

interface StoreDropCardProps {
  drop: StoreDrop;
  onGetDirections?: () => void;
  onViewStore?: () => void;
}

function getTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function StoreDropCard({ drop, onGetDirections, onViewStore }: StoreDropCardProps) {
  const timeAgo = getTimeAgo(drop.droppedAt);

  return (
    <div
      className="overflow-hidden mb-3 transition-transform duration-150 active:scale-[0.98]"
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
          {getInitials(drop.store.name)}
        </div>

        {/* Store info */}
        <div className="flex-1">
          <div className="font-medium text-foreground" style={{ fontSize: "0.85rem", marginBottom: "2px" }}>
            {drop.store.name}
          </div>
          <div className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
            {drop.store.location || drop.store.address || ""}
          </div>
        </div>

        {/* Time badge */}
        {timeAgo && (
          <div
            className="flex items-center gap-1 text-primary"
            style={{
              fontSize: "0.65rem",
              background: "rgba(212,164,76,0.12)",
              padding: "4px 10px",
              borderRadius: "12px",
            }}
          >
            <Clock className="w-3 h-3" />
            {timeAgo}
          </div>
        )}
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
              {drop.whiskeyName}
            </div>
            <div className="text-muted-foreground" style={{ fontSize: "0.7rem", marginBottom: "6px" }}>
              {[drop.whiskeyType, drop.price ? `$${drop.price}` : null]
                .filter(Boolean)
                .join(" · ")}
            </div>
            {drop.isWishlistMatch && (
              <span
                className="inline-flex items-center gap-1"
                style={{ fontSize: "0.65rem", color: "hsl(var(--success, 142 71% 45%))" }}
              >
                <Check className="w-3 h-3" />
                On your wishlist
              </span>
            )}
            {drop.status === "sold_out" && (
              <span
                className="inline-flex items-center gap-1 text-muted-foreground"
                style={{ fontSize: "0.65rem" }}
              >
                Sold out
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
            minHeight: "44px",
            padding: "12px",
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
            minHeight: "44px",
            padding: "12px",
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
