import { Plus, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface FollowedStore {
  id: number;
  name: string;
  location: string | null;
  followerCount: number;
}

interface FollowedStoresListProps {
  stores: FollowedStore[];
  onAddStore: () => void;
}

export function FollowedStoresList({ stores, onAddStore }: FollowedStoresListProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const unfollowMutation = useMutation({
    mutationFn: async (storeId: number) => {
      await apiRequest("DELETE", `/api/stores/${storeId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/followed-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drops"] });
      toast({ title: "Unfollowed store" });
    },
  });

  function getInitials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  return (
    <div
      className="flex gap-3 overflow-x-auto scrollbar-hide"
      style={{ padding: "0 20px 16px" }}
    >
      {/* Add store button */}
      <button
        onClick={onAddStore}
        className="flex flex-col items-center gap-1.5 flex-shrink-0 bg-transparent border-none cursor-pointer"
        style={{ minWidth: "60px" }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            border: "2px dashed rgba(212,164,76,0.3)",
          }}
        >
          <Plus className="w-5 h-5 text-primary" />
        </div>
        <span className="text-muted-foreground" style={{ fontSize: "0.6rem" }}>
          Add
        </span>
      </button>

      {/* Followed stores */}
      {stores.map((store) => (
        <div
          key={store.id}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 relative"
          style={{ minWidth: "60px" }}
        >
          <div
            className="flex items-center justify-center font-semibold cursor-pointer"
            onClick={() => navigate(`/store/${store.id}`)}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "hsl(var(--popover))",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: "0.7rem",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            {getInitials(store.name)}
          </div>
          <span
            className="text-foreground truncate text-center"
            style={{ fontSize: "0.6rem", maxWidth: "60px" }}
          >
            {store.name.split(/\s+/)[0]}
          </span>

          {/* Unfollow button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              unfollowMutation.mutate(store.id);
            }}
            className="absolute bg-background border-none cursor-pointer flex items-center justify-center"
            style={{
              top: "-4px",
              right: "-2px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <X className="w-2.5 h-2.5 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
}
