import { useMemo } from "react";
import { Whiskey, ReviewNote } from "@shared/schema";

// Palate profile shape from /api/users/:id/palate-profile
export interface PalateProfile {
  userId: number;
  reviewCount: number;
  topFlavors: {
    nose: { flavor: string; count: number }[];
    taste: { flavor: string; count: number }[];
    finish: { flavor: string; count: number }[];
    all: { flavor: string; count: number }[];
  };
  scoringTendencies: {
    averageOverall: number | null;
    averageNose: number | null;
    averageMouthfeel: number | null;
    averageTaste: number | null;
    averageFinish: number | null;
    averageValue: number | null;
    tendency: "generous" | "critical" | "balanced";
  };
  preferredTypes: { type: string; count: number }[];
  preferredDistilleries: { distillery: string; count: number }[];
}

export interface ValueBreakdown {
  totalPaid: number;
  totalMsrp: number;
  delta: number;
  avgPerBottle: number;
  count: number;
}

export interface GrowthPoint {
  month: string;
  added: number;
  cumulative: number;
}

export interface StatusCount {
  name: string;
  value: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  name: string;
}

export interface DistilleryRow {
  distillery: string;
  count: number;
  avgRating: number;
  totalSpend: number;
  avgPrice: number;
}

export interface FlavorRadarData {
  fruitFloral: number;
  sweet: number;
  spice: number;
  herbal: number;
  grain: number;
  oak: number;
}

export interface BucketData {
  name: string;
  avgRating: number;
  count: number;
}

export interface LocationRow {
  location: string;
  count: number;
  avgPrice: number;
  totalSpend: number;
}

function computeValueBreakdown(whiskeys: Whiskey[]): ValueBreakdown {
  const owned = whiskeys.filter((w) => !w.isWishlist);
  let totalPaid = 0;
  let totalMsrp = 0;
  let priceCount = 0;

  owned.forEach((w) => {
    const paid = w.pricePaid ?? w.price ?? 0;
    totalPaid += paid;
    totalMsrp += w.msrp ?? w.price ?? 0;
    if (paid > 0) priceCount++;
  });

  return {
    totalPaid,
    totalMsrp,
    delta: totalMsrp - totalPaid,
    avgPerBottle: priceCount > 0 ? totalPaid / priceCount : 0,
    count: owned.length,
  };
}

function computeGrowthTimeline(whiskeys: Whiskey[]): GrowthPoint[] {
  const owned = whiskeys.filter((w) => !w.isWishlist);
  const monthMap = new Map<string, number>();

  owned.forEach((w) => {
    if (!w.dateAdded) return;
    const d = new Date(w.dateAdded);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) || 0) + 1);
  });

  const sorted = Array.from(monthMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  let cumulative = 0;
  return sorted.map(([key, added]) => {
    cumulative += added;
    const [y, m] = key.split("-");
    const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString(
      "en-US",
      { month: "short", year: "2-digit" }
    );
    return { month: label, added, cumulative };
  });
}

function computeStatusBreakdown(whiskeys: Whiskey[]): StatusCount[] {
  const owned = whiskeys.filter((w) => !w.isWishlist);
  const map = new Map<string, number>();

  owned.forEach((w) => {
    const status = w.status || "sealed";
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    map.set(label, (map.get(label) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function computePriceRatingScatter(whiskeys: Whiskey[]): ScatterPoint[] {
  return whiskeys
    .filter(
      (w) =>
        !w.isWishlist &&
        (w.pricePaid || w.price) &&
        w.rating &&
        w.rating > 0
    )
    .map((w) => ({
      x: w.pricePaid ?? w.price ?? 0,
      y: w.rating ?? 0,
      name: w.name,
    }));
}

function computeDistilleryLoyalty(whiskeys: Whiskey[]): DistilleryRow[] {
  const owned = whiskeys.filter((w) => !w.isWishlist && w.distillery);
  const map = new Map<
    string,
    { count: number; totalRating: number; ratedCount: number; totalSpend: number; priceCount: number }
  >();

  owned.forEach((w) => {
    const key = w.distillery!;
    const entry = map.get(key) || {
      count: 0,
      totalRating: 0,
      ratedCount: 0,
      totalSpend: 0,
      priceCount: 0,
    };
    entry.count++;
    if (w.rating && w.rating > 0) {
      entry.totalRating += w.rating;
      entry.ratedCount++;
    }
    const price = w.pricePaid ?? w.price ?? 0;
    entry.totalSpend += price;
    if (price > 0) entry.priceCount++;
    map.set(key, entry);
  });

  return Array.from(map.entries())
    .map(([distillery, d]) => ({
      distillery,
      count: d.count,
      avgRating: d.ratedCount > 0 ? d.totalRating / d.ratedCount : 0,
      totalSpend: d.totalSpend,
      avgPrice: d.priceCount > 0 ? d.totalSpend / d.priceCount : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function computeFlavorRadar(whiskeys: Whiskey[]): FlavorRadarData | null {
  const fields = [
    "flavorProfileFruitFloral",
    "flavorProfileSweet",
    "flavorProfileSpice",
    "flavorProfileHerbal",
    "flavorProfileGrain",
    "flavorProfileOak",
  ] as const;

  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  fields.forEach((f) => {
    sums[f] = 0;
    counts[f] = 0;
  });

  whiskeys.forEach((w) => {
    if (!w.notes || !Array.isArray(w.notes)) return;
    (w.notes as ReviewNote[]).forEach((note) => {
      fields.forEach((f) => {
        const val = note[f];
        if (typeof val === "number" && val > 0) {
          sums[f] += val;
          counts[f]++;
        }
      });
    });
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total < 3) return null;

  return {
    fruitFloral:
      counts["flavorProfileFruitFloral"] > 0
        ? sums["flavorProfileFruitFloral"] / counts["flavorProfileFruitFloral"]
        : 0,
    sweet:
      counts["flavorProfileSweet"] > 0
        ? sums["flavorProfileSweet"] / counts["flavorProfileSweet"]
        : 0,
    spice:
      counts["flavorProfileSpice"] > 0
        ? sums["flavorProfileSpice"] / counts["flavorProfileSpice"]
        : 0,
    herbal:
      counts["flavorProfileHerbal"] > 0
        ? sums["flavorProfileHerbal"] / counts["flavorProfileHerbal"]
        : 0,
    grain:
      counts["flavorProfileGrain"] > 0
        ? sums["flavorProfileGrain"] / counts["flavorProfileGrain"]
        : 0,
    oak:
      counts["flavorProfileOak"] > 0
        ? sums["flavorProfileOak"] / counts["flavorProfileOak"]
        : 0,
  };
}

function computeAgeRating(whiskeys: Whiskey[]): ScatterPoint[] {
  return whiskeys
    .filter(
      (w) => !w.isWishlist && w.age && w.age > 0 && w.rating && w.rating > 0
    )
    .map((w) => ({
      x: w.age!,
      y: w.rating!,
      name: w.name,
    }));
}

function computeAbvSweetSpot(whiskeys: Whiskey[]): BucketData[] {
  const buckets = [
    { min: 80, max: 90, label: "80-89" },
    { min: 90, max: 100, label: "90-99" },
    { min: 100, max: 110, label: "100-109" },
    { min: 110, max: 120, label: "110-119" },
    { min: 120, max: 130, label: "120-129" },
    { min: 130, max: 150, label: "130-149" },
    { min: 150, max: Infinity, label: "150+" },
  ];

  const data = new Map<string, { total: number; count: number }>();
  buckets.forEach((b) => data.set(b.label, { total: 0, count: 0 }));

  whiskeys
    .filter((w) => !w.isWishlist && w.rating && w.rating > 0)
    .forEach((w) => {
      const proof = w.proof ?? (w.abv ? w.abv * 2 : null);
      if (!proof) return;
      const bucket = buckets.find((b) => proof >= b.min && proof < b.max);
      if (!bucket) return;
      const entry = data.get(bucket.label)!;
      entry.total += w.rating!;
      entry.count++;
    });

  return buckets
    .map((b) => {
      const entry = data.get(b.label)!;
      return {
        name: b.label,
        avgRating: entry.count > 0 ? parseFloat((entry.total / entry.count).toFixed(2)) : 0,
        count: entry.count,
      };
    })
    .filter((d) => d.count > 0);
}

function computeMashBillPerformance(whiskeys: Whiskey[]): BucketData[] {
  const map = new Map<string, { total: number; count: number }>();

  whiskeys
    .filter(
      (w) => !w.isWishlist && w.mashBill && w.rating && w.rating > 0
    )
    .forEach((w) => {
      const entry = map.get(w.mashBill!) || { total: 0, count: 0 };
      entry.total += w.rating!;
      entry.count++;
      map.set(w.mashBill!, entry);
    });

  return Array.from(map.entries())
    .map(([name, d]) => ({
      name,
      avgRating: parseFloat((d.total / d.count).toFixed(2)),
      count: d.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating);
}

function computeBottleTypeAnalysis(whiskeys: Whiskey[]): BucketData[] {
  const map = new Map<string, { total: number; count: number }>();

  whiskeys
    .filter(
      (w) => !w.isWishlist && w.bottleType && w.rating && w.rating > 0
    )
    .forEach((w) => {
      const entry = map.get(w.bottleType!) || { total: 0, count: 0 };
      entry.total += w.rating!;
      entry.count++;
      map.set(w.bottleType!, entry);
    });

  return Array.from(map.entries())
    .map(([name, d]) => ({
      name,
      avgRating: parseFloat((d.total / d.count).toFixed(2)),
      count: d.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating);
}

function computeCaskFinishImpact(
  whiskeys: Whiskey[]
): { name: string; avgRating: number; count: number }[] {
  const finishedMap = new Map<string, { total: number; count: number }>();
  let unfinishedTotal = 0;
  let unfinishedCount = 0;

  whiskeys
    .filter((w) => !w.isWishlist && w.rating && w.rating > 0)
    .forEach((w) => {
      if (w.finished === "Yes" && w.finishType) {
        const entry = finishedMap.get(w.finishType) || { total: 0, count: 0 };
        entry.total += w.rating!;
        entry.count++;
        finishedMap.set(w.finishType, entry);
      } else {
        unfinishedTotal += w.rating!;
        unfinishedCount++;
      }
    });

  const results: BucketData[] = [];

  if (unfinishedCount > 0) {
    results.push({
      name: "No Finish",
      avgRating: parseFloat((unfinishedTotal / unfinishedCount).toFixed(2)),
      count: unfinishedCount,
    });
  }

  finishedMap.forEach((d, name) => {
    results.push({
      name,
      avgRating: parseFloat((d.total / d.count).toFixed(2)),
      count: d.count,
    });
  });

  return results.sort((a, b) => b.avgRating - a.avgRating);
}

function computePurchaseLocations(whiskeys: Whiskey[]): LocationRow[] {
  const map = new Map<
    string,
    { count: number; totalSpend: number; priceCount: number }
  >();

  whiskeys
    .filter((w) => !w.isWishlist && w.purchaseLocation)
    .forEach((w) => {
      const entry = map.get(w.purchaseLocation!) || {
        count: 0,
        totalSpend: 0,
        priceCount: 0,
      };
      entry.count++;
      const price = w.pricePaid ?? w.price ?? 0;
      entry.totalSpend += price;
      if (price > 0) entry.priceCount++;
      map.set(w.purchaseLocation!, entry);
    });

  return Array.from(map.entries())
    .map(([location, d]) => ({
      location,
      count: d.count,
      avgPrice: d.priceCount > 0 ? d.totalSpend / d.priceCount : 0,
      totalSpend: d.totalSpend,
    }))
    .sort((a, b) => b.count - a.count);
}

export function useAnalyticsData(
  whiskeys: Whiskey[] | undefined,
  palateProfile: PalateProfile | undefined
) {
  return useMemo(() => {
    if (!whiskeys) {
      return {
        valueBreakdown: null,
        growthTimeline: [],
        statusBreakdown: [],
        priceRatingScatter: [],
        distilleryLoyalty: [],
        flavorRadar: null,
        ageRating: [],
        abvSweetSpot: [],
        mashBillPerformance: [],
        bottleTypeAnalysis: [],
        caskFinishImpact: [],
        purchaseLocations: [],
        wishlistCount: 0,
        ownedCount: 0,
      };
    }

    return {
      valueBreakdown: computeValueBreakdown(whiskeys),
      growthTimeline: computeGrowthTimeline(whiskeys),
      statusBreakdown: computeStatusBreakdown(whiskeys),
      priceRatingScatter: computePriceRatingScatter(whiskeys),
      distilleryLoyalty: computeDistilleryLoyalty(whiskeys),
      flavorRadar: computeFlavorRadar(whiskeys),
      ageRating: computeAgeRating(whiskeys),
      abvSweetSpot: computeAbvSweetSpot(whiskeys),
      mashBillPerformance: computeMashBillPerformance(whiskeys),
      bottleTypeAnalysis: computeBottleTypeAnalysis(whiskeys),
      caskFinishImpact: computeCaskFinishImpact(whiskeys),
      purchaseLocations: computePurchaseLocations(whiskeys),
      wishlistCount: whiskeys.filter((w) => w.isWishlist).length,
      ownedCount: whiskeys.filter((w) => !w.isWishlist).length,
    };
  }, [whiskeys, palateProfile]);
}
