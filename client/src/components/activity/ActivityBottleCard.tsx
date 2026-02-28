import { Star } from "lucide-react";

export interface ActivityBottle {
  name: string;
  distillery: string;
  rating: number;
  imageUrl?: string;
}

interface ActivityBottleCardProps {
  bottle: ActivityBottle;
}

export function ActivityBottleCard({ bottle }: ActivityBottleCardProps) {
  return (
    <div
      className="flex overflow-hidden"
      style={{
        background: "hsl(var(--popover))",
        borderRadius: "12px",
      }}
    >
      {/* Bottle image placeholder */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: "70px",
          height: "90px",
          background: "linear-gradient(145deg, hsl(var(--accent)), hsl(var(--background)))",
        }}
      >
        {bottle.imageUrl ? (
          <img
            src={bottle.imageUrl}
            alt={bottle.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            width="30"
            height="50"
            viewBox="0 0 30 50"
            fill="none"
            style={{ color: "hsl(var(--primary) / 0.6)" }}
          >
            <rect x="10" y="0" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="8" y="8" width="14" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M6 14 L6 44 Q6 48 10 48 L20 48 Q24 48 24 44 L24 14 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        )}
      </div>

      {/* Bottle info */}
      <div className="flex flex-col justify-center py-3 pr-3" style={{ paddingLeft: "12px" }}>
        <span
          className="font-display"
          style={{ fontSize: "0.9rem", color: "hsl(var(--foreground))", marginBottom: "2px" }}
        >
          {bottle.name}
        </span>
        <span style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", marginBottom: "8px" }}>
          {bottle.distillery}
        </span>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-primary fill-primary" />
          <span className="text-primary font-medium" style={{ fontSize: "0.75rem" }}>
            {bottle.rating}
          </span>
        </div>
      </div>
    </div>
  );
}
