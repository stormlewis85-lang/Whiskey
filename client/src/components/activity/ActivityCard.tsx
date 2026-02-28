import { ActivityBottleCard, type ActivityBottle } from "./ActivityBottleCard";
import { ActivityActions } from "./ActivityActions";

export interface ActivityItem {
  id: string;
  user: {
    name: string;
    initials: string;
  };
  action: string;
  bottleName: string;
  timestamp: string;
  bottle: ActivityBottle;
  note?: string;
  likes: number;
  comments: number;
  liked?: boolean;
}

interface ActivityCardProps {
  item: ActivityItem;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
}

export function ActivityCard({ item, onLike, onComment }: ActivityCardProps) {
  return (
    <div
      className="px-5 py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      {/* Header: avatar + user info */}
      <div className="flex gap-3 mb-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center font-semibold"
          style={{
            width: "40px",
            height: "40px",
            background: "linear-gradient(135deg, hsl(var(--muted)), hsl(var(--secondary)))",
            fontSize: "0.85rem",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {item.user.initials}
        </div>

        {/* Meta */}
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-foreground truncate" style={{ fontSize: "0.85rem" }}>
            {item.user.name}
          </span>
          <span className="break-words" style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", overflowWrap: "break-word" }}>
            {item.action}{" "}
            <strong className="text-foreground">{item.bottleName}</strong>
          </span>
          <span style={{ fontSize: "0.65rem", color: "hsl(var(--border))", marginTop: "2px" }}>
            {item.timestamp}
          </span>
        </div>
      </div>

      {/* Embedded bottle card */}
      <ActivityBottleCard bottle={item.bottle} />

      {/* Tasting note */}
      {item.note && (
        <p
          className="italic"
          style={{
            fontSize: "0.8rem",
            color: "hsl(var(--muted-foreground))",
            lineHeight: 1.5,
            marginTop: "10px",
          }}
        >
          "{item.note}"
        </p>
      )}

      {/* Actions */}
      <ActivityActions
        likes={item.likes}
        comments={item.comments}
        liked={item.liked}
        onLike={() => onLike?.(item.id)}
        onComment={() => onComment?.(item.id)}
      />
    </div>
  );
}
