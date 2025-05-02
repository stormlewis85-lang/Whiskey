import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Whiskey } from "@shared/schema";
import { Header } from "@/components/Header";
import CollectionStats from "@/components/CollectionStats";
import FilterBar from "@/components/FilterBar";
import CollectionGrid from "@/components/CollectionGrid";
import ComparisonTool from "@/components/ComparisonTool";
import ImportModal from "@/components/modals/ImportModal";
import AddWhiskeyModal from "@/components/modals/AddWhiskeyModal";
import EditWhiskeyModal from "@/components/modals/EditWhiskeyModal";
import ReviewModal from "@/components/modals/ReviewModal";
import WhiskeyDetailModal from "@/components/modals/WhiskeyDetailModal";
import ExportModal from "@/components/modals/ExportModal";
import { Button } from "@/components/ui/button";
import { PlusIcon, UploadIcon, DownloadIcon } from "lucide-react";
import useWhiskeyCollection from "@/lib/hooks/useWhiskeyCollection";
import { useAuth } from "@/hooks/use-auth";

const Home = () => {
  const { user } = useAuth();
  
  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddWhiskeyModalOpen, setIsAddWhiskeyModalOpen] = useState(false);
  const [isEditWhiskeyModalOpen, setIsEditWhiskeyModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentWhiskey, setCurrentWhiskey] = useState<Whiskey | null>(null);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  
  // Bourbon-specific filters
  const [bottleTypeFilter, setBottleTypeFilter] = useState<string>("all");
  const [mashBillFilter, setMashBillFilter] = useState<string>("all");
  const [caskStrengthFilter, setCaskStrengthFilter] = useState<string>("all");

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
    ratingFilter,
    // Add bourbon-specific filters
    bottleTypeFilter,
    mashBillFilter,
    caskStrengthFilter
  });
  
  // Debug logging
  console.log("Home component - whiskeys:", whiskeys?.length || 0);
  console.log("Home component - filteredWhiskeys:", filteredWhiskeys?.length || 0);
  console.log("Home component - isLoading:", isLoading);
  console.log("Home component - isError:", isError);

  // Modal handlers
  const openImportModal = () => setIsImportModalOpen(true);
  const openAddWhiskeyModal = () => setIsAddWhiskeyModalOpen(true);
  const openExportModal = () => setIsExportModalOpen(true);
  
  const openReviewModal = (whiskey: Whiskey) => {
    setCurrentWhiskey(whiskey);
    setIsReviewModalOpen(true);
    setIsDetailModalOpen(false);
  };
  
  const openDetailModal = (whiskey: Whiskey) => {
    setCurrentWhiskey(whiskey);
    setIsDetailModalOpen(true);
  };
  
  const openEditWhiskeyModal = (whiskey: Whiskey) => {
    setCurrentWhiskey(whiskey);
    setIsEditWhiskeyModalOpen(true);
    setIsDetailModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User Authentication Header */}
      <Header />
      
      {/* App Header */}
      <header className="bg-slate-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-amber-100">
            {user?.displayName || user?.username}'s Whiskey Vault
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              onClick={openAddWhiskeyModal}
              variant="secondary"
              className="bg-amber-600 hover:bg-amber-500 text-white"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Whiskey
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
          // Bourbon-specific filters
          bottleTypeFilter={bottleTypeFilter}
          setBottleTypeFilter={setBottleTypeFilter}
          mashBillFilter={mashBillFilter}
          setMashBillFilter={setMashBillFilter}
          caskStrengthFilter={caskStrengthFilter}
          setCaskStrengthFilter={setCaskStrengthFilter}
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
          onEdit={openEditWhiskeyModal}
          onAddNew={openAddWhiskeyModal}
        />
        
        {/* Import, Export, and Compare Buttons at bottom */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 pb-8">
          <Button
            onClick={openImportModal}
            variant="outline"
            className="border-amber-700 hover:bg-amber-50"
          >
            <UploadIcon className="h-4 w-4 mr-2 text-amber-700" />
            Import Collection
          </Button>
          <Button
            onClick={openExportModal}
            variant="outline"
            className="border-amber-700 hover:bg-amber-50"
          >
            <DownloadIcon className="h-4 w-4 mr-2 text-amber-700" />
            Export Collection
          </Button>
          
          {/* Comparison Tool */}
          {whiskeys && whiskeys.length > 1 && (
            <ComparisonTool 
              whiskeys={whiskeys}
              className="border-amber-700 hover:bg-amber-50" 
            />
          )}
        </div>
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
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      
      {currentWhiskey && (
        <>
          <ReviewModal 
            isOpen={isReviewModalOpen} 
            onClose={() => setIsReviewModalOpen(false)} 
            whiskey={currentWhiskey} 
          />
          
          <EditWhiskeyModal
            isOpen={isEditWhiskeyModalOpen}
            onClose={() => setIsEditWhiskeyModalOpen(false)}
            whiskey={currentWhiskey}
          />
          
          <WhiskeyDetailModal 
            isOpen={isDetailModalOpen} 
            onClose={() => setIsDetailModalOpen(false)} 
            whiskey={currentWhiskey}
            onReview={openReviewModal}
            onEdit={openEditWhiskeyModal}
          />
        </>
      )}
    </div>
  );
};

export default Home;
