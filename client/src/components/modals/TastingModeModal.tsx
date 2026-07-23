import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Whiskey } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Modes offered on the sheet. "guided" -> guided TastingSession.
// "score" -> the existing Rick-guided review session (RickReviewSession).
export type TastingMode = "guided" | "score";

interface TastingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
  onSelectMode: (mode: TastingMode) => void;
  isLoading?: boolean;
}

const MODE_STORAGE_KEY = "rick-tasting-mode";

const MODE_COPY: Record<TastingMode, { name: string; description: string }> = {
  guided: {
    name: "Guide me",
    description: "Rick leads. You sip, listen, and talk back when you like. No scoring.",
  },
  score: {
    name: "Score as we go",
    description: "The full six-component review, phase by phase.",
  },
};

const getStoredMode = (): TastingMode => {
  if (typeof window === "undefined") return "guided";
  try {
    const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
    return stored === "score" || stored === "guided" ? stored : "guided";
  } catch {
    return "guided";
  }
};

const TastingModeModal = ({ isOpen, onClose, whiskey, onSelectMode, isLoading }: TastingModeModalProps) => {
  const [selectedMode, setSelectedMode] = useState<TastingMode>("guided");

  // Preselect the last-used mode (or default "Guide me") every time the sheet opens.
  useEffect(() => {
    if (isOpen) {
      setSelectedMode(getStoredMode());
    }
  }, [isOpen]);

  const handleStart = () => {
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, selectedMode);
    } catch {
      // localStorage unavailable — non-fatal, mode just won't persist.
    }
    onSelectMode(selectedMode);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className={cn(
          "p-0 gap-0 max-h-[90vh] overflow-y-auto",
          "border-0 border-t rounded-t-[22px]",
          "[&>button]:hidden",
        )}
        style={{
          backgroundColor: "#0F0D0B",
          borderTopColor: "rgba(237,232,224,0.09)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-9 h-1 rounded-full"
            style={{ backgroundColor: "rgba(237,232,224,0.2)" }}
          />
        </div>

        {/* Title + subtitle */}
        <div className="px-6 pb-2 text-center">
          <SheetTitle className="font-heading text-2xl font-normal" style={{ color: "#EDE8E0" }}>
            How do we take this one?
          </SheetTitle>
          <SheetDescription className="mt-1.5 text-sm" style={{ color: "#A69C8D" }}>
            {[whiskey.name, whiskey.type].filter(Boolean).join(" · ")}
          </SheetDescription>
        </div>

        {/* Mode cards */}
        <div className="px-6 pt-4 space-y-3">
          {(Object.keys(MODE_COPY) as TastingMode[]).map((mode) => {
            const isSelected = selectedMode === mode;
            const copy = MODE_COPY[mode];
            return (
              <button
                key={mode}
                type="button"
                disabled={isLoading}
                onClick={() => setSelectedMode(mode)}
                className="w-full text-left p-4 rounded-xl border transition-colors disabled:opacity-60"
                style={{
                  backgroundColor: isSelected ? "#1B1712" : "transparent",
                  borderColor: isSelected ? "rgba(237,232,224,0.18)" : "rgba(237,232,224,0.09)",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "rgba(237,232,224,0.22)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "rgba(237,232,224,0.09)";
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn("text-base", isSelected ? "font-semibold" : "font-normal")}
                    style={{ color: isSelected ? "#EDE8E0" : "#D8D1C6" }}
                  >
                    {copy.name}
                  </span>
                  {isSelected && (
                    <span
                      className="shrink-0 text-xs tracking-[0.08em]"
                      style={{ color: "#B5AC9F" }}
                    >
                      ✓ SELECTED
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "#A69C8D" }}>
                  {copy.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Microcopy */}
        <p className="mt-3 text-center text-xs" style={{ color: "#7A7060" }}>
          Remembers your last choice
        </p>

        {/* CTA */}
        <div className="px-6 pt-4 pb-6">
          <Button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full h-[52px] rounded-[10px] font-semibold hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#D4A44C", color: "#1A1200" }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Pulling up a chair...
              </>
            ) : (
              "Pull up a chair"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TastingModeModal;
