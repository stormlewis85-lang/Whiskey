import { useState } from "react";
import { Whiskey } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PencilIcon, Star, Wine, Heart, Package, PackageOpen, Gift, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhiskeyCardProps {
  whiskey: Whiskey;
  onViewDetails: (whiskey: Whiskey) => void;
  onReview: (whiskey: Whiskey) => void;
  onEdit: (whiskey: Whiskey) => void;
}

// Status dot color
const getStatusColor = (status: string | null | undefined) => {
  switch (status) {
    case 'sealed': return 'bg-primary';
    case 'open': return 'bg-emerald-500';
    case 'finished': return 'bg-muted-foreground';
    case 'gifted': return 'bg-pink-500';
    default: return '';
  }
};

const WhiskeyCard = ({ whiskey, onViewDetails, onReview, onEdit }: WhiskeyCardProps) => {
  const [imageError, setImageError] = useState(false);
  const rating = whiskey.rating || 0;
  const isWishlist = whiskey.isWishlist === true;
  const showImage = whiskey.image && !imageError;

  return (
    <article
      className="group relative card-elevated card-interactive p-0 overflow-hidden cursor-pointer"
      onClick={() => onViewDetails(whiskey)}
    >
      {/* Image container - editorial aspect ratio */}
      <div className="relative aspect-[4/5] bg-gradient-to-b from-muted/30 to-background overflow-hidden">

        {/* Ambient glow on hover */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {showImage ? (
          <img
            src={whiskey.image!}
            alt={`Bottle of ${whiskey.name}`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Wine className="w-20 h-32 text-muted-foreground/20" />
          </div>
        )}

        {/* Type badge - top left, minimal */}
        {whiskey.type && (
          <span className="absolute top-4 left-4 px-2 py-1 text-label-caps bg-background/80 backdrop-blur-sm rounded text-xs">
            {whiskey.type}
          </span>
        )}

        {/* Status dot - top right */}
        {whiskey.status && !isWishlist && (
          <div className={cn(
            "absolute top-4 right-4 w-2.5 h-2.5 rounded-full",
            getStatusColor(whiskey.status)
          )} />
        )}

        {/* Wishlist indicator */}
        {isWishlist && (
          <div className="absolute top-4 right-4">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
          </div>
        )}

        {/* Quantity badge */}
        {(whiskey.quantity || 1) > 1 && (
          <span className="absolute bottom-4 left-4 px-2 py-0.5 text-xs font-bold bg-background/80 backdrop-blur-sm rounded text-foreground">
            x{whiskey.quantity}
          </span>
        )}
      </div>

      {/* Content - generous padding */}
      <div className="p-5 space-y-3">
        {/* Whiskey name - serif, prominent */}
        <h3 className="text-whiskey-name text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {whiskey.name}
        </h3>

        {/* Distillery */}
        <p className="text-sm text-muted-foreground">
          {whiskey.distillery || 'Unknown Distillery'}
        </p>

        {/* Rating and price row */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          {/* Rating - gold stars */}
          <div className="flex items-center gap-1.5">
            {rating > 0 ? (
              <>
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No rating</span>
            )}
          </div>

          {/* Price - gold text */}
          {whiskey.price && (
            <span className="text-sm font-semibold text-primary">${whiskey.price}</span>
          )}
        </div>
      </div>

      {/* Hover actions - slide up from bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-card via-card to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => onEdit(whiskey)}
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
            title="Edit whiskey"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={() => onViewDetails(whiskey)}
            variant="outline"
            size="sm"
            className="flex-1 h-9 text-sm border-border/50"
          >
            Details
          </Button>
          <Button
            type="button"
            onClick={() => onReview(whiskey)}
            size="sm"
            className="flex-1 h-9 text-sm bg-primary hover:bg-primary/90"
          >
            Review
          </Button>
        </div>
      </div>
    </article>
  );
};

export default WhiskeyCard;
