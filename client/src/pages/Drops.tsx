import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { MobilePageHeader } from "@/components/MobilePageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useIsMobile } from "@/hooks/use-mobile";
import { StoreDropCard, type StoreDrop } from "@/components/drops/StoreDropCard";
import { DropAlertCard } from "@/components/drops/DropAlertCard";
import { DropFilters } from "@/components/drops/DropFilters";
import { FollowedStoresList } from "@/components/drops/FollowedStoresList";
import { StoreDropCardSkeleton } from "@/components/drops/StoreDropCardSkeleton";
import { StoreSearchModal } from "@/components/modals/StoreSearchModal";
import { ReportDropModal } from "@/components/modals/ReportDropModal";
import { Bell, Plus, Store } from "lucide-react";

interface FollowedStore {
  id: number;
  name: string;
  location: string | null;
  followerCount: number;
}

const Drops = () => {
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState("All Drops");
  const [storeSearchOpen, setStoreSearchOpen] = useState(false);
  const [reportDropOpen, setReportDropOpen] = useState(false);

  // Followed stores
  const followedStoresQuery = useQuery<FollowedStore[]>({
    queryKey: ["/api/user/followed-stores"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/followed-stores");
      return res.json();
    },
  });

  // Drops feed (all from followed stores)
  const dropsQuery = useQuery<StoreDrop[]>({
    queryKey: ["/api/drops"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/drops");
      return res.json();
    },
  });

  // Wishlist matches
  const wishlistQuery = useQuery<StoreDrop[]>({
    queryKey: ["/api/drops/wishlist-matches"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/drops/wishlist-matches");
      return res.json();
    },
  });

  // Unread notification count
  const unreadQuery = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications/unread-count");
      return res.json();
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const followedStores = followedStoresQuery.data || [];
  const allDrops = dropsQuery.data || [];
  const wishlistMatches = wishlistQuery.data || [];
  const unreadCount = unreadQuery.data?.count || 0;
  const isLoading = dropsQuery.isLoading;

  // Filter drops based on active filter
  const filteredDrops = (() => {
    if (activeFilter === "Wishlist Matches") return wishlistMatches;
    if (activeFilter === "Bourbon") return allDrops.filter((d) => d.whiskeyType?.toLowerCase() === "bourbon");
    if (activeFilter === "Scotch") return allDrops.filter((d) => d.whiskeyType?.toLowerCase() === "scotch");
    if (activeFilter === "Allocated") return allDrops.filter((d) => d.whiskeyType?.toLowerCase() === "allocated");
    return allDrops; // "All Drops"
  })();

  const showWishlistView = activeFilter === "Wishlist Matches";
  const hasFollowedStores = followedStores.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? <MobilePageHeader /> : <Header />}

      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <section className="relative py-6 md:py-10 lg:py-14">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
          <div className="relative px-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-label-caps text-primary mb-3">Alerts</p>
                <h1 className="text-display-hero text-foreground">Store Drops</h1>
                <p className="text-muted-foreground mt-3 text-sm sm:text-base">
                  Latest releases from stores you follow
                </p>
              </div>

              {/* Report drop button */}
              {hasFollowedStores && (
                <button
                  onClick={() => setReportDropOpen(true)}
                  className="flex items-center justify-center border-none cursor-pointer shrink-0 mt-2"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "hsl(var(--primary))",
                  }}
                >
                  <Plus className="w-4.5 h-4.5 text-primary-foreground" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Followed stores horizontal scroll */}
        {hasFollowedStores && (
          <FollowedStoresList
            stores={followedStores}
            onAddStore={() => setStoreSearchOpen(true)}
          />
        )}

        {/* Filter bar */}
        {hasFollowedStores && (
          <DropFilters onFilterChange={(filter) => setActiveFilter(filter)} />
        )}

        {/* Content */}
        <div className="px-4 pb-24">
          {/* Loading state */}
          {isLoading && (
            <>
              <StoreDropCardSkeleton />
              <StoreDropCardSkeleton />
              <StoreDropCardSkeleton />
            </>
          )}

          {/* No followed stores — empty state */}
          {!isLoading && !hasFollowedStores && (
            <EmptyState
              icon={Store}
              title="Follow Stores to See Drops"
              description="Find local liquor stores and follow them to see when new bottles arrive."
              action={{
                label: "Find Stores",
                onClick: () => setStoreSearchOpen(true),
              }}
            />
          )}

          {/* Has followed stores but no drops */}
          {!isLoading && hasFollowedStores && filteredDrops.length === 0 && (
            <EmptyState
              icon={Bell}
              title={showWishlistView ? "No Wishlist Matches" : "No Drops Yet"}
              description={
                showWishlistView
                  ? "When a store you follow gets a bottle on your wishlist, you'll see it here."
                  : "When stores you follow report new bottles, they'll appear here."
              }
            />
          )}

          {/* Drops list */}
          {!isLoading &&
            filteredDrops.map((drop) =>
              showWishlistView ? (
                <DropAlertCard key={drop.id} drop={drop} />
              ) : (
                <StoreDropCard
                  key={drop.id}
                  drop={drop}
                  onGetDirections={() => {
                    if (drop.store.address) {
                      window.open(
                        `https://maps.google.com/?q=${encodeURIComponent(drop.store.address)}`,
                        "_blank"
                      );
                    }
                  }}
                />
              )
            )}
        </div>
      </div>

      {/* Modals */}
      <StoreSearchModal isOpen={storeSearchOpen} onClose={() => setStoreSearchOpen(false)} />
      <ReportDropModal isOpen={reportDropOpen} onClose={() => setReportDropOpen(false)} />
    </div>
  );
};

export default Drops;
