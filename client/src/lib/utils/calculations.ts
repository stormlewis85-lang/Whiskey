import { Whiskey } from "@shared/schema";

/**
 * Calculate the average rating for a collection of whiskeys
 */
export function calculateAverageRating(whiskeys: Whiskey[]): string {
  if (!whiskeys.length) return "0.0";
  
  // Filter out whiskeys without a rating
  const whiskiesWithRating = whiskeys.filter(w => typeof w.rating === 'number');
  
  if (!whiskiesWithRating.length) return "0.0";
  
  const sum = whiskiesWithRating.reduce((acc, w) => acc + (w.rating || 0), 0);
  return (sum / whiskiesWithRating.length).toFixed(1);
}

/**
 * Calculate the average price for a collection of whiskeys
 */
export function calculateAveragePrice(whiskeys: Whiskey[]): string {
  if (!whiskeys.length) return "0";
  
  // Filter out whiskeys without a price
  const whiskiesWithPrice = whiskeys.filter(w => typeof w.price === 'number');
  
  if (!whiskiesWithPrice.length) return "0";
  
  const sum = whiskiesWithPrice.reduce((acc, w) => acc + (w.price || 0), 0);
  return Math.round(sum / whiskiesWithPrice.length).toString();
}

/**
 * Calculate the total value of a whiskey collection
 */
export function calculateTotalValue(whiskeys: Whiskey[]): string {
  if (!whiskeys.length) return "0";
  
  const total = whiskeys.reduce((acc, w) => acc + (w.price || 0), 0);
  return total.toFixed(0);
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}
