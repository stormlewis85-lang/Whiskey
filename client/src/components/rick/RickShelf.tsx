import { useState } from "react";
import { ChevronDown, Star } from "lucide-react";
import { GlencairnIcon } from "@/components/GlencairnIcon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Whiskey } from "@shared/schema";
import type { RickSuggestion } from "@/lib/rick-suggestions";
import { cn } from "@/lib/utils";

// ── 1e — Shelf provenance ──
// Spec: scratchpad/design/rick-session-surfaces-spec.md §1e.
// Provenance lines only render when the underlying data exists (no
// "★ undefined", no empty separators). The ★ glyph is the only gold in this
// slice — "Taste with Rick" stays non-gold.

// Minimal session shape needed to derive "Last tasted with Rick" — matches
// the fields already present on RickHouse's SessionHistoryItem.
export interface ShelfSessionInfo {
  whiskeyId: number;
  completedAt: string | null;
}

interface RickShelfProps {
  suggestions: RickSuggestion[];
  availableWhiskeys: Whiskey[];
  sessions: ShelfSessionInfo[];
  onSelectWhiskey: (whiskey: Whiskey) => void;
}

export function RickShelf({ suggestions, availableWhiskeys, sessions, onSelectWhiskey }: RickShelfProps) {
  const [showManual, setShowManual] = useState(suggestions.length === 0);
  const [manualId, setManualId] = useState("");

  const handleManualSelect = (id: string) => {
    setManualId(id);
    const w = availableWhiskeys.find((w) => String(w.id) === id);
    if (w) onSelectWhiskey(w);
  };

  return (
    <section className="px-5 space-y-4">
      {/* Suggestion cards */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <SuggestionCard
              key={`${s.whiskey.id}-${s.secondWhiskey?.id || ""}`}
              suggestion={s}
              sessions={sessions}
              onTap={() => onSelectWhiskey(s.whiskey)}
            />
          ))}
        </div>
      )}

      {/* Choose your own */}
      {availableWhiskeys.length > 0 && (
        <div className="pt-2">
          {!showManual ? (
            <button
              onClick={() => setShowManual(true)}
              className="flex items-center gap-1.5 mx-auto bg-transparent border-none cursor-pointer text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              <span>Or choose your own</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="space-y-2">
              {suggestions.length > 0 && (
                <p className="text-muted-foreground text-xs uppercase tracking-wider text-center">
                  Or choose your own
                </p>
              )}
              <Select value={manualId} onValueChange={handleManualSelect}>
                <SelectTrigger className="bg-card border-border/50">
                  <SelectValue placeholder="Select a bottle..." />
                </SelectTrigger>
                <SelectContent>
                  {availableWhiskeys.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Empty collection */}
      {availableWhiskeys.length === 0 && (
        <div className="text-center py-8">
          <GlencairnIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Add bottles to your collection to get started with Rick.
          </p>
        </div>
      )}
    </section>
  );
}

function SuggestionCard({
  suggestion,
  sessions,
  onTap,
}: {
  suggestion: RickSuggestion;
  sessions: ShelfSessionInfo[];
  onTap: () => void;
}) {
  const { whiskey, secondWhiskey, prompt, type } = suggestion;
  const isComparison = type === "head-to-head" && secondWhiskey;

  // "★ {score} · Your review · {Mon YYYY}" — only when a rating AND a review
  // date exist (never render a partial/undefined provenance line).
  const hasReview = !!whiskey.rating && whiskey.rating > 0 && !!whiskey.lastReviewed;
  const reviewMeta = hasReview
    ? `${Number(whiskey.rating).toFixed(1)} · Your review · ${formatMonYear(whiskey.lastReviewed as unknown as string)}`
    : null;

  // "Last tasted with Rick · {Mon D}" — only when a completed session exists
  // for this bottle; most recent completion wins.
  const lastCompleted = sessions
    .filter((s) => s.whiskeyId === whiskey.id && s.completedAt)
    .sort((a, b) => new Date(b.completedAt as string).getTime() - new Date(a.completedAt as string).getTime())[0];
  const lastTastedMeta = lastCompleted
    ? `Last tasted with Rick · ${formatMonDay(lastCompleted.completedAt as string)}`
    : null;

  return (
    <button
      onClick={onTap}
      className={cn(
        "w-full text-left bg-card border border-border/50 rounded-xl p-4",
        "transition-all duration-200 cursor-pointer",
        "hover:border-primary/30 hover:shadow-warm-sm",
        "active:scale-[0.98]",
      )}
    >
      <div className="flex gap-3">
        {/* Bottle image(s) */}
        <div className="flex shrink-0">
          <BottleThumbnail image={whiskey.image} name={whiskey.name} />
          {isComparison && (
            <BottleThumbnail
              image={secondWhiskey.image}
              name={secondWhiskey.name}
              className="-ml-3"
            />
          )}
        </div>

        {/* Prompt */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/90 leading-relaxed">{prompt}</p>

          {(reviewMeta || lastTastedMeta) && (
            <div className="mt-2 space-y-1">
              {reviewMeta && (
                <p className="text-[13px] flex items-center gap-1" style={{ color: "#A69C8D" }}>
                  <Star className="w-3 h-3 shrink-0" style={{ color: "#D4A44C" }} fill="#D4A44C" />
                  {reviewMeta}
                </p>
              )}
              {lastTastedMeta && (
                <p className="text-[12px]" style={{ color: "#7A7060" }}>
                  {lastTastedMeta}
                </p>
              )}
            </div>
          )}

          <p className="text-xs mt-2 font-medium" style={{ color: "#D8D1C6" }}>
            Taste with Rick
          </p>
        </div>
      </div>
    </button>
  );
}

function formatMonYear(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatMonDay(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function BottleThumbnail({
  image,
  name,
  className,
}: {
  image: string | null;
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-11 h-11 rounded-lg overflow-hidden bg-accent/30 flex items-center justify-center border border-border/30",
        className,
      )}
    >
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <GlencairnIcon className="w-5 h-5 text-muted-foreground/40" />
      )}
    </div>
  );
}
