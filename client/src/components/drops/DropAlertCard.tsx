import { Clock, MapPin, Heart } from "lucide-react";

export interface DropAlert {
  id: string;
  storeName: string;
  storeLocation: string;
  bottleName: string;
  timeAgo: string;
  distance: string;
  onWishlist?: boolean;
}

interface DropAlertCardProps {
  alert: DropAlert;
  onClick?: () => void;
}

export function DropAlertCard({ alert, onClick }: DropAlertCardProps) {
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
            Drop Alert
          </span>
        </div>
        <span className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>
          {alert.timeAgo}
        </span>
      </div>

      {/* Store name */}
      <div className="font-medium text-foreground mb-1 truncate" style={{ fontSize: "0.8rem" }}>
        {alert.storeName} — {alert.storeLocation}
      </div>

      {/* Bottle name */}
      <div className="font-display text-primary mb-2" style={{ fontSize: "1rem" }}>
        {alert.bottleName}
      </div>

      {/* Meta row */}
      <div className="flex gap-4 text-muted-foreground" style={{ fontSize: "0.7rem" }}>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {alert.distance} away
        </span>
        {alert.onWishlist && (
          <span className="flex items-center gap-1 text-primary">
            <Heart className="w-3 h-3 fill-primary" />
            On your wishlist
          </span>
        )}
      </div>
    </div>
  );
}
