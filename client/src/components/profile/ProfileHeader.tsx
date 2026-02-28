import { Star } from "lucide-react";

interface ProfileHeaderProps {
  name: string;
  initials: string;
  handle: string;
  badge?: string;
}

export function ProfileHeader({ name, initials, handle, badge }: ProfileHeaderProps) {
  return (
    <div className="text-center relative" style={{ padding: "40px 20px 24px" }}>
      {/* Subtle gold gradient at top */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "120px",
          background: "linear-gradient(180deg, rgba(212,164,76,0.08) 0%, transparent 100%)",
        }}
      />

      {/* Avatar */}
      <div
        className="relative mx-auto flex items-center justify-center rounded-full mb-3"
        style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
          boxShadow: "0 4px 24px rgba(212, 164, 76, 0.25)",
        }}
      >
        <span
          className="font-display font-semibold"
          style={{ fontSize: "1.8rem", color: "hsl(var(--background))" }}
        >
          {initials}
        </span>
      </div>

      {/* Name */}
      <div className="font-display font-medium mb-1" style={{ fontSize: "1.4rem" }}>
        {name}
      </div>

      {/* Handle */}
      <div className="text-muted-foreground mb-2" style={{ fontSize: "0.8rem" }}>
        {handle}
      </div>

      {/* Badge */}
      {badge && (
        <span
          className="inline-flex items-center gap-1 text-primary uppercase"
          style={{
            background: "rgba(212, 164, 76, 0.12)",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "0.65rem",
            letterSpacing: "0.05em",
          }}
        >
          <Star className="w-3 h-3 fill-primary" />
          {badge}
        </span>
      )}
    </div>
  );
}
