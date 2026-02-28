import { Star } from "lucide-react";

interface BottleInfoProps {
  distillery: string;
  name: string;
  subtitle: string;
  rating: number;
  reviewCount: number;
}

export function BottleInfo({ distillery, name, subtitle, rating, reviewCount }: BottleInfoProps) {
  return (
    <div className="text-center" style={{ padding: "0 24px 20px" }}>
      {/* Distillery */}
      <div
        className="text-primary uppercase font-medium"
        style={{ fontSize: "0.7rem", letterSpacing: "0.15em", marginBottom: "8px" }}
      >
        {distillery}
      </div>

      {/* Bottle name */}
      <h1
        className="font-display font-medium text-foreground break-words"
        style={{ fontSize: "1.6rem", lineHeight: 1.2, marginBottom: "6px", overflowWrap: "break-word" }}
      >
        {name}
      </h1>

      {/* Subtitle (type + ABV) */}
      <div className="text-muted-foreground" style={{ fontSize: "0.8rem", marginBottom: "16px" }}>
        {subtitle}
      </div>

      {/* Rating badge */}
      <div className="inline-flex items-center gap-2">
        <div
          className="flex items-center gap-1 bg-primary text-primary-foreground font-semibold"
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "0.85rem",
          }}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          {rating}
        </div>
        <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
          {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
        </span>
      </div>
    </div>
  );
}
