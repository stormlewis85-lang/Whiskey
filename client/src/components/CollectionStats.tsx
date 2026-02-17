import { Whiskey } from "@shared/schema";
import { calculateAverageRating, calculateAveragePrice, calculateTotalValue } from "@/lib/utils/calculations";
import ExportButton from "./ExportButton";
import { Wine, Star, TrendingUp, Heart } from "lucide-react";

interface CollectionStatsProps {
  whiskeys: Whiskey[];
}

const CollectionStats = ({ whiskeys }: CollectionStatsProps) => {
  const collectionWhiskeys = whiskeys.filter(w => !w.isWishlist);
  const wishlistWhiskeys = whiskeys.filter(w => w.isWishlist);

  const totalBottles = collectionWhiskeys.reduce((sum, w) => sum + (w.quantity || 1), 0);
  const uniqueBottles = collectionWhiskeys.length;

  const averageRating = calculateAverageRating(collectionWhiskeys);
  const totalValue = calculateTotalValue(collectionWhiskeys);

  const stats = [
    {
      label: "Total Bottles",
      value: totalBottles.toString(),
      context: uniqueBottles !== totalBottles ? `${uniqueBottles} unique` : undefined,
    },
    {
      label: "Avg. Rating",
      value: averageRating,
    },
    {
      label: "Total Value",
      value: `$${totalValue}`,
    },
    {
      label: "Wishlist",
      value: wishlistWhiskeys.length.toString(),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-display-section text-foreground">Overview</h2>
        <ExportButton />
      </div>

      {/* Stats grid - label-first hierarchy, The Macallan style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card-elevated p-4 md:p-6"
          >
            <p className="text-label-caps mb-2">{stat.label}</p>
            <p className="text-2xl md:text-3xl font-semibold tabular-nums text-foreground truncate">
              {stat.value}
            </p>
            {stat.context && (
              <p className="text-sm text-muted-foreground mt-1">{stat.context}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectionStats;
