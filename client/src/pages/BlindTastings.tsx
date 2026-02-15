import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BlindTasting, BlindTastingWhiskey, Whiskey } from "@shared/schema";
import {
  Plus, Eye, EyeOff, Calendar, Trash2, Star, Check,
  Sparkles, Trophy, ChevronRight, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BlindTastingWithWhiskeys {
  blindTasting: BlindTasting;
  whiskeys: (BlindTastingWhiskey & { whiskey?: Whiskey })[];
}

const BlindTastings = () => {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTasting, setSelectedTasting] = useState<BlindTastingWithWhiskeys | null>(null);
  const [newTastingName, setNewTastingName] = useState("");
  const [selectedWhiskeyIds, setSelectedWhiskeyIds] = useState<number[]>([]);
  const [editingRatings, setEditingRatings] = useState<Record<number, { rating: number; notes: string }>>({});

  // Fetch all blind tastings
  const { data: blindTastings, isLoading } = useQuery<BlindTasting[]>({
    queryKey: ["/api/blind-tastings"],
  });

  // Fetch user's whiskeys for creating blind tastings
  const { data: userWhiskeys } = useQuery<Whiskey[]>({
    queryKey: ["/api/whiskeys"],
  });

  // Create blind tasting mutation
  const createTastingMutation = useMutation({
    mutationFn: async (data: { name: string; whiskeyIds: number[] }) => {
      const response = await apiRequest("POST", "/api/blind-tastings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blind-tastings"] });
      setIsCreateModalOpen(false);
      setNewTastingName("");
      setSelectedWhiskeyIds([]);
      toast({ title: "Blind tasting created", description: "Whiskeys have been shuffled and assigned labels." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  // Delete blind tasting mutation
  const deleteTastingMutation = useMutation({
    mutationFn: async (tastingId: number) => {
      await apiRequest("DELETE", `/api/blind-tastings/${tastingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blind-tastings"] });
      setSelectedTasting(null);
      toast({ title: "Blind tasting deleted", description: "The blind tasting has been removed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  // Rate whiskey mutation
  const rateWhiskeyMutation = useMutation({
    mutationFn: async ({ btId, btwId, rating, notes }: { btId: number; btwId: number; rating: number; notes?: string }) => {
      const response = await apiRequest("POST", `/api/blind-tastings/${btId}/whiskeys/${btwId}/rate`, { rating, notes });
      return response.json();
    },
    onSuccess: () => {
      if (selectedTasting) {
        fetchTastingDetails(selectedTasting.blindTasting.id);
      }
      toast({ title: "Rating saved" });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  // Reveal mutation
  const revealMutation = useMutation({
    mutationFn: async (tastingId: number) => {
      const response = await apiRequest("POST", `/api/blind-tastings/${tastingId}/reveal`);
      return response.json();
    },
    onSuccess: (data: BlindTastingWithWhiskeys) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blind-tastings"] });
      setSelectedTasting(data);
      toast({ title: "Revealed!", description: "The whiskeys have been revealed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: async (tastingId: number) => {
      const response = await apiRequest("POST", `/api/blind-tastings/${tastingId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blind-tastings"] });
      setSelectedTasting(null);
      toast({ title: "Completed", description: "The blind tasting has been marked as complete." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  const fetchTastingDetails = async (tastingId: number) => {
    try {
      const response = await apiRequest("GET", `/api/blind-tastings/${tastingId}`);
      const data = await response.json();
      setSelectedTasting(data);
      // Initialize editing ratings
      const ratings: Record<number, { rating: number; notes: string }> = {};
      data.whiskeys.forEach((w: BlindTastingWhiskey) => {
        ratings[w.id] = { rating: w.blindRating || 0, notes: w.blindNotes || "" };
      });
      setEditingRatings(ratings);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load blind tasting details", variant: "destructive" });
    }
  };

  const handleCreateTasting = () => {
    if (!newTastingName.trim()) {
      toast({ title: "Error", description: "Please enter a name", variant: "destructive" });
      return;
    }
    if (selectedWhiskeyIds.length < 2) {
      toast({ title: "Error", description: "Select at least 2 whiskeys", variant: "destructive" });
      return;
    }
    createTastingMutation.mutate({
      name: newTastingName,
      whiskeyIds: selectedWhiskeyIds,
    });
  };

  const toggleWhiskeySelection = (id: number) => {
    setSelectedWhiskeyIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSaveRating = (btwId: number) => {
    if (!selectedTasting) return;
    const { rating, notes } = editingRatings[btwId] || { rating: 0, notes: "" };
    rateWhiskeyMutation.mutate({
      btId: selectedTasting.blindTasting.id,
      btwId,
      rating,
      notes
    });
  };

  // Get available whiskeys (not on wishlist)
  const availableWhiskeys = userWhiskeys?.filter(w => !w.isWishlist) || [];

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Active</Badge>;
      case 'revealed':
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Revealed</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Completed</Badge>;
      default:
        return null;
    }
  };

  // Star rating component
  const StarRating = ({
    value,
    onChange,
    disabled = false
  }: {
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
  }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className={cn(
            "transition-colors",
            disabled ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              star <= value
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground/30 hover:text-amber-400/50"
            )}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <header className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">Blind Tastings</h1>
            <p className="text-muted-foreground text-sm mt-0.5 hidden sm:block">
              Evaluate whiskeys without bias
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">New Blind Tasting</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !blindTastings || blindTastings.length === 0 ? (
          <Card className="border-dashed rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="absolute w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
                <div className="relative rounded-full bg-card border border-border/40 shadow-warm w-16 h-16 flex items-center justify-center">
                  <EyeOff className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="font-heading text-xl text-foreground mb-2">No blind tastings yet</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                Create a blind tasting to evaluate whiskeys without seeing their labels.
                Perfect for unbiased comparisons!
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-warm-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Blind Tasting
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blindTastings.map((tasting) => (
              <Card
                key={tasting.id}
                className="cursor-pointer rounded-xl hover-lift shadow-warm-sm hover:shadow-warm-md hover:border-primary/50 transition-all duration-300"
                onClick={() => fetchTastingDetails(tasting.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{tasting.name}</CardTitle>
                      <div className="mt-2">
                        {getStatusBadge(tasting.status)}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(tasting.createdAt!), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Blind Tasting Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create Blind Tasting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tasting Name</Label>
              <Input
                id="name"
                placeholder="e.g., Bourbon Battle Royale"
                value={newTastingName}
                onChange={(e) => setNewTastingName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Select Whiskeys (min 2)</Label>
              <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2">
                {availableWhiskeys.map((whiskey) => (
                  <div
                    key={whiskey.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedWhiskeyIds.includes(whiskey.id)
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-primary/50"
                    )}
                    onClick={() => toggleWhiskeySelection(whiskey.id)}
                  >
                    <Checkbox
                      checked={selectedWhiskeyIds.includes(whiskey.id)}
                      onCheckedChange={() => toggleWhiskeySelection(whiskey.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{whiskey.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {whiskey.distillery && `${whiskey.distillery} • `}
                        {whiskey.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedWhiskeyIds.length} whiskeys selected
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTasting}
              disabled={createTastingMutation.isPending || selectedWhiskeyIds.length < 2}
            >
              {createTastingMutation.isPending ? "Creating..." : "Create Blind Tasting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blind Tasting Detail Modal */}
      <Dialog open={!!selectedTasting} onOpenChange={(open) => !open && setSelectedTasting(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedTasting && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      {selectedTasting.blindTasting.name}
                      {getStatusBadge(selectedTasting.blindTasting.status)}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTasting.whiskeys.length} whiskeys
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteTastingMutation.mutate(selectedTasting.blindTasting.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <Separator className="my-4" />

              {/* Active Tasting - Show labels only */}
              {selectedTasting.blindTasting.status === 'active' && (
                <>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <EyeOff className="h-5 w-5" />
                      <span className="font-medium">Blind Mode Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Rate each sample by its letter. The identities are hidden until you reveal.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {selectedTasting.whiskeys.map((btw) => (
                      <Card key={btw.id} className="bg-accent/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-2xl font-bold text-primary">{btw.label}</span>
                              </div>
                              <div>
                                <div className="font-medium text-lg">Sample {btw.label}</div>
                                <div className="text-sm text-muted-foreground">??? Mystery Whiskey ???</div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm">Your Rating</Label>
                              <div className="flex items-center gap-4 mt-1">
                                <StarRating
                                  value={editingRatings[btw.id]?.rating || 0}
                                  onChange={(v) => setEditingRatings(prev => ({
                                    ...prev,
                                    [btw.id]: { ...prev[btw.id], rating: v }
                                  }))}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {editingRatings[btw.id]?.rating || 0}/5
                                </span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm">Tasting Notes</Label>
                              <Textarea
                                placeholder="What do you taste? Nose, palate, finish..."
                                className="mt-1 min-h-[80px]"
                                value={editingRatings[btw.id]?.notes || ""}
                                onChange={(e) => setEditingRatings(prev => ({
                                  ...prev,
                                  [btw.id]: { ...prev[btw.id], notes: e.target.value }
                                }))}
                              />
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSaveRating(btw.id)}
                              disabled={rateWhiskeyMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-center">
                    <Button
                      size="lg"
                      className="bg-amber-600 hover:bg-amber-500"
                      onClick={() => revealMutation.mutate(selectedTasting.blindTasting.id)}
                      disabled={revealMutation.isPending}
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      {revealMutation.isPending ? "Revealing..." : "Reveal Whiskeys"}
                    </Button>
                  </div>
                </>
              )}

              {/* Revealed Tasting - Show results */}
              {(selectedTasting.blindTasting.status === 'revealed' || selectedTasting.blindTasting.status === 'completed') && (
                <>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Trophy className="h-5 w-5" />
                      <span className="font-medium">Results Revealed!</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      See how your blind ratings compare to the actual whiskeys.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {selectedTasting.whiskeys
                      .sort((a, b) => (b.blindRating || 0) - (a.blindRating || 0))
                      .map((btw, index) => (
                        <Card
                          key={btw.id}
                          className={cn(
                            "transition-all",
                            index === 0 && "border-amber-500/50 bg-amber-500/5"
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex flex-col items-center">
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                                  index === 0
                                    ? "bg-amber-500 text-white"
                                    : "bg-primary/10 text-primary"
                                )}>
                                  {index === 0 ? <Trophy className="h-5 w-5" /> : `#${index + 1}`}
                                </div>
                                <Badge variant="outline" className="mt-2">{btw.label}</Badge>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-lg">
                                  {btw.whiskey?.name || "Unknown"}
                                </div>
                                {btw.whiskey?.distillery && (
                                  <div className="text-sm text-muted-foreground">
                                    {btw.whiskey.distillery}
                                  </div>
                                )}

                                <div className="mt-3 grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Blind Rating</div>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                      <span className="font-medium">
                                        {btw.blindRating?.toFixed(1) || "Not rated"}
                                      </span>
                                    </div>
                                  </div>
                                  {btw.whiskey?.rating && (
                                    <div>
                                      <div className="text-xs text-muted-foreground mb-1">Previous Rating</div>
                                      <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-muted-foreground/50" />
                                        <span className="text-muted-foreground">
                                          {btw.whiskey.rating.toFixed(1)}
                                        </span>
                                        {btw.blindRating && btw.whiskey.rating && (
                                          <span className={cn(
                                            "text-xs ml-2",
                                            btw.blindRating > btw.whiskey.rating
                                              ? "text-emerald-500"
                                              : btw.blindRating < btw.whiskey.rating
                                                ? "text-red-500"
                                                : "text-muted-foreground"
                                          )}>
                                            {btw.blindRating > btw.whiskey.rating
                                              ? `+${(btw.blindRating - btw.whiskey.rating).toFixed(1)}`
                                              : btw.blindRating < btw.whiskey.rating
                                                ? (btw.blindRating - btw.whiskey.rating).toFixed(1)
                                                : "same"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {btw.blindNotes && (
                                  <div className="mt-3 p-3 bg-accent/30 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">Your Notes</div>
                                    <p className="text-sm">{btw.blindNotes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>

                  {selectedTasting.blindTasting.status === 'revealed' && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        onClick={() => completeMutation.mutate(selectedTasting.blindTasting.id)}
                        disabled={completeMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {completeMutation.isPending ? "Completing..." : "Mark as Complete"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlindTastings;
