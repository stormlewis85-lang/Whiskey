import { Badge } from "@/components/ui/badge";
import { Whiskey, ReviewNote } from "@shared/schema";
import { cn } from "@/lib/utils";

interface FlavorTagsProps {
  whiskey: Whiskey;
  maxTags?: number;
  onFlavorClick?: (flavor: string) => void;
  size?: "sm" | "md";
  className?: string;
}

// Extract all flavors from a whiskey's reviews
export function extractFlavors(whiskey: Whiskey): string[] {
  const flavors = new Set<string>();

  if (!Array.isArray(whiskey.notes)) return [];

  for (const review of whiskey.notes as ReviewNote[]) {
    // Extract from nose aromas
    if (Array.isArray(review.noseAromas)) {
      review.noseAromas.forEach(f => flavors.add(f));
    }
    // Extract from taste flavors
    if (Array.isArray(review.tasteFlavors)) {
      review.tasteFlavors.forEach(f => flavors.add(f));
    }
    // Extract from finish flavors
    if (Array.isArray(review.finishFlavors)) {
      review.finishFlavors.forEach(f => flavors.add(f));
    }
  }

  return Array.from(flavors);
}

// Get top flavors by frequency
export function getTopFlavors(whiskey: Whiskey, limit: number = 5): string[] {
  const flavorCounts = new Map<string, number>();

  if (!Array.isArray(whiskey.notes)) return [];

  for (const review of whiskey.notes as ReviewNote[]) {
    const allFlavors = [
      ...(review.noseAromas || []),
      ...(review.tasteFlavors || []),
      ...(review.finishFlavors || [])
    ];

    for (const flavor of allFlavors) {
      flavorCounts.set(flavor, (flavorCounts.get(flavor) || 0) + 1);
    }
  }

  return Array.from(flavorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([flavor]) => flavor);
}

// Get all unique flavors across a collection
export function getAllFlavors(whiskeys: Whiskey[]): { flavor: string; count: number }[] {
  const flavorCounts = new Map<string, number>();

  for (const whiskey of whiskeys) {
    const flavors = extractFlavors(whiskey);
    for (const flavor of flavors) {
      flavorCounts.set(flavor, (flavorCounts.get(flavor) || 0) + 1);
    }
  }

  return Array.from(flavorCounts.entries())
    .map(([flavor, count]) => ({ flavor, count }))
    .sort((a, b) => b.count - a.count);
}

export function FlavorTags({
  whiskey,
  maxTags = 3,
  onFlavorClick,
  size = "sm",
  className
}: FlavorTagsProps) {
  const topFlavors = getTopFlavors(whiskey, maxTags);

  if (topFlavors.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {topFlavors.map((flavor) => (
        <Badge
          key={flavor}
          variant="outline"
          className={cn(
            "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 transition-colors",
            onFlavorClick && "cursor-pointer",
            size === "sm" ? "text-xs px-1.5 py-0" : "text-xs px-2 py-0.5"
          )}
          onClick={(e) => {
            if (onFlavorClick) {
              e.stopPropagation();
              onFlavorClick(flavor);
            }
          }}
        >
          {flavor}
        </Badge>
      ))}
    </div>
  );
}

// Flavor search/filter component
interface FlavorFilterProps {
  whiskeys: Whiskey[];
  selectedFlavor: string;
  onFlavorSelect: (flavor: string) => void;
  className?: string;
}

export function FlavorFilter({
  whiskeys,
  selectedFlavor,
  onFlavorSelect,
  className
}: FlavorFilterProps) {
  const allFlavors = getAllFlavors(whiskeys).slice(0, 20); // Top 20 flavors

  if (allFlavors.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium text-muted-foreground">Flavor Profile</div>
      <div className="flex flex-wrap gap-1.5">
        {selectedFlavor && (
          <Badge
            variant="default"
            className="bg-amber-500 text-white cursor-pointer"
            onClick={() => onFlavorSelect("")}
          >
            {selectedFlavor} ✕
          </Badge>
        )}
        {allFlavors
          .filter(f => f.flavor !== selectedFlavor)
          .slice(0, 12)
          .map(({ flavor, count }) => (
            <Badge
              key={flavor}
              variant="outline"
              className={cn(
                "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                "hover:bg-amber-500/20 cursor-pointer transition-colors"
              )}
              onClick={() => onFlavorSelect(flavor)}
            >
              {flavor}
              <span className="ml-1 text-amber-600/60 dark:text-amber-500/60">({count})</span>
            </Badge>
          ))}
      </div>
    </div>
  );
}

export default FlavorTags;
