import { Whiskey } from "@shared/schema";

/**
 * Format a date in MM/DD/YYYY format
 */
export const formatDate = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

/**
 * Calculate the average rating of all rated whiskeys in the collection
 */
export const calculateAverageRating = (whiskeys: Whiskey[]): string => {
  if (!whiskeys || whiskeys.length === 0) return "0.0";
  
  const ratedWhiskeys = whiskeys.filter(w => w.rating !== null && w.rating !== undefined);
  if (ratedWhiskeys.length === 0) return "0.0";
  
  const sum = ratedWhiskeys.reduce((acc, whiskey) => acc + (whiskey.rating || 0), 0);
  return (sum / ratedWhiskeys.length).toFixed(1);
};

/**
 * Calculate the average price of all whiskeys with a price in the collection
 */
export const calculateAveragePrice = (whiskeys: Whiskey[]): string => {
  if (!whiskeys || whiskeys.length === 0) return "0.00";
  
  const pricedWhiskeys = whiskeys.filter(w => w.price !== null && w.price !== undefined);
  if (pricedWhiskeys.length === 0) return "0.00";
  
  const sum = pricedWhiskeys.reduce((acc, whiskey) => acc + (whiskey.price || 0), 0);
  return (sum / pricedWhiskeys.length).toFixed(2);
};

/**
 * Calculate the total value of all whiskeys with a price in the collection
 */
export const calculateTotalValue = (whiskeys: Whiskey[]): string => {
  if (!whiskeys || whiskeys.length === 0) return "0.00";
  
  const sum = whiskeys.reduce((acc, whiskey) => acc + (whiskey.price || 0), 0);
  return sum.toFixed(2);
};

/**
 * Calculate the price per pour for a whiskey (bottle price ÷ 14)
 */
export const calculatePricePerPour = (price: number | null): string => {
  if (price === null || price === undefined) return "N/A";
  
  // Assume 14 pours per bottle
  const pricePerPour = price / 14;
  return `$${pricePerPour.toFixed(2)}`;
};