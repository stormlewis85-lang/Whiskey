import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, MapPin, Check, Loader2 } from "lucide-react";

interface StoreSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StoreResult {
  id: number;
  name: string;
  location: string | null;
  address: string | null;
  isFollowing?: boolean;
}

export function StoreSearchModal({ isOpen, onClose }: StoreSearchModalProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");

  const storesQuery = useQuery<StoreResult[]>({
    queryKey: ["/api/stores", search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await apiRequest("GET", `/api/stores${params}`);
      return res.json();
    },
    enabled: isOpen,
  });

  const followedQuery = useQuery<StoreResult[]>({
    queryKey: ["/api/user/followed-stores"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/followed-stores");
      return res.json();
    },
    enabled: isOpen,
  });

  const followedIds = new Set((followedQuery.data || []).map((s) => s.id));

  const followMutation = useMutation({
    mutationFn: async (storeId: number) => {
      await apiRequest("POST", `/api/stores/${storeId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/followed-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Following store" });
    },
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: { name: string; location: string }) => {
      const res = await apiRequest("POST", "/api/stores", data);
      return res.json();
    },
    onSuccess: (store) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      // Auto-follow the new store
      followMutation.mutate(store.id);
      setShowAddForm(false);
      setNewStoreName("");
      setNewStoreLocation("");
      toast({ title: "Store added & followed" });
    },
  });

  const stores = storesQuery.data || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "20px",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Find Stores</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4"
          />
          <Input
            placeholder="Search stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            style={{ borderRadius: "12px" }}
          />
        </div>

        {/* Store list */}
        <div className="max-h-64 overflow-y-auto space-y-1">
          {storesQuery.isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {stores.map((store) => {
            const isFollowed = followedIds.has(store.id);
            return (
              <div
                key={store.id}
                className="flex items-center gap-3 py-2.5 px-2 rounded-lg"
                style={{ background: isFollowed ? "rgba(212,164,76,0.06)" : "transparent" }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center font-semibold"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "hsl(var(--popover))",
                    fontSize: "0.65rem",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  {store.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{store.name}</div>
                  {store.location && (
                    <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                      <MapPin className="w-3 h-3" />
                      {store.location}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => followMutation.mutate(store.id)}
                  disabled={isFollowed || followMutation.isPending}
                  className="flex items-center gap-1 border-none cursor-pointer font-medium"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.7rem",
                    background: isFollowed ? "transparent" : "hsl(var(--primary))",
                    color: isFollowed ? "hsl(var(--primary))" : "hsl(var(--primary-foreground))",
                    opacity: isFollowed ? 0.7 : 1,
                  }}
                >
                  {isFollowed ? (
                    <>
                      <Check className="w-3 h-3" /> Following
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" /> Follow
                    </>
                  )}
                </button>
              </div>
            );
          })}

          {!storesQuery.isLoading && stores.length === 0 && (
            <div className="text-center py-6 text-muted-foreground" style={{ fontSize: "0.8rem" }}>
              {search ? "No stores found" : "No stores yet"}
            </div>
          )}
        </div>

        {/* Divider + Add store */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-transparent border-none cursor-pointer text-primary font-medium"
              style={{ fontSize: "0.8rem", padding: "8px" }}
            >
              <Plus className="w-4 h-4" />
              Submit a new store
            </button>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Store name"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                style={{ borderRadius: "10px" }}
              />
              <Input
                placeholder="City, State"
                value={newStoreLocation}
                onChange={(e) => setNewStoreLocation(e.target.value)}
                style={{ borderRadius: "10px" }}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddForm(false)}
                  style={{ borderRadius: "10px" }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={!newStoreName.trim() || createStoreMutation.isPending}
                  onClick={() =>
                    createStoreMutation.mutate({
                      name: newStoreName.trim(),
                      location: newStoreLocation.trim(),
                    })
                  }
                  style={{ borderRadius: "10px" }}
                >
                  {createStoreMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Add & Follow"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
