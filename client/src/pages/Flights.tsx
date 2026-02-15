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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Flight, FlightWhiskey, Whiskey } from "@shared/schema";
import {
  Plus, Wine, Calendar, Trash2, GripVertical, Star,
  Droplets, DollarSign, Clock, PenLine, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FlightWithWhiskeys {
  flight: Flight;
  whiskeys: (FlightWhiskey & { whiskey: Whiskey })[];
}

const Flights = () => {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightWithWhiskeys | null>(null);
  const [isAddWhiskeyModalOpen, setIsAddWhiskeyModalOpen] = useState(false);
  const [newFlightName, setNewFlightName] = useState("");
  const [newFlightDescription, setNewFlightDescription] = useState("");
  const [newFlightDate, setNewFlightDate] = useState("");

  // Fetch all flights
  const { data: flights, isLoading } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
  });

  // Fetch user's whiskeys for adding to flights
  const { data: userWhiskeys } = useQuery<Whiskey[]>({
    queryKey: ["/api/whiskeys"],
  });

  // Create flight mutation
  const createFlightMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; tastingDate?: string }) => {
      const response = await apiRequest("POST", "/api/flights", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      setIsCreateModalOpen(false);
      setNewFlightName("");
      setNewFlightDescription("");
      setNewFlightDate("");
      toast({ title: "Flight created", description: "Your tasting flight has been created." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  // Delete flight mutation
  const deleteFlightMutation = useMutation({
    mutationFn: async (flightId: number) => {
      await apiRequest("DELETE", `/api/flights/${flightId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      setSelectedFlight(null);
      toast({ title: "Flight deleted", description: "The tasting flight has been removed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  // Add whiskey to flight mutation
  const addWhiskeyMutation = useMutation({
    mutationFn: async ({ flightId, whiskeyId }: { flightId: number; whiskeyId: number }) => {
      const response = await apiRequest("POST", `/api/flights/${flightId}/whiskeys`, { whiskeyId });
      return response.json();
    },
    onSuccess: () => {
      if (selectedFlight) {
        fetchFlightDetails(selectedFlight.flight.id);
      }
      setIsAddWhiskeyModalOpen(false);
      toast({ title: "Whiskey added", description: "The whiskey has been added to the flight." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  // Remove whiskey from flight mutation
  const removeWhiskeyMutation = useMutation({
    mutationFn: async ({ flightId, flightWhiskeyId }: { flightId: number; flightWhiskeyId: number }) => {
      await apiRequest("DELETE", `/api/flights/${flightId}/whiskeys/${flightWhiskeyId}`);
    },
    onSuccess: () => {
      if (selectedFlight) {
        fetchFlightDetails(selectedFlight.flight.id);
      }
      toast({ title: "Whiskey removed", description: "The whiskey has been removed from the flight." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  // Update flight whiskey notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async ({ flightId, flightWhiskeyId, notes }: { flightId: number; flightWhiskeyId: number; notes: string }) => {
      const response = await apiRequest("PATCH", `/api/flights/${flightId}/whiskeys/${flightWhiskeyId}`, { notes });
      return response.json();
    },
    onSuccess: () => {
      if (selectedFlight) {
        fetchFlightDetails(selectedFlight.flight.id);
      }
      toast({ title: "Notes saved", description: "Your tasting notes have been saved." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  const fetchFlightDetails = async (flightId: number) => {
    try {
      const response = await apiRequest("GET", `/api/flights/${flightId}`);
      const data = await response.json();
      setSelectedFlight(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load flight details", variant: "destructive" });
    }
  };

  const handleCreateFlight = () => {
    if (!newFlightName.trim()) {
      toast({ title: "Error", description: "Please enter a flight name", variant: "destructive" });
      return;
    }
    createFlightMutation.mutate({
      name: newFlightName,
      description: newFlightDescription || undefined,
      tastingDate: newFlightDate || undefined,
    });
  };

  // Get whiskeys not already in the selected flight
  const availableWhiskeys = userWhiskeys?.filter(w =>
    !w.isWishlist &&
    !selectedFlight?.whiskeys.some(fw => fw.whiskeyId === w.id)
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <header className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">Tasting Flights</h1>
            <p className="text-muted-foreground text-sm mt-0.5 hidden sm:block">
              Create side-by-side comparison sessions
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">New Flight</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !flights || flights.length === 0 ? (
          <Card className="border-dashed rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="absolute w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
                <div className="relative rounded-full bg-card border border-border/40 shadow-warm w-16 h-16 flex items-center justify-center">
                  <Wine className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="font-heading text-xl text-foreground mb-2">No flights yet</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                Create a tasting flight to compare whiskeys side by side. Perfect for exploring
                different expressions or hosting a tasting session.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-warm-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Flight
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flights.map((flight) => (
              <Card
                key={flight.id}
                className="cursor-pointer rounded-xl hover-lift shadow-warm-sm hover:shadow-warm-md hover:border-primary/50 transition-all duration-300"
                onClick={() => fetchFlightDetails(flight.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{flight.name}</CardTitle>
                      {flight.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {flight.description}
                        </CardDescription>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {flight.tastingDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(flight.tastingDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(flight.createdAt!), 'MMM d')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Flight Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Tasting Flight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Flight Name</Label>
              <Input
                id="name"
                placeholder="e.g., Buffalo Trace Lineup"
                value={newFlightName}
                onChange={(e) => setNewFlightName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What's the theme of this flight?"
                value={newFlightDescription}
                onChange={(e) => setNewFlightDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Tasting Date (optional)</Label>
              <Input
                id="date"
                type="date"
                value={newFlightDate}
                onChange={(e) => setNewFlightDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFlight} disabled={createFlightMutation.isPending}>
              {createFlightMutation.isPending ? "Creating..." : "Create Flight"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flight Detail Modal */}
      <Dialog open={!!selectedFlight} onOpenChange={(open) => !open && setSelectedFlight(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          {selectedFlight && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedFlight.flight.name}</DialogTitle>
                    {selectedFlight.flight.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedFlight.flight.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteFlightMutation.mutate(selectedFlight.flight.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <Separator className="my-4" />

              {/* Whiskeys in Flight */}
              {selectedFlight.whiskeys.length === 0 ? (
                <div className="text-center py-8">
                  <Wine className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No whiskeys in this flight yet</p>
                  <Button onClick={() => setIsAddWhiskeyModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Whiskeys
                  </Button>
                </div>
              ) : (
                <>
                  {/* Whiskey Cards - Mobile friendly */}
                  <div className="space-y-3">
                    {selectedFlight.whiskeys.map((fw, index) => (
                      <div key={fw.id} className="p-3 rounded-lg border border-border/50 bg-accent/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-foreground truncate">{fw.whiskey.name}</div>
                              {fw.whiskey.distillery && (
                                <div className="text-xs text-muted-foreground truncate">{fw.whiskey.distillery}</div>
                              )}
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                                {fw.whiskey.age && <span>{fw.whiskey.age}yr</span>}
                                {fw.whiskey.abv && <span>{fw.whiskey.abv}%</span>}
                                {fw.whiskey.price && <span>${fw.whiskey.price}</span>}
                                {fw.whiskey.rating && (
                                  <span className="flex items-center gap-0.5">
                                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                    {fw.whiskey.rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                            onClick={() => removeWhiskeyMutation.mutate({
                              flightId: selectedFlight.flight.id,
                              flightWhiskeyId: fw.id
                            })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tasting Notes */}
                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium text-foreground">Flight Notes</h4>
                    {selectedFlight.whiskeys.map((fw, index) => (
                      <div key={fw.id} className="p-4 rounded-lg bg-accent/30 border border-border/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{fw.whiskey.name}</span>
                        </div>
                        <Textarea
                          placeholder="Add your tasting notes..."
                          defaultValue={fw.notes || ""}
                          className="min-h-[80px]"
                          onBlur={(e) => {
                            if (e.target.value !== (fw.notes || "")) {
                              updateNotesMutation.mutate({
                                flightId: selectedFlight.flight.id,
                                flightWhiskeyId: fw.id,
                                notes: e.target.value
                              });
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => setIsAddWhiskeyModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add More Whiskeys
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Whiskey to Flight Modal */}
      <Dialog open={isAddWhiskeyModalOpen} onOpenChange={setIsAddWhiskeyModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Whiskey to Flight</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-2 py-4">
            {availableWhiskeys.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No available whiskeys to add. All your whiskeys are already in this flight.
              </p>
            ) : (
              availableWhiskeys.map((whiskey) => (
                <div
                  key={whiskey.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/30 cursor-pointer transition-colors"
                  onClick={() => {
                    if (selectedFlight) {
                      addWhiskeyMutation.mutate({
                        flightId: selectedFlight.flight.id,
                        whiskeyId: whiskey.id
                      });
                    }
                  }}
                >
                  <div>
                    <div className="font-medium text-foreground">{whiskey.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {whiskey.distillery && `${whiskey.distillery} • `}
                      {whiskey.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {whiskey.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span>{whiskey.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Flights;
