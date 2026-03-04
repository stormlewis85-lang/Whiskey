import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Club, ClubMember, ClubSession, User } from "@shared/schema";
import { SessionCard } from "@/components/clubs/SessionCard";
import { CreateSessionModal } from "@/components/clubs/CreateSessionModal";
import { InviteMemberModal } from "@/components/clubs/InviteMemberModal";
import {
  Plus, Users, Calendar, UserPlus, Shield, Trash2, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Tab = "sessions" | "members";

type MemberWithUser = ClubMember & {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'profileImage'>;
};

const ClubDetail = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ clubId: string }>();
  const clubId = parseInt(params.clubId || "0");
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: club } = useQuery<Club>({
    queryKey: [`/api/clubs/${clubId}`],
    enabled: !!clubId,
  });

  const { data: sessions } = useQuery<ClubSession[]>({
    queryKey: [`/api/clubs/${clubId}/sessions`],
    enabled: !!clubId,
  });

  const { data: members } = useQuery<MemberWithUser[]>({
    queryKey: [`/api/clubs/${clubId}/members`],
    enabled: !!clubId,
  });

  const isAdmin = members?.some(
    (m) => m.userId === currentUser?.id && m.role === "admin" && m.status === "active"
  );

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/clubs/${clubId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      navigate("/clubs");
      toast({ title: "Club deleted" });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/clubs/${clubId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${clubId}/members`] });
      toast({ title: "Member removed" });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  if (!club) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full w-8 h-8 border-2 border-muted border-t-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* Club info */}
      <div className="px-4 pt-4 pb-2">
        {club.description && (
          <p className="text-sm text-muted-foreground mb-3">{club.description}</p>
        )}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            {members?.filter(m => m.status === "active").length || 0} members
          </Badge>
          {isAdmin && (
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-500">
              <Crown className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border/50 px-4 mt-2">
        <button
          onClick={() => setActiveTab("sessions")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors bg-transparent cursor-pointer",
            activeTab === "sessions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground"
          )}
        >
          <Calendar className="w-4 h-4 inline-block mr-1.5" />
          Sessions
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors bg-transparent cursor-pointer",
            activeTab === "members"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground"
          )}
        >
          <Users className="w-4 h-4 inline-block mr-1.5" />
          Members
        </button>
      </div>

      <div className="px-4 pt-4">
        {activeTab === "sessions" && (
          <>
            {isAdmin && (
              <Button
                onClick={() => setIsCreateSessionOpen(true)}
                className="w-full mb-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Button>
            )}

            {sessions && sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onClick={() => navigate(`/clubs/${clubId}/sessions/${session.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No sessions yet</h3>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? "Create a tasting session to get started." : "The club admin will create sessions."}
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "members" && (
          <>
            {isAdmin && (
              <Button
                onClick={() => setIsInviteOpen(true)}
                className="w-full mb-4"
                variant="outline"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            )}

            {members && members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      {member.user.profileImage ? (
                        <img
                          src={member.user.profileImage}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {(member.user.displayName || member.user.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{member.user.displayName || member.user.username}</p>
                        <div className="flex items-center gap-1.5">
                          {member.role === "admin" && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-500/30 text-amber-500">
                              Admin
                            </Badge>
                          )}
                          {member.status === "invited" && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              Invited
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {isAdmin && member.userId !== currentUser?.id && member.status === "active" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeMemberMutation.mutate(member.userId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No members yet.</p>
            )}

            {isAdmin && (
              <div className="mt-8">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Club
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <CreateSessionModal
        open={isCreateSessionOpen}
        onOpenChange={setIsCreateSessionOpen}
        clubId={clubId}
      />

      <InviteMemberModal
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        clubId={clubId}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Club?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the club, all sessions, and all ratings. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClubDetail;
