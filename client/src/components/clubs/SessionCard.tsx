import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight } from "lucide-react";
import { ClubSession } from "@shared/schema";
import { format } from "date-fns";

interface SessionCardProps {
  session: ClubSession;
  onClick: () => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  revealed: "bg-blue-500/15 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/15 text-green-500 border-green-500/20",
};

export function SessionCard({ session, onClick }: SessionCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/30 transition-colors border-border/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground truncate">{session.name}</h4>
              <Badge variant="outline" className={statusColors[session.status || 'draft']}>
                {session.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              {session.scheduledFor && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(session.scheduledFor), "MMM d, yyyy h:mm a")}
                </span>
              )}
              {session.createdAt && (
                <span className="text-xs text-muted-foreground">
                  Created {format(new Date(session.createdAt), "MMM d")}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50 flex-shrink-0 ml-2" />
        </div>
      </CardContent>
    </Card>
  );
}
