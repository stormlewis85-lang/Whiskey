import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Whiskey } from "@shared/schema";

interface WhiskeyFilterOptions {
  searchQuery: string;
  sortBy: string;
  typeFilter: string;
  ratingFilter: string;
}

/**
 * Hook to manage the whiskey collection with filtering and sorting
 */
const useWhiskeyCollection = (filterOptions: WhiskeyFilterOptions) => {
  const { searchQuery, sortBy, typeFilter, ratingFilter } = filterOptions;
  
  // Get whiskeys from API
  const { data: whiskeys, isLoading, isError, refetch } = useQuery<Whiskey[]>({
    queryKey: ["/api/whiskeys"],
  });

  // Apply filters and sorting
  const filteredWhiskeys = useMemo(() => {
    if (!whiskeys) return [];
    
    let filtered = [...whiskeys];
    
    // Apply type filter
    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(w => w.type === typeFilter);
    }
    
    // Apply rating filter
    if (ratingFilter && ratingFilter !== "all") {
      const rating = parseInt(ratingFilter);
      if (ratingFilter === "0") {
        filtered = filtered.filter(w => !w.rating || w.rating === 0);
      } else {
        filtered = filtered.filter(w => (w.rating || 0) >= rating);
      }
    }
    
    // Apply search
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        w.name.toLowerCase().includes(query) || 
        (w.distillery && w.distillery.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch(sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "ratingDesc":
          return (b.rating || 0) - (a.rating || 0);
        case "rating":
          return (a.rating || 0) - (b.rating || 0);
        case "priceDesc":
          return (b.price || 0) - (a.price || 0);
        case "price":
          return (a.price || 0) - (b.price || 0);
        case "ageDesc":
          return (b.age || 0) - (a.age || 0);
        case "age":
          return (a.age || 0) - (b.age || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [whiskeys, searchQuery, sortBy, typeFilter, ratingFilter]);

  // Function to update filters
  const setFilters = (filters: Partial<WhiskeyFilterOptions>) => {
    return filters;
  };

  return {
    whiskeys,
    filteredWhiskeys,
    isLoading,
    isError,
    refetch,
    setFilters,
  };
};

export default useWhiskeyCollection;
