import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin } from "lucide-react";

interface ReportDropModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FollowedStore {
  id: number;
  name: string;
  location: string | null;
}

const WHISKEY_TYPES = ["Bourbon", "Rye", "Scotch", "Irish", "Japanese", "Other"];

export function ReportDropModal({ isOpen, onClose }: ReportDropModalProps) {
  const { toast } = useToast();
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [whiskeyName, setWhiskeyName] = useState("");
  const [whiskeyType, setWhiskeyType] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  const storesQuery = useQuery<FollowedStore[]>({
    queryKey: ["/api/user/followed-stores"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/followed-stores");
      return res.json();
    },
    enabled: isOpen,
  });

  const createDropMutation = useMutation({
    mutationFn: async (data: {
      storeId: number;
      whiskeyName: string;
      whiskeyType?: string;
      price?: number;
      notes?: string;
    }) => {
      const res = await apiRequest("POST", "/api/drops", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({ title: "Drop reported!", description: "Followers have been notified." });
      handleReset();
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to report drop", variant: "destructive" });
    },
  });

  function handleReset() {
    setSelectedStoreId(null);
    setWhiskeyName("");
    setWhiskeyType("");
    setPrice("");
    setNotes("");
  }

  function handleSubmit() {
    if (!selectedStoreId || !whiskeyName.trim()) return;

    createDropMutation.mutate({
      storeId: selectedStoreId,
      whiskeyName: whiskeyName.trim(),
      whiskeyType: whiskeyType || undefined,
      price: price ? parseFloat(price) : undefined,
      notes: notes.trim() || undefined,
    });
  }

  const followedStores = storesQuery.data || [];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleReset();
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-md"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "20px",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Report a Drop</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Store selection */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">Store</label>
            {followedStores.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Follow a store first to report drops.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {followedStores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => setSelectedStoreId(store.id)}
                    className="text-left border-none cursor-pointer p-3"
                    style={{
                      borderRadius: "10px",
                      background:
                        selectedStoreId === store.id
                          ? "rgba(212,164,76,0.15)"
                          : "hsl(var(--popover))",
                      border:
                        selectedStoreId === store.id
                          ? "1px solid rgba(212,164,76,0.3)"
                          : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="font-medium text-sm truncate">{store.name}</div>
                    {store.location && (
                      <div
                        className="flex items-center gap-1 text-muted-foreground mt-0.5"
                        style={{ fontSize: "0.65rem" }}
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        {store.location}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Whiskey name */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">
              Bottle Name *
            </label>
            <Input
              placeholder="e.g. Buffalo Trace"
              value={whiskeyName}
              onChange={(e) => setWhiskeyName(e.target.value)}
              style={{ borderRadius: "10px" }}
            />
          </div>

          {/* Whiskey type */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {WHISKEY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setWhiskeyType(whiskeyType === type ? "" : type)}
                  className="border-none cursor-pointer font-medium"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "16px",
                    fontSize: "0.7rem",
                    background:
                      whiskeyType === type
                        ? "rgba(212,164,76,0.15)"
                        : "hsl(var(--popover))",
                    color:
                      whiskeyType === type
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground))",
                    border:
                      whiskeyType === type
                        ? "1px solid rgba(212,164,76,0.3)"
                        : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">Price</label>
            <Input
              type="number"
              placeholder="$0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ borderRadius: "10px" }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">Notes</label>
            <Input
              placeholder="Shelf quantity, location in store, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ borderRadius: "10px" }}
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            disabled={
              !selectedStoreId ||
              !whiskeyName.trim() ||
              createDropMutation.isPending
            }
            onClick={handleSubmit}
            style={{ borderRadius: "12px", minHeight: "44px" }}
          >
            {createDropMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Report Drop"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
