import { useState, useCallback } from "react";
import { Whiskey } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PencilIcon, Star, Wine, Heart, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface WhiskeyCardProps {
  whiskey: Whiskey;
  onViewDetails: (whiskey: Whiskey) => void;
  onReview: (whiskey: Whiskey) => void;
  onEdit: (whiskey: Whiskey) => void;
}

const getStatusPill = (status: string | null | undefined): { label: string; className: string } | null => {
  switch (status) {
    case 'sealed': return { label: 'Sealed', className: 'bg-primary/15 text-primary border-primary/20' };
    case 'open': return { label: 'Open', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' };
    case 'finished': return { label: 'Finished', className: 'bg-muted text-muted-foreground border-border' };
    case 'gifted': return { label: 'Gifted', className: 'bg-pink-500/15 text-pink-400 border-pink-500/20' };
    default: return null;
  }
};

const WhiskeyCard = ({ whiskey, onViewDetails, onReview, onEdit }: WhiskeyCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const isMobile = useIsMobile();
  const rating = whiskey.rating || 0;
  const isWishlist = whiskey.isWishlist === true;
  const showImage = whiskey.image && !imageError;
  const statusPill = getStatusPill(whiskey.status);

  const handleMenuTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBottomSheet(true);
  }, []);

  return (
    <>
      <article
        className="group relative card-elevated card-interactive p-0 overflow-hidden cursor-pointer"
        onClick={() => onViewDetails(whiskey)}
      >
        {/* Image container */}
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

          {/* Type badge + status pill — top left */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {whiskey.type && (
              <span className="px-2 py-1 text-label-caps bg-background/80 backdrop-blur-sm rounded text-xs">
                {whiskey.type}
              </span>
            )}
            {statusPill && !isWishlist && (
              <span className={cn("px-2 py-0.5 text-xs font-medium rounded border", statusPill.className)}>
                {statusPill.label}
              </span>
            )}
          </div>

          {/* Mobile ⋯ menu handle — top right */}
          {isMobile && (
            <button
              onClick={handleMenuTap}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center"
              aria-label="Card actions"
            >
              <MoreHorizontal className="w-4 h-4 text-foreground" />
            </button>
          )}

          {/* Wishlist indicator — top right (desktop or when no menu) */}
          {isWishlist && !isMobile && (
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

        {/* Content */}
        <div className="p-5 space-y-3">
          <h3 className="text-whiskey-name text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {whiskey.name}
          </h3>

          <p className="text-sm text-muted-foreground">
            {whiskey.distillery || 'Unknown Distillery'}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-border/50">
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
            {whiskey.price && (
              <span className="text-sm font-semibold text-primary">${whiskey.price}</span>
            )}
          </div>
        </div>

        {/* Desktop-only hover actions */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-card via-card to-transparent hidden md:block translate-y-full group-hover:translate-y-0 transition-transform duration-300"
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

      {/* Mobile bottom sheet */}
      {showBottomSheet && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setShowBottomSheet(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-5 pb-8 safe-area-bottom animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-5" />
            <p className="text-sm text-muted-foreground mb-1 truncate">{whiskey.distillery}</p>
            <p className="font-heading text-lg text-foreground mb-5 line-clamp-1">{whiskey.name}</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => { setShowBottomSheet(false); onEdit(whiskey); }}
                variant="outline"
                className="w-full justify-start h-12 text-sm border-border/50"
              >
                <PencilIcon className="h-4 w-4 mr-3" />
                Edit
              </Button>
              <Button
                onClick={() => { setShowBottomSheet(false); onViewDetails(whiskey); }}
                variant="outline"
                className="w-full justify-start h-12 text-sm border-border/50"
              >
                <Wine className="h-4 w-4 mr-3" />
                Details
              </Button>
              <Button
                onClick={() => { setShowBottomSheet(false); onReview(whiskey); }}
                className="w-full justify-start h-12 text-sm bg-primary hover:bg-primary/90"
              >
                <Star className="h-4 w-4 mr-3" />
                Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WhiskeyCard;
