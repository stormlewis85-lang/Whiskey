import { Header } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bell } from "lucide-react";

const Drops = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {!isMobile && <Header />}

      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className={isMobile ? "px-5 pt-4 pb-2" : "px-5 pt-8 pb-4"}>
          <h1 className={`font-display font-medium text-foreground ${isMobile ? "text-3xl" : "text-4xl"}`}>
            Store Drops
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Alerts from stores you follow
          </p>
        </div>

        {/* Coming Soon */}
        <div className="px-4 pb-24">
          <EmptyState
            icon={Bell}
            title="Coming Soon"
            description="Store drop alerts are coming in a future update. You'll be able to follow local stores and get notified when they receive new bottles."
          />
        </div>
      </div>
    </div>
  );
};

export default Drops;
