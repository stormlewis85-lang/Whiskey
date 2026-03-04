import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Whiskey, ClubSession as ClubSessionType } from "@shared/schema";
import { SessionRatingCard } from "@/components/clubs/SessionRatingCard";
import { RevealGrid } from "@/components/clubs/RevealGrid";
import {
  Plus, Play, Eye, CheckCircle, Trash2, Wine
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface SessionData {
  session: ClubSessionType;
  whiskeys: Array<{
    id: number;
    sessionId: number;
    whiskeyId: number;
    label: string;
    order: number;
    whiskey?: Whiskey;
    ratings: Array<{
      id: number;
      sessionWhiskeyId: number;
      userId: number;
      rating: number;
      notes: string | null;
      user: {
        id: number;
        username: string;
        displayName: string | null;
        profileImage: string | null;
      };
    }>;
  }>;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  revealed: "bg-blue-500/15 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/15 text-green-500 border-green-500/20",
};

const ClubSession = () => {
  const { toast } = useToast();
  const params = useParams<{ clubId: string; sessionId: string }>();
  const clubId = parseInt(params.clubId || "0");
  const sessionId = parseInt(params.sessionId || "0");
  const { user: currentUser } = useAuth();

  const [confirmAction, setConfirmAction] = useState<"start" | "reveal" | "complete" | null>(null);
  const [isAddWhiskeyOpen, setIsAddWhiskeyOpen] = useState(false);
  const [selectedWhiskeyIds, setSelectedWhiskeyIds] = useState<number[]>([]);

  const queryKey = [`/api/clubs/${clubId}/sessions/${sessionId}`];

  const { data, isLoading } = useQuery<SessionData>({
    queryKey,
    enabled: !!sessionId,
    refetchInterval: (query) => {
      // Poll more frequently during active sessions
      const status = query.state.data?.session?.status;
      return status === 'active' ? 10000 : false;
    },
  });

  // Fetch user's whiskeys for adding to draft sessions
  const { data: userWhiskeys } = useQuery<Whiskey[]>({
    queryKey: ["/api/whiskeys"],
    enabled: data?.session?.status === "draft",
  });

  const session = data?.session;
  const sessionWhiskeys = data?.whiskeys || [];
  const isAdmin = session?.createdBy === currentUser?.id;

  // Add whiskey mutation
  const addWhiskeyMutation = useMutation({
    mutationFn: async (whiskeyId: number) => {
      const response = await apiRequest("POST", `/api/clubs/${clubId}/sessions/${sessionId}/whiskeys`, { whiskeyId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  // Remove whiskey mutation
  const removeWhiskeyMutation = useMutation({
    mutationFn: async (swId: number) => {
      await apiRequest("DELETE", `/api/clubs/${clubId}/sessions/${sessionId}/whiskeys/${swId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  // Lifecycle mutations
  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/clubs/${clubId}/sessions/${sessionId}/start`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Session started!", description: "Members can now submit their blind ratings." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  const revealMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/clubs/${clubId}/sessions/${sessionId}/reveal`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Results revealed!", description: "Everyone can now see all ratings." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/clubs/${clubId}/sessions/${sessionId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Session completed" });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  // Rating mutation
  const rateMutation = useMutation({
    mutationFn: async ({ swId, rating, notes }: { swId: number; rating: number; notes?: string }) => {
      const response = await apiRequest("POST", `/api/club-sessions/${sessionId}/whiskeys/${swId}/rate`, { rating, notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Rating submitted" });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  const handleAddWhiskeys = () => {
    for (const id of selectedWhiskeyIds) {
      addWhiskeyMutation.mutate(id);
    }
    setSelectedWhiskeyIds([]);
    setIsAddWhiskeyOpen(false);
  };

  const handleConfirm = () => {
    if (confirmAction === "start") startMutation.mutate();
    else if (confirmAction === "reveal") revealMutation.mutate();
    else if (confirmAction === "complete") completeMutation.mutate();
    setConfirmAction(null);
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full w-8 h-8 border-2 border-muted border-t-primary" />
        </div>
      </div>
    );
  }

  const confirmMessages = {
    start: {
      title: "Start Session?",
      description: "Labels will be shuffled. Members will be able to submit ratings. Whiskeys cannot be added or removed after starting.",
    },
    reveal: {
      title: "Reveal Results?",
      description: "All ratings will become visible to all members. Whiskey identities will be shown.",
    },
    complete: {
      title: "Complete Session?",
      description: "This will archive the session. No further changes can be made.",
    },
  };

  // Filter out whiskeys already in the session
  const existingWhiskeyIds = sessionWhiskeys.map(sw => sw.whiskeyId);
  const availableWhiskeys = userWhiskeys?.filter(w => !existingWhiskeyIds.includes(w.id)) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* Status + controls */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className={statusColors[session.status || "draft"]}>
            {session.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {sessionWhiskeys.length} whiskey{sessionWhiskeys.length !== 1 ? "s" : ""}
          </span>
        </div>

        {session.description && (
          <p className="text-sm text-muted-foreground mb-4">{session.description}</p>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex gap-2 mb-4">
            {session.status === "draft" && (
              <Button
                onClick={() => setConfirmAction("start")}
                disabled={sessionWhiskeys.length === 0}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-1.5" />
                Start
              </Button>
            )}
            {session.status === "active" && (
              <Button onClick={() => setConfirmAction("reveal")} className="flex-1">
                <Eye className="w-4 h-4 mr-1.5" />
                Reveal
              </Button>
            )}
            {session.status === "revealed" && (
              <Button onClick={() => setConfirmAction("complete")} variant="outline" className="flex-1">
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Complete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content based on status */}
      <div className="px-4">
        {/* DRAFT: Lineup builder */}
        {session.status === "draft" && (
          <>
            {isAdmin && (
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={() => setIsAddWhiskeyOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Whiskey
              </Button>
            )}

            {sessionWhiskeys.length > 0 ? (
              <div className="space-y-2">
                {sessionWhiskeys.map((sw) => (
                  <Card key={sw.id} className="border-border/50">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {sw.label}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{sw.whiskey?.name || "Unknown"}</p>
                          {sw.whiskey?.distillery && (
                            <p className="text-xs text-muted-foreground">{sw.whiskey.distillery}</p>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeWhiskeyMutation.mutate(sw.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wine className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Add whiskeys to the lineup to get started.
                </p>
              </div>
            )}
          </>
        )}

        {/* ACTIVE: Blind rating cards */}
        {session.status === "active" && (
          <div className="space-y-4">
            {sessionWhiskeys
              .sort((a, b) => a.order - b.order)
              .map((sw) => {
                const myRating = sw.ratings.find(r => r.userId === currentUser?.id);
                return (
                  <SessionRatingCard
                    key={sw.id}
                    label={sw.label}
                    existingRating={myRating?.rating}
                    existingNotes={myRating?.notes || undefined}
                    onSubmit={(rating, notes) =>
                      rateMutation.mutate({ swId: sw.id, rating, notes })
                    }
                    isPending={rateMutation.isPending}
                  />
                );
              })}
          </div>
        )}

        {/* REVEALED / COMPLETED: Comparison grid */}
        {(session.status === "revealed" || session.status === "completed") && (
          <RevealGrid whiskeys={sessionWhiskeys} />
        )}
      </div>

      {/* Add whiskey dialog */}
      <Dialog open={isAddWhiskeyOpen} onOpenChange={setIsAddWhiskeyOpen}>
        <DialogContent className="bg-card border-border/50 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Whiskeys to Session</DialogTitle>
          </DialogHeader>

          {availableWhiskeys.length > 0 ? (
            <div className="space-y-2">
              {availableWhiskeys.map((whiskey) => (
                <label
                  key={whiskey.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedWhiskeyIds.includes(whiskey.id)}
                    onCheckedChange={(checked) => {
                      setSelectedWhiskeyIds(prev =>
                        checked
                          ? [...prev, whiskey.id]
                          : prev.filter(id => id !== whiskey.id)
                      );
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{whiskey.name}</p>
                    {whiskey.distillery && (
                      <p className="text-xs text-muted-foreground">{whiskey.distillery}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No more whiskeys available to add.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWhiskeyOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddWhiskeys}
              disabled={selectedWhiskeyIds.length === 0}
            >
              Add {selectedWhiskeyIds.length} Whiskey{selectedWhiskeyIds.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm action dialog */}
      {confirmAction && (
        <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
          <AlertDialogContent className="bg-card border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmMessages[confirmAction].title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmMessages[confirmAction].description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default ClubSession;
