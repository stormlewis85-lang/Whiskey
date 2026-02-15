import { useState, useEffect } from "react";
import { Whiskey } from "@shared/schema";
import WhiskeyCard from "./WhiskeyCard";
import { Button } from "@/components/ui/button";
import { AlertCircle, PlusIcon, Wine, Loader2 } from "lucide-react";

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
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="mt-6 text-muted-foreground font-medium">Loading your collection...</p>
        <p className="mt-1 text-sm text-muted-foreground/70">This won't take long</p>
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
      <div className="bg-card border border-border/50 rounded-xl shadow-warm-sm p-10 text-center">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-28 h-28 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative rounded-full bg-card border border-border/40 shadow-warm w-20 h-20 flex items-center justify-center">
            <Wine className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h3 className="font-heading text-xl text-foreground">Your collection is empty</h3>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Start building your whiskey collection. Add your first bottle or import an existing collection.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={onAddNew}
            className="w-full sm:w-auto shadow-warm-sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Your First Whiskey
          </Button>
        </div>
        <div className="mt-8 pt-6 border-t border-border/30">
          <p className="text-sm text-muted-foreground">
            Pro tip: You can also scan barcodes or import from a CSV file.
          </p>
        </div>
      </div>
    );
  }

  // Progressive rendering
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  // Reset when the filtered list changes (e.g. new search/filter)
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [whiskeys.length]);

  const visibleWhiskeys = whiskeys.slice(0, visibleCount);
  const remaining = whiskeys.length - visibleCount;

  // Collection grid
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
