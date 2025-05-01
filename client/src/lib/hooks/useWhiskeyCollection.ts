import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Whiskey } from "@shared/schema";

interface FilterOptions {
  searchQuery: string;
  sortBy: string;
  typeFilter: string;
  ratingFilter: string;
  bottleTypeFilter?: string;
  mashBillFilter?: string;
  caskStrengthFilter?: string;
}

const useWhiskeyCollection = ({
  searchQuery,
  sortBy,
  typeFilter,
  ratingFilter,
  bottleTypeFilter = "all",
  mashBillFilter = "all",
  caskStrengthFilter = "all"
}: FilterOptions) => {
  // State to store filtered whiskeys
  const [filteredWhiskeys, setFilteredWhiskeys] = useState<Whiskey[]>([]);
  
  // Fetch whiskeys from API
  const { data: whiskeys, isLoading, isError } = useQuery<Whiskey[]>({
    queryKey: ["/api/whiskeys"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Set filters for collection
  const setFilters = (options: Partial<FilterOptions>) => {
    // This function is not currently used, but could be useful for future updates
    // It would allow updating filters without recreating the entire options object
  };
  
  // Effect for filtering and sorting whiskeys
  useEffect(() => {
    if (!whiskeys) return;
    
    let result = [...whiskeys];
    
    // Apply text search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        whiskey => 
          whiskey.name.toLowerCase().includes(lowerQuery) ||
          (whiskey.distillery && whiskey.distillery.toLowerCase().includes(lowerQuery)) ||
          (whiskey.type && whiskey.type.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Apply type filter
    if (typeFilter) {
      result = result.filter(whiskey => whiskey.type === typeFilter);
    }
    
    // Apply rating filter
    if (ratingFilter) {
      const minRating = parseInt(ratingFilter);
      result = result.filter(
        whiskey => whiskey.rating !== null && whiskey.rating >= minRating
      );
    }
    
    // Apply bourbon-specific filters if type is Bourbon
    if (typeFilter === 'Bourbon' || (result.some(w => w.type === 'Bourbon'))) {
      // Filter by bottle type
      if (bottleTypeFilter && bottleTypeFilter !== "all") {
        result = result.filter(
          whiskey => whiskey.type === 'Bourbon' && whiskey.bottleType === bottleTypeFilter
        );
      }
      
      // Filter by mash bill
      if (mashBillFilter && mashBillFilter !== "all") {
        result = result.filter(
          whiskey => whiskey.type === 'Bourbon' && whiskey.mashBill === mashBillFilter
        );
      }
      
      // Filter by cask strength
      if (caskStrengthFilter !== "all") {
        const isCaskStrength = caskStrengthFilter === "yes";
        result = result.filter(
          whiskey => whiskey.type === 'Bourbon' && 
            (whiskey.caskStrength === "Yes") === isCaskStrength
        );
      }
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          // Sort by rating (highest first), handling null values
          if (a.rating === null && b.rating === null) return 0;
          if (a.rating === null) return 1;
          if (b.rating === null) return -1;
          return b.rating - a.rating;
        case "price":
          // Sort by price (lowest first), handling null values
          if (a.price === null && b.price === null) return 0;
          if (a.price === null) return 1;
          if (b.price === null) return -1;
          return a.price - b.price;
        case "price-high":
          // Sort by price (highest first), handling null values
          if (a.price === null && b.price === null) return 0;
          if (a.price === null) return 1;
          if (b.price === null) return -1;
          return b.price - a.price;
        case "age":
          // Sort by age (oldest first), handling null values
          if (a.age === null && b.age === null) return 0;
          if (a.age === null) return 1;
          if (b.age === null) return -1;
          return b.age - a.age;
        case "dateAdded":
          // Sort by date added (newest first), handle null dates safely
          const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
          const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
          return dateB - dateA;
        default:
          return 0;
      }
    });
    
    setFilteredWhiskeys(result);
  }, [
    whiskeys, 
    searchQuery, 
    sortBy, 
    typeFilter, 
    ratingFilter, 
    bottleTypeFilter, 
    mashBillFilter, 
    caskStrengthFilter
  ]);
  
  return {
    whiskeys: whiskeys || [],
    filteredWhiskeys,
    isLoading,
    isError,
    setFilters
  };
};

export default useWhiskeyCollection;