import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Club, ClubMember } from "@shared/schema";
import { ClubCard } from "@/components/clubs/ClubCard";
import { CreateClubModal } from "@/components/clubs/CreateClubModal";
import { Plus, Users, Mail, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "clubs" | "invites";

const Clubs = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("clubs");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: clubs, isLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const { data: invites } = useQuery<(ClubMember & { club: Club })[]>({
    queryKey: ["/api/clubs/invites"],
  });

  const acceptMutation = useMutation({
    mutationFn: async (clubId: number) => {
      const response = await apiRequest("POST", `/api/clubs/${clubId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs/invites"] });
      toast({ title: "Joined club", description: "You've joined the tasting club." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (clubId: number) => {
      await apiRequest("POST", `/api/clubs/${clubId}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs/invites"] });
      toast({ title: "Invite declined" });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  const inviteCount = invites?.length || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-foreground">Tasting Clubs</h1>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border/50 px-4">
        <button
          onClick={() => setActiveTab("clubs")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors bg-transparent cursor-pointer",
            activeTab === "clubs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground"
          )}
        >
          <Users className="w-4 h-4 inline-block mr-1.5" />
          My Clubs
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors bg-transparent cursor-pointer relative",
            activeTab === "invites"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground"
          )}
        >
          <Mail className="w-4 h-4 inline-block mr-1.5" />
          Invites
          {inviteCount > 0 && (
            <Badge className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
              {inviteCount}
            </Badge>
          )}
        </button>
      </div>

      <div className="px-4 pt-4">
        {activeTab === "clubs" && (
          <>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="w-full mb-4"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Club
            </Button>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full w-8 h-8 border-2 border-muted border-t-primary" />
              </div>
            ) : clubs && clubs.length > 0 ? (
              <div className="space-y-3">
                {clubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onClick={() => navigate(`/clubs/${club.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No clubs yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create a tasting club to get started with group tastings.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "invites" && (
          <>
            {invites && invites.length > 0 ? (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="p-4 rounded-xl bg-card border border-border/50"
                  >
                    <h4 className="font-medium text-foreground">{invite.club.name}</h4>
                    {invite.club.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{invite.club.description}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => acceptMutation.mutate(invite.clubId)}
                        disabled={acceptMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => declineMutation.mutate(invite.clubId)}
                        disabled={declineMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No pending invites</h3>
                <p className="text-sm text-muted-foreground">
                  When someone invites you to a club, it will appear here.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <CreateClubModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
};

export default Clubs;
