import { useState, useEffect } from "react";
import { Whiskey } from "@shared/schema";
import WhiskeyCard from "./WhiskeyCard";
import WhiskeyListView from "./WhiskeyListView";
import SkeletonCard from "./SkeletonCard";
import { Button } from "@/components/ui/button";
import { AlertCircle, PlusIcon, Wine, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_COUNT = 30;
const LOAD_MORE_COUNT = 30;

interface CollectionGridProps {
  whiskeys: Whiskey[];
  isLoading: boolean;
  isError: boolean;
  onViewDetails: (whiskey: Whiskey) => void;
  onReview: (whiskey: Whiskey) => void;
  onEdit: (whiskey: Whiskey) => void;
  onAddNew: () => void;
}

const CollectionGrid = ({
  whiskeys,
  isLoading,
  isError,
  onViewDetails,
  onReview,
  onEdit,
  onAddNew
}: CollectionGridProps) => {
  // All hooks must be declared before any conditional returns
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  // Reset when the filtered list changes (e.g. new search/filter)
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [whiskeys.length]);

  // Loading state — skeleton cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-card border border-destructive/30 rounded-xl shadow-warm-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Error loading collection</h3>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          There was an error loading your whiskey collection. Please check your connection and try again.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (whiskeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        {/* Dramatic icon with gold glow */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150" />
          <div className="relative w-24 h-24 rounded-full bg-card border border-primary/20 flex items-center justify-center">
            <Wine className="w-10 h-10 text-primary" />
          </div>
        </div>

        <h3 className="font-display text-2xl md:text-3xl text-foreground text-center">
          Your collection is empty
        </h3>
        <p className="mt-4 text-muted-foreground text-center max-w-md text-lg">
          Start building your whiskey collection. Add your first bottle or import an existing collection.
        </p>
        <Button
          onClick={onAddNew}
          size="lg"
          className="mt-8 bg-primary hover:bg-primary/90"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Your First Whiskey
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">
          Pro tip: You can also scan barcodes or import from a CSV file.
        </p>
      </div>
    );
  }

  const visibleWhiskeys = whiskeys.slice(0, visibleCount);
  const remaining = whiskeys.length - visibleCount;

  // Collection grid
  return (
    <>
      {/* View toggle + status legend */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {whiskeys.length} {whiskeys.length === 1 ? 'bottle' : 'bottles'}
          </p>
          <div className="hidden sm:flex items-center gap-3 text-[0.6875rem] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />Open</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-primary" />Sealed</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-pink-500" />Gifted</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />Finished</span>
          </div>
        </div>
        <div className="flex items-center gap-1 border border-border rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === 'grid'
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === 'list'
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {visibleWhiskeys.map((whiskey) => (
            <WhiskeyCard
              key={whiskey.id}
              whiskey={whiskey}
              onViewDetails={onViewDetails}
              onReview={onReview}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : (
        <WhiskeyListView
          whiskeys={visibleWhiskeys}
          onViewDetails={onViewDetails}
          onReview={onReview}
          onEdit={onEdit}
        />
      )}

      {remaining > 0 && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            className="border-border/50"
            onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
          >
            Show More ({remaining} remaining)
          </Button>
        </div>
      )}
    </>
  );
};

export default CollectionGrid;
