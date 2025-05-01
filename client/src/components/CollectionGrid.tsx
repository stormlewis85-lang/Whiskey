import { Whiskey } from "@shared/schema";
import WhiskeyCard from "./WhiskeyCard";
import { Button } from "@/components/ui/button";
import { AlertCircle, PlusIcon } from "lucide-react";

interface CollectionGridProps {
  whiskeys: Whiskey[];
  isLoading: boolean;
  isError: boolean;
  onViewDetails: (whiskey: Whiskey) => void;
  onReview: (whiskey: Whiskey) => void;
  onEdit: (whiskey: Whiskey) => void; // Made non-optional to fix TypeScript error
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
      <div className="text-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-whiskey-400 border-r-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-4 text-gray-600">Loading your collection...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <AlertCircle className="h-16 w-16 mx-auto text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading collection</h3>
        <p className="mt-1 text-gray-500">There was an error loading your whiskey collection. Please try again.</p>
      </div>
    );
  }

  // Empty state
  if (whiskeys.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No whiskeys found</h3>
        <p className="mt-1 text-gray-500">Start by adding your first whiskey or importing your collection.</p>
        <div className="mt-6">
          <Button 
            onClick={onAddNew}
            className="bg-whiskey-600 hover:bg-whiskey-500 text-white"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Your First Whiskey
          </Button>
        </div>
      </div>
    );
  }

  // Collection grid
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {whiskeys.map((whiskey) => (
        <WhiskeyCard
          key={whiskey.id}
          whiskey={whiskey}
          onViewDetails={onViewDetails}
          onReview={onReview}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default CollectionGrid;
