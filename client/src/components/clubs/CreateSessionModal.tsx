import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: number;
}

export function CreateSessionModal({ open, onOpenChange, clubId }: CreateSessionModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; scheduledFor?: string }) => {
      const response = await apiRequest("POST", `/api/clubs/${clubId}/sessions`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${clubId}/sessions`] });
      onOpenChange(false);
      setName("");
      setDescription("");
      setScheduledFor("");
      toast({ title: "Session created", description: "Tasting session has been created in draft mode." });
    },
    onError: (error) => {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>Create Tasting Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Friday Night Bourbon Flight"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="session-desc">Description (optional)</Label>
            <Textarea
              id="session-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are we tasting?"
              className="mt-1"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="session-date">Schedule For (optional)</Label>
            <Input
              id="session-date"
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              createMutation.mutate({
                name,
                description: description || undefined,
                scheduledFor: scheduledFor || undefined,
              })
            }
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
