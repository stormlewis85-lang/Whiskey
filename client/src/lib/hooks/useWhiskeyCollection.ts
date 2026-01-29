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
  // Collection management filters
  collectionView?: 'all' | 'collection' | 'wishlist';
  statusFilter?: string;
}

const useWhiskeyCollection = ({
  searchQuery,
  sortBy,
  typeFilter,
  ratingFilter,
  bottleTypeFilter = "all",
  mashBillFilter = "all",
  caskStrengthFilter = "all",
  collectionView = "all",
  statusFilter = "all"
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
    if (!whiskeys) {
      console.log("No whiskeys data available");
      return;
    }
    
    console.log("Processing whiskeys in useEffect:", whiskeys.length);
    
    let result = [...whiskeys];

    // Apply collection view filter (wishlist vs owned)
    if (collectionView === 'collection') {
      result = result.filter(whiskey => !whiskey.isWishlist);
      console.log("After collection view filter (owned):", result.length);
    } else if (collectionView === 'wishlist') {
      result = result.filter(whiskey => whiskey.isWishlist === true);
      console.log("After collection view filter (wishlist):", result.length);
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter(whiskey => whiskey.status === statusFilter);
      console.log("After status filter:", result.length);
    }

    // Apply text search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        whiskey => 
          whiskey.name.toLowerCase().includes(lowerQuery) ||
          (whiskey.distillery && whiskey.distillery.toLowerCase().includes(lowerQuery)) ||
          (whiskey.type && whiskey.type.toLowerCase().includes(lowerQuery))
      );
      console.log("After search query filter:", result.length);
    }
    
    // Apply type filter
    if (typeFilter) {
      result = result.filter(whiskey => whiskey.type === typeFilter);
      console.log("After type filter:", result.length);
    }
    
    // Apply rating filter
    if (ratingFilter) {
      const minRating = parseInt(ratingFilter);
      result = result.filter(
        whiskey => whiskey.rating !== null && whiskey.rating >= minRating
      );
      console.log("After rating filter:", result.length);
    }
    
    // Apply bourbon-specific filters if type is Bourbon
    if (typeFilter === 'Bourbon' || (result.some(w => w.type === 'Bourbon'))) {
      // Filter by bottle type
      if (bottleTypeFilter && bottleTypeFilter !== "all") {
        result = result.filter(
          whiskey => whiskey.type === 'Bourbon' && whiskey.bottleType === bottleTypeFilter
        );
        console.log("After bottle type filter:", result.length);
      }
      
      // Filter by mash bill
      if (mashBillFilter && mashBillFilter !== "all") {
        result = result.filter(
          whiskey => whiskey.type === 'Bourbon' && whiskey.mashBill === mashBillFilter
        );
        console.log("After mash bill filter:", result.length);
      }
      
      // Filter by cask strength
      if (caskStrengthFilter !== "all") {
        const isCaskStrength = caskStrengthFilter === "yes";
        result = result.filter(
          whiskey => whiskey.type === 'Bourbon' && 
            (whiskey.caskStrength === "Yes") === isCaskStrength
        );
        console.log("After cask strength filter:", result.length);
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
    
    console.log("Final filtered whiskeys:", result.length);
    setFilteredWhiskeys(result);
  }, [
    whiskeys,
    searchQuery,
    sortBy,
    typeFilter,
    ratingFilter,
    bottleTypeFilter,
    mashBillFilter,
    caskStrengthFilter,
    collectionView,
    statusFilter
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