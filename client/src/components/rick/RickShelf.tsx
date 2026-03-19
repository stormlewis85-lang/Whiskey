import { useState } from "react";
import { Wine, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Whiskey } from "@shared/schema";
import type { RickSuggestion } from "@/lib/rick-suggestions";
import { cn } from "@/lib/utils";

interface RickShelfProps {
  suggestions: RickSuggestion[];
  availableWhiskeys: Whiskey[];
  onSelectWhiskey: (whiskey: Whiskey) => void;
}

export function RickShelf({ suggestions, availableWhiskeys, onSelectWhiskey }: RickShelfProps) {
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
          <Wine className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
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
  onTap,
}: {
  suggestion: RickSuggestion;
  onTap: () => void;
}) {
  const { whiskey, secondWhiskey, prompt, type } = suggestion;
  const isComparison = type === "head-to-head" && secondWhiskey;

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
          <p className="text-xs text-primary mt-2 font-medium">Taste with Rick</p>
        </div>
      </div>
    </button>
  );
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
        <Wine className="w-5 h-5 text-muted-foreground/40" />
      )}
    </div>
  );
}
