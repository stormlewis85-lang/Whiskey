import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  // Collection management filters
  collectionView?: 'all' | 'collection' | 'wishlist';
  setCollectionView?: (view: 'all' | 'collection' | 'wishlist') => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  // Optional action slot (e.g. Compare button)
  actions?: React.ReactNode;
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
  setCaskStrengthFilter,
  collectionView = 'all',
  setCollectionView,
  statusFilter = 'all',
  setStatusFilter,
  actions
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
    if (collectionView !== 'all') count++;
    if (statusFilter !== 'all') count++;
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
    if (setCollectionView) setCollectionView('all');
    if (setStatusFilter) setStatusFilter('all');
    setSearchQuery('');
  };

  // Styled select trigger class
  const selectTriggerClass = "bg-card border-border/50 text-foreground hover:bg-accent/50 focus:ring-primary/30";

  // Filter components that can be reused between desktop and mobile
  const SortSelect = () => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">Sort by</label>
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className={cn("w-full h-10", selectTriggerClass)}>
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
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">Whiskey Type</label>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className={cn("w-full h-10", selectTriggerClass)}>
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
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">Rating</label>
      <Select value={ratingFilter} onValueChange={setRatingFilter}>
        <SelectTrigger className={cn("w-full h-10", selectTriggerClass)}>
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

  // Collection management filters
  const CollectionViewSelect = () => (
    setCollectionView && (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">View</label>
        <Select value={collectionView} onValueChange={(value) => setCollectionView(value as 'all' | 'collection' | 'wishlist')}>
          <SelectTrigger className={cn("w-full h-10", selectTriggerClass)}>
            <SelectValue placeholder="All Bottles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bottles</SelectItem>
            <SelectItem value="collection">My Collection</SelectItem>
            <SelectItem value="wishlist">Wishlist</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  );

  const StatusSelect = () => (
    setStatusFilter && collectionView !== 'wishlist' && (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Status</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className={cn("w-full h-10", selectTriggerClass)}>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="sealed">Sealed</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="finished">Finished</SelectItem>
            <SelectItem value="gifted">Gifted</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  );

  const BourbonFilters = () => (
    isBourbonSelected && (
      <div className="space-y-4 pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bourbon Filters</p>

        {setBottleTypeFilter && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Bottle Type</label>
            <Select value={bottleTypeFilter} onValueChange={setBottleTypeFilter}>
              <SelectTrigger className={cn("w-full h-10", selectTriggerClass)}>
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Mash Bill</label>
            <Select value={mashBillFilter} onValueChange={setMashBillFilter}>
              <SelectTrigger className={cn("w-full h-10", selectTriggerClass)}>
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Strength</label>
            <Select value={caskStrengthFilter} onValueChange={setCaskStrengthFilter}>
              <SelectTrigger className={cn("w-full h-10", selectTriggerClass)}>
                <SelectValue placeholder="All" />
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
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">Search</label>
      <div className="relative">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search collection..."
          className="pl-9 h-10 bg-card border-border/50"
        />
        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
      </div>
    </div>
  );

  // Mobile view with a slide-out filter panel
  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collection..."
              className="pl-9 h-10 bg-card border-border/50"
            />
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          {actions}

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-10 px-3 border-border/50",
                  activeFilterCount > 0 && "border-primary text-primary"
                )}
              >
                <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[380px] bg-card border-border/50">
              <SheetHeader className="text-left pb-4 border-b border-border/50">
                <SheetTitle className="text-foreground">Filter Collection</SheetTitle>
              </SheetHeader>

              <div className="py-6 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)]">
                <CollectionViewSelect />
                <StatusSelect />
                <SortSelect />
                <TypeSelect />
                <RatingSelect />
                <BourbonFilters />
                <SearchBox />
              </div>

              <SheetFooter className="flex gap-2 pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="flex-1 border-border/50"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Reset
                </Button>
                <SheetClose asChild>
                  <Button size="sm" className="flex-1">Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex items-center justify-between bg-accent/50 rounded-lg px-3 py-2 border border-border/30">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Active:</span>
              {collectionView !== 'all' && (
                <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full border border-border">
                  {collectionView === 'collection' ? 'Collection' : 'Wishlist'}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                  {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </span>
              )}
              {typeFilter !== 'all' && (
                <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full border border-border">
                  {typeFilter}
                </span>
              )}
              {ratingFilter !== 'all' && (
                <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full border border-border">
                  {ratingFilter}+ Stars
                </span>
              )}
              {isBourbonSelected && bottleTypeFilter !== 'all' && (
                <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full border border-border">
                  {bottleTypeFilter}
                </span>
              )}
              {isBourbonSelected && mashBillFilter !== 'all' && (
                <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full border border-border">
                  {mashBillFilter}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-7 px-2"
              onClick={resetFilters}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop view with all filters visible
  return (
    <div className="bg-card/50 border border-border/30 rounded-lg p-4">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className={cn("w-[180px] h-9", selectTriggerClass)}>
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Collection View Filter */}
          {setCollectionView && (
            <Select value={collectionView} onValueChange={(value) => setCollectionView(value as 'all' | 'collection' | 'wishlist')}>
              <SelectTrigger className={cn("w-[130px] h-9", selectTriggerClass)}>
                <SelectValue placeholder="All Bottles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bottles</SelectItem>
                <SelectItem value="collection">Collection</SelectItem>
                <SelectItem value="wishlist">Wishlist</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Status Filter (only show when not viewing wishlist) */}
          {setStatusFilter && collectionView !== 'wishlist' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn("w-[120px] h-9", selectTriggerClass)}>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sealed">Sealed</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
                <SelectItem value="gifted">Gifted</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className={cn("w-[140px] h-9", selectTriggerClass)}>
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
            <SelectTrigger className={cn("w-[130px] h-9", selectTriggerClass)}>
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
            <Select value={bottleTypeFilter} onValueChange={setBottleTypeFilter}>
              <SelectTrigger className={cn("w-[150px] h-9", selectTriggerClass)}>
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
            <Select value={mashBillFilter} onValueChange={setMashBillFilter}>
              <SelectTrigger className={cn("w-[140px] h-9", selectTriggerClass)}>
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
            <Select value={caskStrengthFilter} onValueChange={setCaskStrengthFilter}>
              <SelectTrigger className={cn("w-[140px] h-9", selectTriggerClass)}>
                <SelectValue placeholder="Strength" />
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
              placeholder="Search..."
              className="pl-9 w-[180px] h-9 bg-card border-border/50"
            />
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-9"
              onClick={resetFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          {actions}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
