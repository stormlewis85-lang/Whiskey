import type { Whiskey } from "@shared/schema";

export interface RickSuggestion {
  type: "head-to-head" | "blind-spot" | "unreviewed" | "re-taste";
  whiskey: Whiskey;
  secondWhiskey?: Whiskey;
  prompt: string;
}

interface SessionInfo {
  whiskeyId: number;
  completedAt: string | null;
  startedAt: string;
}

/**
 * Generate up to 3 Rick House tasting suggestions from the user's collection.
 * Priority: head-to-head > blind-spot > unreviewed > re-taste.
 */
export function generateSuggestions(
  whiskeys: Whiskey[],
  sessions: SessionInfo[],
): RickSuggestion[] {
  const owned = whiskeys.filter((w) => !w.isWishlist && w.status !== "finished");
  if (owned.length === 0) return [];

  const suggestions: RickSuggestion[] = [];
  const usedIds = new Set<number>();

  const tastedIds = new Set(sessions.map((s) => s.whiskeyId));

  // ── Priority 1: Head-to-head comparisons ──
  const byDistillery = groupBy(owned, (w) => w.distillery?.toLowerCase().trim());
  for (const [distillery, bottles] of Object.entries(byDistillery)) {
    if (!distillery || bottles.length < 2 || suggestions.length >= 3) break;
    // Prefer pairs with different ages or expressions
    const sorted = [...bottles].sort((a, b) => (a.age || 0) - (b.age || 0));
    const a = sorted[0];
    const b = sorted[sorted.length - 1];
    if (a.id === b.id) continue;

    const detail = a.age && b.age && a.age !== b.age
      ? `the ${a.age}-year and the ${b.age}-year`
      : `two different expressions`;

    suggestions.push({
      type: "head-to-head",
      whiskey: a,
      secondWhiskey: b,
      prompt: `You've got ${detail} from ${a.distillery}. Side by side, the differences tell a story.`,
    });
    usedIds.add(a.id);
    usedIds.add(b.id);
  }

  // Also check same mashBill, different brand
  if (suggestions.length < 3) {
    const byMash = groupBy(
      owned.filter((w) => w.mashBill && !usedIds.has(w.id)),
      (w) => w.mashBill?.toLowerCase().trim(),
    );
    for (const [mash, bottles] of Object.entries(byMash)) {
      if (!mash || bottles.length < 2 || suggestions.length >= 3) break;
      const diffDistillery = findPairWithDifferentKey(bottles, (w) => w.distillery);
      if (!diffDistillery) continue;
      const [a, b] = diffDistillery;
      suggestions.push({
        type: "head-to-head",
        whiskey: a,
        secondWhiskey: b,
        prompt: `Same ${a.mashBill} mash bill, different houses. ${a.name} versus ${b.name} — let's see who does it better.`,
      });
      usedIds.add(a.id);
      usedIds.add(b.id);
    }
  }

  // ── Priority 2: Blind spot nudge ──
  if (suggestions.length < 3) {
    const reviewed = owned.filter((w) => (w.notes as any[])?.length > 0);
    const reviewsByType = countBy(reviewed, (w) => w.type?.toLowerCase().trim() || "unknown");
    const totalReviews = reviewed.length;

    if (totalReviews >= 3) {
      // Find the dominant type
      const dominant = Object.entries(reviewsByType).sort((a, b) => b[1] - a[1])[0];
      if (dominant && dominant[1] / totalReviews >= 0.6) {
        // Find an owned bottle of a DIFFERENT type that hasn't been used
        const neglectedBottle = owned.find(
          (w) =>
            w.type &&
            w.type.toLowerCase().trim() !== dominant[0] &&
            !usedIds.has(w.id),
        );
        if (neglectedBottle) {
          suggestions.push({
            type: "blind-spot",
            whiskey: neglectedBottle,
            prompt: `You've been on a ${dominant[0]} streak. That ${neglectedBottle.name} might surprise you.`,
          });
          usedIds.add(neglectedBottle.id);
        }
      }
    }
  }

  // ── Priority 3: Unreviewed bottles ──
  if (suggestions.length < 3) {
    const unreviewed = owned.filter(
      (w) => !usedIds.has(w.id) && (!w.notes || (w.notes as any[]).length === 0),
    );
    for (const w of unreviewed) {
      if (suggestions.length >= 3) break;
      const prompt =
        w.status === "sealed"
          ? `The ${w.name} has been waiting. Let's crack it open.`
          : `You've poured the ${w.name} but haven't sat with it yet. Let's fix that.`;
      suggestions.push({ type: "unreviewed", whiskey: w, prompt });
      usedIds.add(w.id);
    }
  }

  // ── Priority 4: Re-taste (60+ days, high rating) ──
  if (suggestions.length < 3) {
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const candidates = owned
      .filter(
        (w) =>
          !usedIds.has(w.id) &&
          w.rating >= 4 &&
          w.lastReviewed &&
          new Date(w.lastReviewed).getTime() < sixtyDaysAgo,
      )
      .sort((a, b) => b.rating - a.rating);

    for (const w of candidates) {
      if (suggestions.length >= 3) break;
      const month = w.lastReviewed
        ? new Date(w.lastReviewed).toLocaleDateString("en-US", { month: "long" })
        : "a while back";
      suggestions.push({
        type: "re-taste",
        whiskey: w,
        prompt: `You rated the ${w.name} a ${w.rating} back in ${month}. Palates evolve — worth another pour?`,
      });
      usedIds.add(w.id);
    }
  }

  return suggestions.slice(0, 3);
}

/**
 * Context-aware greeting for the atmosphere zone.
 */
export function getRickGreeting(
  userName: string | null,
  sessionCount: number,
  lastSessionToday: boolean,
): string {
  if (sessionCount === 0) {
    return "Welcome to the Rick House. Pull up a chair.";
  }
  if (lastSessionToday) {
    return "Back for another? I like the commitment.";
  }

  const hour = new Date().getHours();
  const name = userName || "friend";

  if (hour < 12) return "Morning pour? Bold choice.";
  if (hour < 17) return `Afternoon, ${name}. What are we nosing today?`;
  return "Evening. Perfect time to slow down with a glass.";
}

// ── Helpers ──

function groupBy<T>(arr: T[], keyFn: (item: T) => string | undefined): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of arr) {
    const key = keyFn(item);
    if (!key) continue;
    (map[key] ??= []).push(item);
  }
  return map;
}

function countBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of arr) {
    const key = keyFn(item);
    map[key] = (map[key] || 0) + 1;
  }
  return map;
}

function findPairWithDifferentKey<T>(
  items: T[],
  keyFn: (item: T) => string | null | undefined,
): [T, T] | null {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (keyFn(items[i]) !== keyFn(items[j])) return [items[i], items[j]];
    }
  }
  return null;
}
