import { Whiskey } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/calculations";
import { PencilIcon, Star, Wine, Heart, Package, PackageOpen, Gift, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlavorTags } from "@/components/FlavorTags";

interface WhiskeyCardProps {
  whiskey: Whiskey;
  onViewDetails: (whiskey: Whiskey) => void;
  onReview: (whiskey: Whiskey) => void;
  onEdit: (whiskey: Whiskey) => void;
}

// Helper function to get status badge config
const getStatusConfig = (status: string | null | undefined) => {
  switch (status) {
    case 'sealed':
      return { icon: Package, label: 'Sealed', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    case 'open':
      return { icon: PackageOpen, label: 'Open', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    case 'finished':
      return { icon: CheckCircle2, label: 'Finished', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
    case 'gifted':
      return { icon: Gift, label: 'Gifted', className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' };
    default:
      return null;
  }
};

const WhiskeyCard = ({ whiskey, onViewDetails, onReview, onEdit }: WhiskeyCardProps) => {
  const rating = whiskey.rating || 0;
  const hasNotes = Array.isArray(whiskey.notes) && whiskey.notes.length > 0;
  const statusConfig = getStatusConfig(whiskey.status);
  const isWishlist = whiskey.isWishlist === true;
  const quantity = whiskey.quantity || 1;

  return (
    <Card className={cn(
      "group overflow-hidden bg-card border-border/50 shadow-warm-sm hover:shadow-warm transition-all duration-300 hover:border-primary/30",
      isWishlist && "border-l-4 border-l-pink-500/50"
    )}>
      <div className="flex flex-col sm:flex-row h-full">
        {/* Left side: Image with 3:4 aspect ratio */}
        <div className="sm:w-1/3 relative bg-accent/30">
          <div className="aspect-[3/4] sm:h-full">
            {whiskey.image ? (
              <img
                src={whiskey.image}
                alt={`Bottle of ${whiskey.name}`}
                className="object-cover h-full w-full"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center p-4">
                <div className="border-2 border-dashed border-border/50 rounded-lg p-4 flex flex-col items-center justify-center h-[80%] w-[80%]">
                  <Wine className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <span className="text-xs text-muted-foreground/70">No Image</span>
                </div>
              </div>
            )}
            {/* Top badges: type, wishlist indicator */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
              {whiskey.type && (
                <Badge
                  variant="secondary"
                  className="bg-background/90 backdrop-blur-sm text-foreground border-border/50 text-xs font-medium"
                >
                  {whiskey.type}
                </Badge>
              )}
              {isWishlist && (
                <Badge
                  variant="outline"
                  className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 text-xs"
                >
                  <Heart className="h-3 w-3 mr-1 fill-current" />
                  Wishlist
                </Badge>
              )}
            </div>

            {/* Bottom badges: quantity, status */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              {quantity > 1 && (
                <Badge
                  variant="secondary"
                  className="bg-background/90 backdrop-blur-sm text-foreground border-border/50 text-xs font-bold"
                >
                  x{quantity}
                </Badge>
              )}
              {statusConfig && !isWishlist && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusConfig.className)}
                >
                  <statusConfig.icon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Whiskey details */}
        <CardContent className="p-4 sm:w-2/3 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {whiskey.name}
            </h3>
            <div className="flex justify-between items-center mt-1.5">
              <p className="text-sm text-muted-foreground truncate">
                {whiskey.distillery || 'Unknown Distillery'}
              </p>
              {whiskey.price && (
                <p className="text-sm font-semibold text-primary shrink-0 ml-2">
                  ${whiskey.price}
                </p>
              )}
            </div>

            {/* Bourbon badges */}
            {whiskey.type === "Bourbon" && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {whiskey.bottleType && whiskey.bottleType !== "none" && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                    {whiskey.bottleType}
                  </Badge>
                )}

                {whiskey.mashBill && whiskey.mashBill !== "none" && (
                  <Badge variant="outline" className="bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                    {whiskey.mashBill}
                  </Badge>
                )}

                {whiskey.caskStrength === "Yes" && (
                  <Badge variant="outline" className="bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/20 text-xs">
                    Cask Strength
                  </Badge>
                )}

                {whiskey.finished === "Yes" && (
                  <Badge variant="outline" className="bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs">
                    {whiskey.finishType ? `${whiskey.finishType} Finish` : 'Finished'}
                  </Badge>
                )}
              </div>
            )}

            {/* Flavor Tags */}
            {hasNotes && <FlavorTags whiskey={whiskey} maxTags={3} className="mt-2" />}

            {/* Rating */}
            <div className="flex items-center mt-3 gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-4 h-4 transition-colors",
                    star <= rating
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
              {hasNotes && (
                <span className="text-xs text-muted-foreground ml-1.5">
                  ({(whiskey.notes as any[]).length} {(whiskey.notes as any[]).length === 1 ? 'note' : 'notes'})
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
            <Button
              onClick={() => onEdit(whiskey)}
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
              title="Edit whiskey"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onViewDetails(whiskey)}
              variant="outline"
              size="sm"
              className="flex-1 h-9 border-border/50 hover:bg-accent/50"
            >
              Details
            </Button>
            <Button
              onClick={() => onReview(whiskey)}
              size="sm"
              className="flex-1 h-9"
            >
              Review
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default WhiskeyCard;
