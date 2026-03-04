import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Search, UserPlus } from "lucide-react";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: number;
}

export function InviteMemberModal({ open, onOpenChange, clubId }: InviteMemberModalProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  // Search users
  const { data: searchResults } = useQuery<{ users: Pick<User, 'id' | 'username' | 'displayName' | 'profileImage'>[] }>({
    queryKey: ["/api/users/search", search],
    queryFn: async () => {
      if (!search.trim()) return { users: [] };
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
      if (!res.ok) return { users: [] };
      return res.json();
    },
    enabled: search.length >= 2,
  });

  const inviteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/clubs/${clubId}/members`, { userId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${clubId}/members`] });
      toast({ title: "Invite sent", description: "Member has been invited to the club." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="user-search">Search by username</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="user-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a username..."
                className="pl-9"
              />
            </div>
          </div>

          {searchResults?.users && searchResults.users.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30"
                >
                  <div className="flex items-center gap-3">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {(user.displayName || user.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{user.displayName || user.username}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => inviteMutation.mutate(user.id)}
                    disabled={inviteMutation.isPending}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Invite
                  </Button>
                </div>
              ))}
            </div>
          )}

          {search.length >= 2 && searchResults?.users?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users found matching "{search}"
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
