import { Whiskey } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { calculateAverageRating, calculateAveragePrice, calculateTotalValue } from "@/lib/utils/calculations";
import ExportButton from "./ExportButton";
import { Wine, Star, DollarSign, TrendingUp, Heart, Package, PackageOpen, CheckCircle2 } from "lucide-react";

interface CollectionStatsProps {
  whiskeys: Whiskey[];
}

const CollectionStats = ({ whiskeys }: CollectionStatsProps) => {
  // Filter out wishlist items for collection stats
  const collectionWhiskeys = whiskeys.filter(w => !w.isWishlist);
  const wishlistWhiskeys = whiskeys.filter(w => w.isWishlist);

  // Calculate total bottles (considering quantity)
  const totalBottles = collectionWhiskeys.reduce((sum, w) => sum + (w.quantity || 1), 0);
  const uniqueBottles = collectionWhiskeys.length;

  // Calculate status counts
  const sealedCount = collectionWhiskeys.filter(w => w.status === 'sealed').length;
  const openCount = collectionWhiskeys.filter(w => w.status === 'open').length;
  const finishedCount = collectionWhiskeys.filter(w => w.status === 'finished').length;

  const averageRating = calculateAverageRating(collectionWhiskeys);
  const averagePrice = calculateAveragePrice(collectionWhiskeys);
  const totalValue = calculateTotalValue(collectionWhiskeys);

  const primaryStats = [
    {
      label: "Total Bottles",
      value: totalBottles.toString(),
      subValue: uniqueBottles !== totalBottles ? `${uniqueBottles} unique` : undefined,
      icon: Wine,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Avg. Rating",
      value: averageRating,
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Total Value",
      value: `$${totalValue}`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Wishlist",
      value: wishlistWhiskeys.length.toString(),
      icon: Heart,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
  ];

  const statusStats = [
    {
      label: "Sealed",
      value: sealedCount,
      icon: Package,
      color: "text-blue-500",
    },
    {
      label: "Open",
      value: openCount,
      icon: PackageOpen,
      color: "text-emerald-500",
    },
    {
      label: "Finished",
      value: finishedCount,
      icon: CheckCircle2,
      color: "text-slate-500",
    },
  ];

  return (
    <Card className="bg-card border-border/50 shadow-warm-sm">
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-foreground">Collection Summary</h2>
        <ExportButton />
      </div>
      <CardContent className="pt-2 space-y-4">
        {/* Primary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {primaryStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center p-3 rounded-lg bg-accent/30 border border-border/30 transition-all hover:bg-accent/50"
            >
              <div className={`p-2 rounded-full ${stat.bgColor} mb-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-xs text-muted-foreground text-center">{stat.label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
              {stat.subValue && (
                <p className="text-xs text-muted-foreground">{stat.subValue}</p>
              )}
            </div>
          ))}
        </div>

        {/* Status breakdown */}
        {collectionWhiskeys.length > 0 && (
          <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/30">
            {statusStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}:</span>
                <span className="text-sm font-semibold text-foreground">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CollectionStats;
