import { Clock, MapPin, Heart } from "lucide-react";
import type { StoreDrop } from "./StoreDropCard";

interface DropAlertCardProps {
  drop: StoreDrop;
  onClick?: () => void;
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

export function DropAlertCard({ drop, onClick }: DropAlertCardProps) {
  const timeAgo = getTimeAgo(drop.droppedAt);

  return (
    <div
      className="relative mx-4 mb-4 cursor-pointer transition-transform duration-150 active:scale-[0.98]"
      onClick={onClick}
      style={{
        background: "linear-gradient(135deg, rgba(212,164,76,0.12), rgba(212,164,76,0.04))",
        border: "1px solid rgba(212,164,76,0.2)",
        borderRadius: "16px",
        padding: "16px",
        paddingLeft: "20px",
      }}
    >
      {/* Gold left accent bar */}
      <div
        className="absolute top-0 left-0 rounded-l-2xl"
        style={{
          width: "4px",
          height: "100%",
          background: "hsl(var(--primary))",
          borderRadius: "16px 0 0 16px",
        }}
      />

      {/* Header row */}
      <div className="flex justify-between items-start mb-2.5">
        <div
          className="flex items-center gap-1.5"
          style={{
            background: "rgba(212,164,76,0.15)",
            padding: "4px 10px",
            borderRadius: "12px",
          }}
        >
          <Clock className="w-3 h-3 text-primary" />
          <span
            className="text-primary font-semibold uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Wishlist Match
          </span>
        </div>
        <span className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>
          {timeAgo}
        </span>
      </div>

      {/* Store name */}
      <div className="font-medium text-foreground mb-1 truncate" style={{ fontSize: "0.8rem" }}>
        {drop.store.name} — {drop.store.location || ""}
      </div>

      {/* Bottle name */}
      <div className="font-display text-primary mb-2" style={{ fontSize: "1rem" }}>
        {drop.whiskeyName}
      </div>

      {/* Meta row */}
      <div className="flex gap-4 text-muted-foreground" style={{ fontSize: "0.7rem" }}>
        {drop.store.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {drop.store.location}
          </span>
        )}
        <span className="flex items-center gap-1 text-primary">
          <Heart className="w-3 h-3 fill-primary" />
          On your wishlist
        </span>
      </div>
    </div>
  );
}
