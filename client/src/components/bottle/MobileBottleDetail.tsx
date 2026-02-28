import { BottleHero } from "./BottleHero";
import { BottleInfo } from "./BottleInfo";
import { BottleQuickStats } from "./BottleQuickStats";
import { BottleActions } from "./BottleActions";
import { RickHouseCard } from "./RickHouseCard";
import type { Whiskey } from "@shared/schema";

interface MobileBottleDetailProps {
  whiskey: Whiskey;
  onBack: () => void;
  onAddToCollection?: () => void;
  onReview?: () => void;
  onStartTasting?: () => void;
}

export function MobileBottleDetail({
  whiskey,
  onBack,
  onAddToCollection,
  onReview,
  onStartTasting,
}: MobileBottleDetailProps) {
  const rating = whiskey.rating || 0;
  const reviewCount = (whiskey as any).notes?.length || 0;
  const subtitle = [whiskey.type, whiskey.abv ? `${whiskey.abv}% ABV` : null]
    .filter(Boolean)
    .join(" · ");

  const stats = [
    { value: whiskey.price ? `$${whiskey.price}` : "N/A", label: "MSRP" },
    { value: whiskey.proof ? `${whiskey.proof}°` : "N/A", label: "Proof" },
    { value: whiskey.age ? `${whiskey.age}yr` : "NAS", label: "Age" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <BottleHero
        imageUrl={whiskey.image || undefined}
        onBack={onBack}
      />
      <BottleInfo
        distillery={whiskey.distillery || "Unknown Distillery"}
        name={whiskey.name}
        subtitle={subtitle || "Whiskey"}
        rating={rating}
        reviewCount={reviewCount}
      />
      <BottleQuickStats stats={stats} />
      <BottleActions
        onAddToCollection={onAddToCollection}
        onReview={onReview}
      />
      <RickHouseCard onStartSession={onStartTasting} />
    </div>
  );
}
