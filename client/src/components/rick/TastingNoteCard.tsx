import { forwardRef } from "react";
import { Star } from "lucide-react";

interface TastingNoteCardProps {
  whiskeyName: string;
  distillery?: string | null;
  rating: number;
  ricksSummary: string;
  quip?: string;
  date: string;
  mode: "guided" | "notes";
}

/**
 * Premium shareable tasting note card — designed to be screenshotted.
 * High-end whiskey brand aesthetic with Glencairn glass mark.
 */
export const TastingNoteCard = forwardRef<HTMLDivElement, TastingNoteCardProps>(
  ({ whiskeyName, distillery, rating, ricksSummary, quip, date, mode }, ref) => {
    return (
      <div
        ref={ref}
        className="relative overflow-hidden rounded-2xl border border-primary/20"
        style={{
          background: "linear-gradient(165deg, hsl(30 10% 8%) 0%, hsl(25 15% 5%) 50%, hsl(30 10% 8%) 100%)",
        }}
      >
        {/* Subtle top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="px-6 pt-8 pb-6 space-y-6">
          {/* Glencairn glass watermark — top right */}
          <svg
            width="36"
            height="36"
            viewBox="58 36 84 114"
            fill="none"
            className="absolute top-6 right-6 text-primary/[0.08]"
          >
            <ellipse cx="100" cy="46" rx="14" ry="3.5" stroke="currentColor" strokeWidth="4" fill="none" />
            <path d="M86 46 C86 46 83 58 81 66 C76 76 68 88 68 102 C68 118 82 130 100 130 C118 130 132 118 132 102 C132 88 124 76 119 66 C117 58 114 46 114 46" stroke="currentColor" strokeWidth="4" fill="none" />
            <line x1="100" y1="130" x2="100" y2="140" stroke="currentColor" strokeWidth="4" />
            <ellipse cx="100" cy="142" rx="18" ry="4" stroke="currentColor" strokeWidth="4" fill="none" />
          </svg>

          {/* Header — whiskey name in display type */}
          <div className="space-y-1 pr-10">
            {distillery && (
              <p className="text-primary/60 text-xs uppercase tracking-[0.15em] font-medium">
                {distillery}
              </p>
            )}
            <h2 className="font-display text-2xl text-[#EDE9E3] leading-tight">
              {whiskeyName}
            </h2>
          </div>

          {/* Thin divider */}
          <div className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${s <= rating ? "text-primary fill-primary" : "text-[#EDE9E3]/15"}`}
              />
            ))}
            {rating > 0 && (
              <span className="text-primary/80 text-sm font-medium ml-1">{rating.toFixed(1)}</span>
            )}
          </div>

          {/* Rick's summary — the substance */}
          <p className="text-[#EDE9E3]/70 text-sm leading-relaxed">
            {ricksSummary}
          </p>

          {/* Rick's quip — personality */}
          {quip && (
            <p className="text-primary/50 text-sm italic">
              "{quip}"
            </p>
          )}

          {/* Footer — branding + date */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {/* Mini Glencairn mark */}
              <svg
                width="14"
                height="14"
                viewBox="58 36 84 114"
                fill="none"
                className="text-primary/40"
              >
                <ellipse cx="100" cy="46" rx="14" ry="3.5" stroke="currentColor" strokeWidth="5" fill="none" />
                <path d="M86 46 C86 46 83 58 81 66 C76 76 68 88 68 102 C68 118 82 130 100 130 C118 130 132 118 132 102 C132 88 124 76 119 66 C117 58 114 46 114 46" stroke="currentColor" strokeWidth="5" fill="none" />
              </svg>
              <span className="text-[#EDE9E3]/30 text-[0.65rem] uppercase tracking-[0.12em] font-medium">
                MyWhiskeyPedia
              </span>
            </div>
            <span className="text-[#EDE9E3]/20 text-[0.65rem] uppercase tracking-wider">
              {date}
            </span>
          </div>
        </div>
      </div>
    );
  },
);

TastingNoteCard.displayName = "TastingNoteCard";
