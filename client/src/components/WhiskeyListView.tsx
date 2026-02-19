import { useState } from "react";
import { Whiskey } from "@shared/schema";
import { Star, Wine, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWhiskeyName } from "@/lib/utils/formatName";

interface WhiskeyListViewProps {
  whiskeys: Whiskey[];
  onViewDetails: (whiskey: Whiskey) => void;
  onReview: (whiskey: Whiskey) => void;
  onEdit: (whiskey: Whiskey) => void;
}

const statusLabel: Record<string, string> = {
  sealed: "Sealed",
  open: "Open",
  finished: "Finished",
  gifted: "Gifted",
};

const statusColor: Record<string, string> = {
  sealed: "text-primary",
  open: "text-emerald-500",
  finished: "text-muted-foreground",
  gifted: "text-pink-500",
};

const WhiskeyListView = ({ whiskeys, onViewDetails, onReview, onEdit }: WhiskeyListViewProps) => {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = (id: number) => {
    setImageErrors(prev => new Set(prev).add(id));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-left">
            <th className="pb-3 pr-3 font-medium text-muted-foreground w-12"></th>
            <th className="pb-3 pr-3 font-medium text-muted-foreground">Name</th>
            <th className="pb-3 pr-3 font-medium text-muted-foreground hidden sm:table-cell">Distillery</th>
            <th className="pb-3 pr-3 font-medium text-muted-foreground hidden md:table-cell">Type</th>
            <th className="pb-3 pr-3 font-medium text-muted-foreground">Rating</th>
            <th className="pb-3 pr-3 font-medium text-muted-foreground hidden sm:table-cell text-right">Price</th>
            <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Status</th>
          </tr>
        </thead>
        <tbody>
          {whiskeys.map((whiskey) => {
            const rating = whiskey.rating || 0;
            const isWishlist = whiskey.isWishlist === true;
            const showImage = whiskey.image && !imageErrors.has(whiskey.id);

            return (
              <tr
                key={whiskey.id}
                className="border-b border-border/30 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onViewDetails(whiskey)}
              >
                {/* Thumbnail */}
                <td className="py-2.5 pr-3">
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-muted/50 flex items-center justify-center shrink-0">
                    {showImage ? (
                      <img
                        src={whiskey.image!}
                        alt={whiskey.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(whiskey.id)}
                      />
                    ) : (
                      <Wine className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>
                </td>

                {/* Name */}
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[280px]">
                      {formatWhiskeyName(whiskey.name)}
                    </span>
                    {isWishlist && (
                      <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 shrink-0" />
                    )}
                  </div>
                  {/* Distillery on mobile (hidden column shown inline) */}
                  <span className="text-xs text-muted-foreground sm:hidden truncate block">
                    {whiskey.distillery || "Unknown"}
                  </span>
                </td>

                {/* Distillery */}
                <td className="py-2.5 pr-3 hidden sm:table-cell">
                  <span className="text-muted-foreground truncate block max-w-[180px]">
                    {whiskey.distillery || "—"}
                  </span>
                </td>

                {/* Type */}
                <td className="py-2.5 pr-3 hidden md:table-cell">
                  <span className="text-muted-foreground">{whiskey.type || "—"}</span>
                </td>

                {/* Rating */}
                <td className="py-2.5 pr-3">
                  {rating > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>

                {/* Price */}
                <td className="py-2.5 pr-3 hidden sm:table-cell text-right">
                  {whiskey.price ? (
                    <span className="font-semibold text-primary">${whiskey.price}</span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="py-2.5 hidden lg:table-cell">
                  {whiskey.status && !isWishlist ? (
                    <span className={cn("text-xs font-medium", statusColor[whiskey.status] || "text-muted-foreground")}>
                      {statusLabel[whiskey.status] || whiskey.status}
                    </span>
                  ) : isWishlist ? (
                    <span className="text-xs font-medium text-pink-500">Wishlist</span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WhiskeyListView;
