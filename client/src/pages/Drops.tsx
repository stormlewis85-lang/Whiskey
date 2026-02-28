import { Header } from "@/components/Header";
import { DropFilters } from "@/components/drops/DropFilters";
import { StoreDropCard, type StoreDrop } from "@/components/drops/StoreDropCard";
import { useIsMobile } from "@/hooks/use-mobile";

const mockDrops: StoreDrop[] = [
  {
    id: "1",
    store: { name: "Bottle King", initials: "BK", location: "Troy, MI", distance: "2.4 mi" },
    timeAgo: "2 min",
    bottle: { name: "Blanton's Single Barrel", type: "Kentucky Straight Bourbon", onWishlist: true },
  },
  {
    id: "2",
    store: { name: "Total Wine", initials: "TW", location: "Ann Arbor, MI", distance: "5.1 mi" },
    timeAgo: "15 min",
    bottle: { name: "Weller Special Reserve", type: "Wheated Bourbon", onWishlist: false },
  },
  {
    id: "3",
    store: { name: "Plum Market", initials: "PM", location: "Birmingham, MI", distance: "8.2 mi" },
    timeAgo: "1 hr",
    bottle: { name: "Eagle Rare 10 Year", type: "Kentucky Straight Bourbon", onWishlist: true },
  },
];

const Drops = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {!isMobile && <Header />}

      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div style={{ padding: isMobile ? "16px 20px 8px" : "32px 20px 16px" }}>
          <h1
            className="font-display font-medium text-foreground"
            style={{ fontSize: isMobile ? "1.8rem" : "2.5rem" }}
          >
            Store Drops
          </h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8rem" }}>
            Alerts from stores you follow
          </p>
        </div>

        {/* Filters */}
        <DropFilters />

        {/* Drops List */}
        <div style={{ padding: "0 16px 100px" }}>
          {mockDrops.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
                No drops yet. Follow stores to get alerts.
              </p>
            </div>
          ) : (
            mockDrops.map((drop) => (
              <StoreDropCard key={drop.id} drop={drop} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Drops;
