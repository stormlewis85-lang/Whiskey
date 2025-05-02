import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { useState } from "react";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  ratingFilter: string;
  setRatingFilter: (rating: string) => void;
  // Optional bourbon-specific filters (only used when type is Bourbon)
  bottleTypeFilter?: string;
  setBottleTypeFilter?: (bottleType: string) => void;
  mashBillFilter?: string;
  setMashBillFilter?: (mashBill: string) => void;
  caskStrengthFilter?: string;
  setCaskStrengthFilter?: (caskStrength: string) => void;
}

const FilterBar = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  typeFilter,
  setTypeFilter,
  ratingFilter,
  setRatingFilter,
  bottleTypeFilter,
  setBottleTypeFilter,
  mashBillFilter,
  setMashBillFilter,
  caskStrengthFilter,
  setCaskStrengthFilter
}: FilterBarProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Check if bourbon is selected to show bourbon-specific filters
  const isBourbonSelected = typeFilter === "Bourbon";
  
  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (ratingFilter !== 'all') count++;
    if (isBourbonSelected && bottleTypeFilter !== 'all') count++;
    if (isBourbonSelected && mashBillFilter !== 'all') count++;
    if (isBourbonSelected && caskStrengthFilter !== 'all') count++;
    return count;
  };
  
  const activeFilterCount = getActiveFilterCount();
  
  // Reset all filters
  const resetFilters = () => {
    setTypeFilter('all');
    setRatingFilter('all');
    if (setBottleTypeFilter) setBottleTypeFilter('all');
    if (setMashBillFilter) setMashBillFilter('all');
    if (setCaskStrengthFilter) setCaskStrengthFilter('all');
    setSearchQuery('');
  };
  
  // Filter components that can be reused between desktop and mobile
  const SortSelect = () => (
    <div className="mb-3">
      <label className="text-sm text-gray-500 block mb-1">Sort by:</label>
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-full border border-gray-300 rounded py-1 px-2 text-sm bg-white">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name (A-Z)</SelectItem>
          <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
          <SelectItem value="ratingDesc">Rating (High-Low)</SelectItem>
          <SelectItem value="rating">Rating (Low-High)</SelectItem>
          <SelectItem value="priceDesc">Price (High-Low)</SelectItem>
          <SelectItem value="price">Price (Low-High)</SelectItem>
          <SelectItem value="ageDesc">Age (High-Low)</SelectItem>
          <SelectItem value="age">Age (Low-High)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
  
  const TypeSelect = () => (
    <div className="mb-3">
      <label className="text-sm text-gray-500 block mb-1">Whiskey Type:</label>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-full border border-gray-300 rounded py-1 px-2 text-sm bg-white">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="Bourbon">Bourbon</SelectItem>
          <SelectItem value="Tennessee Whiskey">Tennessee Whiskey</SelectItem>
          <SelectItem value="Scotch">Scotch</SelectItem>
          <SelectItem value="Rye">Rye</SelectItem>
          <SelectItem value="Irish">Irish</SelectItem>
          <SelectItem value="Japanese">Japanese</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
  
  const RatingSelect = () => (
    <div className="mb-3">
      <label className="text-sm text-gray-500 block mb-1">Rating:</label>
      <Select value={ratingFilter} onValueChange={setRatingFilter}>
        <SelectTrigger className="w-full border border-gray-300 rounded py-1 px-2 text-sm bg-white">
          <SelectValue placeholder="All Ratings" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Ratings</SelectItem>
          <SelectItem value="5">5 Stars</SelectItem>
          <SelectItem value="4">4+ Stars</SelectItem>
          <SelectItem value="3">3+ Stars</SelectItem>
          <SelectItem value="2">2+ Stars</SelectItem>
          <SelectItem value="1">1+ Star</SelectItem>
          <SelectItem value="0">Unrated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
  
  const BourbonFilters = () => (
    isBourbonSelected && (
      <div className="space-y-3">
        {setBottleTypeFilter && (
          <div className="mb-3">
            <label className="text-sm text-gray-500 block mb-1">Bottle Type:</label>
            <Select value={bottleTypeFilter} onValueChange={setBottleTypeFilter}>
              <SelectTrigger className="w-full border border-gray-300 rounded py-1 px-2 text-sm bg-white">
                <SelectValue placeholder="All Bottle Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bottle Types</SelectItem>
                <SelectItem value="Single Barrel">Single Barrel</SelectItem>
                <SelectItem value="Small Batch">Small Batch</SelectItem>
                <SelectItem value="Blend">Blend</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {setMashBillFilter && (
          <div className="mb-3">
            <label className="text-sm text-gray-500 block mb-1">Mash Bill:</label>
            <Select value={mashBillFilter} onValueChange={setMashBillFilter}>
              <SelectTrigger className="w-full border border-gray-300 rounded py-1 px-2 text-sm bg-white">
                <SelectValue placeholder="All Mash Bills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Mash Bills</SelectItem>
                <SelectItem value="High Corn">High Corn</SelectItem>
                <SelectItem value="High Rye">High Rye</SelectItem>
                <SelectItem value="Wheated">Wheated</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {setCaskStrengthFilter && (
          <div className="mb-3">
            <label className="text-sm text-gray-500 block mb-1">Strength:</label>
            <Select value={caskStrengthFilter} onValueChange={setCaskStrengthFilter}>
              <SelectTrigger className="w-full border border-gray-300 rounded py-1 px-2 text-sm bg-white">
                <SelectValue placeholder="Cask Strength" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Yes">Cask Strength</SelectItem>
                <SelectItem value="No">Standard Proof</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    )
  );
  
  const SearchBox = () => (
    <div className="relative mb-3">
      <label className="text-sm text-gray-500 block mb-1">Search:</label>
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search collection..."
        className="pl-8 w-full border border-gray-300 rounded py-1 px-3 text-sm"
      />
      <Search className="h-4 w-4 text-gray-400 absolute left-2 top-[calc(50%+4px)] transform -translate-y-1/2" />
    </div>
  );
  
  // Mobile view with a slide-out filter panel
  if (isMobile) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="relative flex-1 mr-2">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collection..."
              className="pl-8 w-full border border-gray-300 rounded py-1 px-3 text-sm h-9"
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
          </div>
          
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center text-sm h-9"
              >
                <Filter className="h-4 w-4 mr-1" />
                <span>Filter{activeFilterCount > 0 && ` (${activeFilterCount})`}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[360px] p-4">
              <SheetHeader className="text-left pb-2">
                <SheetTitle>Filter Collection</SheetTitle>
              </SheetHeader>
              
              <div className="py-4 space-y-2">
                <SortSelect />
                <TypeSelect />
                <RatingSelect />
                <BourbonFilters />
                <SearchBox />
              </div>
              
              <SheetFooter className="flex justify-between pt-4 border-t mt-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetFilters}
                  className="flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset Filters
                </Button>
                <SheetClose asChild>
                  <Button size="sm">Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        
        {activeFilterCount > 0 && (
          <div className="flex justify-between items-center bg-amber-50/80 rounded-md px-3 py-2 text-xs">
            <div className="flex items-center">
              <span className="text-amber-800 font-medium">Active filters: </span>
              <div className="flex flex-wrap ml-2 gap-1">
                {typeFilter !== 'all' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">{typeFilter}</span>
                )}
                {ratingFilter !== 'all' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">{ratingFilter}+ Rating</span>
                )}
                {isBourbonSelected && bottleTypeFilter !== 'all' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">{bottleTypeFilter}</span>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-amber-700 h-6 px-2"
              onClick={resetFilters}
            >
              <X className="h-3 w-3 mr-1" />Clear
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  // Desktop view with all filters visible
  return (
    <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Sort by:</span>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] border border-gray-300 rounded py-1 px-2 text-sm bg-white h-9">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
            <SelectItem value="ratingDesc">Rating (High-Low)</SelectItem>
            <SelectItem value="rating">Rating (Low-High)</SelectItem>
            <SelectItem value="priceDesc">Price (High-Low)</SelectItem>
            <SelectItem value="price">Price (Low-High)</SelectItem>
            <SelectItem value="ageDesc">Age (High-Low)</SelectItem>
            <SelectItem value="age">Age (Low-High)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex flex-wrap gap-2 md:gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px] border border-gray-300 rounded py-1 px-2 text-sm bg-white h-9">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Bourbon">Bourbon</SelectItem>
            <SelectItem value="Tennessee Whiskey">Tennessee Whiskey</SelectItem>
            <SelectItem value="Scotch">Scotch</SelectItem>
            <SelectItem value="Rye">Rye</SelectItem>
            <SelectItem value="Irish">Irish</SelectItem>
            <SelectItem value="Japanese">Japanese</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[130px] border border-gray-300 rounded py-1 px-2 text-sm bg-white h-9">
            <SelectValue placeholder="All Ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
            <SelectItem value="1">1+ Star</SelectItem>
            <SelectItem value="0">Unrated</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Bourbon-specific filters */}
        {isBourbonSelected && setBottleTypeFilter && (
          <Select 
            value={bottleTypeFilter} 
            onValueChange={setBottleTypeFilter}
          >
            <SelectTrigger className="w-[140px] border border-gray-300 rounded py-1 px-2 text-sm bg-white h-9">
              <SelectValue placeholder="All Bottle Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bottle Types</SelectItem>
              <SelectItem value="Single Barrel">Single Barrel</SelectItem>
              <SelectItem value="Small Batch">Small Batch</SelectItem>
              <SelectItem value="Blend">Blend</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        {isBourbonSelected && setMashBillFilter && (
          <Select 
            value={mashBillFilter} 
            onValueChange={setMashBillFilter}
          >
            <SelectTrigger className="w-[130px] border border-gray-300 rounded py-1 px-2 text-sm bg-white h-9">
              <SelectValue placeholder="All Mash Bills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mash Bills</SelectItem>
              <SelectItem value="High Corn">High Corn</SelectItem>
              <SelectItem value="High Rye">High Rye</SelectItem>
              <SelectItem value="Wheated">Wheated</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        {isBourbonSelected && setCaskStrengthFilter && (
          <Select 
            value={caskStrengthFilter} 
            onValueChange={setCaskStrengthFilter}
          >
            <SelectTrigger className="w-[140px] border border-gray-300 rounded py-1 px-2 text-sm bg-white h-9">
              <SelectValue placeholder="Cask Strength" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Yes">Cask Strength</SelectItem>
              <SelectItem value="No">Standard Proof</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collection..."
            className="pl-8 w-full border border-gray-300 rounded py-1 px-3 text-sm h-9"
          />
          <Search className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
        </div>
        
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-amber-700 h-9"
            onClick={resetFilters}
          >
            <X className="h-4 w-4 mr-1" />Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
