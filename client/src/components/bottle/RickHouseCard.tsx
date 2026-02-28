import { Mic, ArrowRight } from "lucide-react";

interface RickHouseCardProps {
  onStartSession?: () => void;
}

export function RickHouseCard({ onStartSession }: RickHouseCardProps) {
  return (
    <div
      className="mx-5 mb-5"
      style={{
        background: "linear-gradient(135deg, rgba(212,164,76,0.08), rgba(212,164,76,0.02))",
        border: "1px solid rgba(212,164,76,0.15)",
        borderRadius: "16px",
        padding: "16px",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="flex items-center justify-center bg-primary"
          style={{ width: "36px", height: "36px", borderRadius: "10px" }}
        >
          <Mic className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <div
            className="text-primary uppercase font-medium"
            style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}
          >
            Rick House AI
          </div>
          <div className="font-display text-foreground" style={{ fontSize: "0.95rem" }}>
            Guided Tasting Available
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground" style={{ fontSize: "0.8rem", lineHeight: 1.6 }}>
        Let Rick House walk you through this pour with guided tasting notes, flavor wheel analysis, and food pairing suggestions.
      </p>

      {/* CTA */}
      <button
        onClick={onStartSession}
        className="flex items-center gap-1.5 text-primary font-medium bg-transparent border-none cursor-pointer mt-3"
        style={{ fontSize: "0.75rem" }}
      >
        Start Tasting Session
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
