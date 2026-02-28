import { Plus, PenLine } from "lucide-react";

interface BottleActionsProps {
  onAddToCollection?: () => void;
  onReview?: () => void;
  inCollection?: boolean;
}

export function BottleActions({ onAddToCollection, onReview, inCollection }: BottleActionsProps) {
  return (
    <div className="flex gap-3 px-5 py-5">
      <button
        onClick={onAddToCollection}
        className="flex-1 flex items-center justify-center gap-2 border-none cursor-pointer uppercase font-semibold transition-transform duration-150 active:scale-95"
        style={{
          padding: "14px",
          borderRadius: "12px",
          fontSize: "0.75rem",
          letterSpacing: "0.05em",
          background: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
        }}
      >
        <Plus className="w-[18px] h-[18px]" />
        {inCollection ? "In Collection" : "Add to Collection"}
      </button>
      <button
        onClick={onReview}
        className="flex-1 flex items-center justify-center gap-2 cursor-pointer uppercase font-semibold transition-transform duration-150 active:scale-95"
        style={{
          padding: "14px",
          borderRadius: "12px",
          fontSize: "0.75rem",
          letterSpacing: "0.05em",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "hsl(var(--foreground))",
        }}
      >
        <PenLine className="w-[18px] h-[18px]" />
        Review
      </button>
    </div>
  );
}
