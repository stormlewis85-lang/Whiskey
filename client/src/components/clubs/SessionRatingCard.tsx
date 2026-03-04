import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionRatingCardProps {
  label: string;
  existingRating?: number;
  existingNotes?: string;
  onSubmit: (rating: number, notes?: string) => void;
  isPending?: boolean;
}

export function SessionRatingCard({
  label,
  existingRating,
  existingNotes,
  onSubmit,
  isPending,
}: SessionRatingCardProps) {
  const [rating, setRating] = useState(existingRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [notes, setNotes] = useState(existingNotes || "");

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-bold text-primary">{label}</span>
          </div>
          <span className="font-medium text-foreground">Sample {label}</span>
        </div>

        {/* Star rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-0.5 bg-transparent border-none cursor-pointer"
            >
              <Star
                className={cn(
                  "w-7 h-7 transition-colors",
                  (hoveredRating || rating) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
          )}
        </div>

        {/* Notes */}
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tasting notes (optional)..."
          rows={2}
          className="mb-3"
        />

        <Button
          size="sm"
          onClick={() => onSubmit(rating, notes || undefined)}
          disabled={rating === 0 || isPending}
          className="w-full"
        >
          {existingRating ? "Update Rating" : "Submit Rating"}
        </Button>
      </CardContent>
    </Card>
  );
}
