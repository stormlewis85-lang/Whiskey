import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Whiskey } from "@shared/schema";
import { Header } from "@/components/ui/sidebar";
import CollectionStats from "@/components/CollectionStats";
import FilterBar from "@/components/FilterBar";
import CollectionGrid from "@/components/CollectionGrid";
import ImportModal from "@/components/modals/ImportModal";
import AddWhiskeyModal from "@/components/modals/AddWhiskeyModal";
import ReviewModal from "@/components/modals/ReviewModal";
import WhiskeyDetailModal from "@/components/modals/WhiskeyDetailModal";
import { Button } from "@/components/ui/button";
import { PlusIcon, UploadIcon } from "lucide-react";
import useWhiskeyCollection from "@/lib/hooks/useWhiskeyCollection";

const Home = () => {
  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddWhiskeyModalOpen, setIsAddWhiskeyModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentWhiskey, setCurrentWhiskey] = useState<Whiskey | null>(null);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<string>("");

  // Get whiskey collection
  const { 
    whiskeys,
    filteredWhiskeys,
    isLoading,
    isError,
    setFilters, 
  } = useWhiskeyCollection({ 
    searchQuery, 
    sortBy, 
    typeFilter, 
    ratingFilter 
  });

  // Modal handlers
  const openImportModal = () => setIsImportModalOpen(true);
  const openAddWhiskeyModal = () => setIsAddWhiskeyModalOpen(true);
  
  const openReviewModal = (whiskey: Whiskey) => {
    setCurrentWhiskey(whiskey);
    setIsReviewModalOpen(true);
    setIsDetailModalOpen(false);
  };
  
  const openDetailModal = (whiskey: Whiskey) => {
    setCurrentWhiskey(whiskey);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-whiskey-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Whiskey Vault</h1>
          <div className="flex items-center space-x-2">
            <Button
              onClick={openImportModal}
              variant="secondary"
              className="bg-whiskey-500 hover:bg-whiskey-400 text-white"
            >
              <UploadIcon className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button
              onClick={openAddWhiskeyModal}
              variant="secondary"
              className="bg-burgundy-500 hover:bg-burgundy-400 text-white"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <FilterBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
        />
        
        {/* Stats */}
        <CollectionStats whiskeys={whiskeys || []} />
        
        {/* Collection Grid */}
        <CollectionGrid 
          whiskeys={filteredWhiskeys || []}
          isLoading={isLoading}
          isError={isError}
          onViewDetails={openDetailModal}
          onReview={openReviewModal}
          onAddNew={openAddWhiskeyModal}
        />
      </main>

      {/* Modals */}
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
      
      <AddWhiskeyModal 
        isOpen={isAddWhiskeyModalOpen} 
        onClose={() => setIsAddWhiskeyModalOpen(false)} 
      />
      
      {currentWhiskey && (
        <>
          <ReviewModal 
            isOpen={isReviewModalOpen} 
            onClose={() => setIsReviewModalOpen(false)} 
            whiskey={currentWhiskey} 
          />
          
          <WhiskeyDetailModal 
            isOpen={isDetailModalOpen} 
            onClose={() => setIsDetailModalOpen(false)} 
            whiskey={currentWhiskey}
            onReview={openReviewModal}
          />
        </>
      )}
    </div>
  );
};

export default Home;
