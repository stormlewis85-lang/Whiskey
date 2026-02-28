import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Whiskey, ReviewNote } from "@shared/schema";
import { Header } from "@/components/Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHomeHeader } from "@/components/MobileHomeHeader";
import { DropAlertCard } from "@/components/drops/DropAlertCard";
import { ActivityCard } from "@/components/activity/ActivityCard";
import { mockActivityData } from "@/components/activity/mockActivityData";
import { EmptyState } from "@/components/EmptyState";
import CollectionStats from "@/components/CollectionStats";
import { SkeletonStats } from "@/components/SkeletonCard";
import FilterBar from "@/components/FilterBar";
import CollectionGrid from "@/components/CollectionGrid";
import ComparisonTool from "@/components/ComparisonTool";
import ImportModal from "@/components/modals/ImportModal";
import AddWhiskeyModal from "@/components/modals/AddWhiskeyModal";
import EditWhiskeyModal from "@/components/modals/EditWhiskeyModal";
import ReviewModal from "@/components/modals/ReviewModal";
import WhiskeyDetailModal from "@/components/modals/WhiskeyDetailModal";
import ExportModal from "@/components/modals/ExportModal";
// Lazy load Rick House components for better initial load performance
const TastingModeModal = lazy(() => import("@/components/modals/TastingModeModal"));
const TastingSession = lazy(() => import("@/components/TastingSession"));
const RickErrorBoundary = lazy(() => import("@/components/RickErrorBoundary"));
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusIcon, UploadIcon, DownloadIcon, Scan, Users } from "lucide-react";
import useWhiskeyCollection from "@/lib/hooks/useWhiskeyCollection";
import { useAuth } from "@/hooks/use-auth";

const Home = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddWhiskeyModalOpen, setIsAddWhiskeyModalOpen] = useState(false);
  const [isEditWhiskeyModalOpen, setIsEditWhiskeyModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isTastingModeModalOpen, setIsTastingModeModalOpen] = useState(false);
  const [isTastingSessionActive, setIsTastingSessionActive] = useState(false);
  const [tastingMode, setTastingMode] = useState<'guided' | 'notes'>('guided');
  const [currentWhiskey, setCurrentWhiskey] = useState<Whiskey | null>(null);
  const [existingReview, setExistingReview] = useState<ReviewNote | undefined>(undefined);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  
  // Bourbon-specific filters
  const [bottleTypeFilter, setBottleTypeFilter] = useState<string>("all");
  const [mashBillFilter, setMashBillFilter] = useState<string>("all");
  const [caskStrengthFilter, setCaskStrengthFilter] = useState<string>("all");

  // Collection management filters
  const [collectionView, setCollectionView] = useState<'all' | 'collection' | 'wishlist'>('all');
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    caskStrengthFilter,
    // Collection management filters
    collectionView,
    statusFilter
  });
  
  // Modal handlers
  const openImportModal = () => setIsImportModalOpen(true);
  const openAddWhiskeyModal = () => setIsAddWhiskeyModalOpen(true);
  const openExportModal = () => setIsExportModalOpen(true);
  const openBarcodeScanner = () => setIsBarcodeScannerOpen(true);
  
  const handleCodeScanned = (code: string) => {
    setSearchQuery(code);
  };
  
  const openReviewModal = (whiskey: Whiskey) => {
    setCurrentWhiskey(whiskey);
    // If whiskey has existing reviews, open in edit mode with the most recent review
    if (whiskey.notes && Array.isArray(whiskey.notes) && whiskey.notes.length > 0) {
      // Get the most recent review (last in array)
      setExistingReview(whiskey.notes[whiskey.notes.length - 1] as ReviewNote);
    } else {
      setExistingReview(undefined);
    }
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

  const openTastingModeModal = (whiskey: Whiskey) => {
    setCurrentWhiskey(whiskey);
    setIsTastingModeModalOpen(true);
    setIsDetailModalOpen(false);
  };

  // Mobile Activity Feed layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background max-w-2xl mx-auto">
        <MobileHomeHeader hasNotifications />

        {/* Featured Drop Alert */}
        <DropAlertCard
          alert={{
            id: "1",
            storeName: "Bottle King",
            storeLocation: "Troy, MI",
            bottleName: "Blanton's Single Barrel",
            timeAgo: "2 min ago",
            distance: "2.4 mi",
            onWishlist: true,
          }}
        />

        {/* Activity Section */}
        <div className="flex justify-between items-baseline" style={{ padding: "20px 20px 12px" }}>
          <span className="font-display font-medium text-foreground" style={{ fontSize: "1.2rem" }}>
            Activity
          </span>
          <span
            className="text-primary uppercase font-medium cursor-pointer"
            style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}
          >
            All Friends
          </span>
        </div>

        {/* Activity Feed */}
        {mockActivityData.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Activity Yet"
            description="Follow friends to see their reviews, collections, and whiskey discoveries."
          />
        ) : (
          mockActivityData.map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))
        )}

        {/* Keep existing modals functional */}
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
        <AddWhiskeyModal
          isOpen={isAddWhiskeyModalOpen}
          onClose={() => setIsAddWhiskeyModalOpen(false)}
        />
        <BarcodeScanner
          open={isBarcodeScannerOpen}
          onOpenChange={setIsBarcodeScannerOpen}
          onCodeScanned={handleCodeScanned}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* User Authentication Header */}
      <Header />

      {/* App Header */}
      <header className="relative py-6 md:py-8 lg:py-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <p className="text-label-caps text-primary mb-3">Your Collection</p>
            <h1 className="text-display-hero text-foreground">
              {user?.displayName || user?.username}'s Collection
            </h1>
            <p className="mt-4 text-lg text-muted-foreground hidden sm:block">
              Manage and explore your whiskey vault
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={openBarcodeScanner}
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent/50 h-10 w-10"
                >
                  <Scan className="h-5 w-5" />
                  <span className="sr-only">Scan barcode</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Scan barcode</TooltipContent>
            </Tooltip>
            <Button
              onClick={openAddWhiskeyModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Add Whiskey</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-5">
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
          // Collection management filters
          collectionView={collectionView}
          setCollectionView={setCollectionView}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          actions={whiskeys && whiskeys.length > 1 ? (
            <ComparisonTool
              whiskeys={whiskeys}
              className="h-9 border-border/50 hover:border-border hover:bg-accent/50"
            />
          ) : undefined}
        />
        
        {/* Stats */}
        {isLoading ? <SkeletonStats /> : <CollectionStats whiskeys={whiskeys || []} />}
        
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
        
        {/* Import and Export Buttons at bottom */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 pb-8">
          <Button
            onClick={openImportModal}
            variant="outline"
            className="border-border hover:border-border hover:bg-accent/50"
          >
            <UploadIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            Import Collection
          </Button>
          <Button
            onClick={openExportModal}
            variant="outline"
            className="border-border hover:border-border hover:bg-accent/50"
          >
            <DownloadIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            Export Collection
          </Button>
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
      
      <BarcodeScanner
        open={isBarcodeScannerOpen}
        onOpenChange={setIsBarcodeScannerOpen}
        onCodeScanned={handleCodeScanned}
      />
      
      {currentWhiskey && (
        <>
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => {
              setIsReviewModalOpen(false);
              setExistingReview(undefined);
            }}
            whiskey={currentWhiskey}
            existingReview={existingReview}
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
            onTasteWithRick={openTastingModeModal}
          />

          <Suspense fallback={null}>
            <TastingModeModal
              isOpen={isTastingModeModalOpen}
              onClose={() => setIsTastingModeModalOpen(false)}
              whiskey={currentWhiskey}
              onSelectMode={(mode) => {
                setTastingMode(mode);
                setIsTastingModeModalOpen(false);
                setIsTastingSessionActive(true);
              }}
            />
          </Suspense>

          {isTastingSessionActive && (
            <Suspense fallback={
              <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse text-muted-foreground">Loading Rick House...</div>
                </div>
              </div>
            }>
              <RickErrorBoundary
                onClose={() => setIsTastingSessionActive(false)}
                onRetry={() => {
                  // Reset and restart the session
                  setIsTastingSessionActive(false);
                  setTimeout(() => setIsTastingSessionActive(true), 100);
                }}
              >
                <TastingSession
                  whiskey={currentWhiskey}
                  mode={tastingMode}
                  onClose={() => setIsTastingSessionActive(false)}
                  onComplete={() => {
                    setIsTastingSessionActive(false);
                    // Optionally open review modal
                    openReviewModal(currentWhiskey);
                  }}
                />
              </RickErrorBoundary>
            </Suspense>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
