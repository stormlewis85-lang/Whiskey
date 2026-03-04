import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronRight } from "lucide-react";
import { Club } from "@shared/schema";
import { format } from "date-fns";

interface ClubCardProps {
  club: Club;
  onClick: () => void;
}

export function ClubCard({ club, onClick }: ClubCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/30 transition-colors border-border/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{club.name}</h3>
            {club.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {club.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Club
              </Badge>
              {club.createdAt && (
                <span className="text-xs text-muted-foreground">
                  Created {format(new Date(club.createdAt), "MMM d, yyyy")}
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
