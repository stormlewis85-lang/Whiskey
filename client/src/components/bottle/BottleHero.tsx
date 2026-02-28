import { ArrowLeft, Share2, Heart } from "lucide-react";

interface BottleHeroProps {
  imageUrl?: string;
  onBack?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

export function BottleHero({ imageUrl, onBack, onShare, onFavorite, isFavorited }: BottleHeroProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        height: "320px",
        background: "linear-gradient(180deg, rgba(212,164,76,0.06) 0%, transparent 60%)",
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute flex items-center justify-center rounded-full border-none cursor-pointer"
        style={{
          top: "48px",
          left: "20px",
          width: "36px",
          height: "36px",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(10px)",
        }}
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>

      {/* Action buttons */}
      <div
        className="absolute flex gap-2.5"
        style={{ top: "48px", right: "20px" }}
      >
        <button
          onClick={onShare}
          className="flex items-center justify-center rounded-full border-none cursor-pointer"
          style={{
            width: "36px",
            height: "36px",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(10px)",
          }}
          aria-label="Share"
        >
          <Share2 className="w-[18px] h-[18px] text-foreground" />
        </button>
        <button
          onClick={onFavorite}
          className="flex items-center justify-center rounded-full border-none cursor-pointer"
          style={{
            width: "36px",
            height: "36px",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(10px)",
          }}
          aria-label="Favorite"
        >
          <Heart className={`w-[18px] h-[18px] ${isFavorited ? "text-primary fill-primary" : "text-foreground"}`} />
        </button>
      </div>

      {/* Bottle image */}
      <div className="flex items-center justify-center" style={{ width: "100px", height: "200px" }}>
        {imageUrl ? (
          <img src={imageUrl} alt="Bottle" className="max-w-full max-h-full object-contain" />
        ) : (
          <svg
            width="80"
            height="160"
            viewBox="0 0 80 160"
            fill="none"
            className="text-primary"
            style={{ filter: "drop-shadow(0 10px 40px rgba(212,164,76,0.2))" }}
          >
            <rect x="28" y="0" width="24" height="20" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="24" y="20" width="32" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M16 34 L16 140 Q16 156 32 156 L48 156 Q64 156 64 140 L64 34 Z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M20 90 Q40 96 60 90 L60 140 Q60 152 48 152 L32 152 Q20 152 20 140 Z" fill="currentColor" opacity="0.15" />
          </svg>
        )}
      </div>
    </div>
  );
}
