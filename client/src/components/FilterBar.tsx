import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

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
  // Check if bourbon is selected to show bourbon-specific filters
  const isBourbonSelected = typeFilter === "Bourbon";
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
      </div>
    </div>
  );
};

export default FilterBar;
