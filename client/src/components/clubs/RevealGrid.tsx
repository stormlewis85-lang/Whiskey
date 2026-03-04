import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingData {
  userId: number;
  rating: number;
  notes?: string | null;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    profileImage: string | null;
  };
}

interface WhiskeyData {
  id: number;
  label: string;
  whiskey?: {
    id: number;
    name: string;
    distillery?: string | null;
    type?: string | null;
  };
  ratings: RatingData[];
}

interface RevealGridProps {
  whiskeys: WhiskeyData[];
}

export function RevealGrid({ whiskeys }: RevealGridProps) {
  // Collect all unique users across ratings
  const usersMap = new Map<number, RatingData['user']>();
  for (const w of whiskeys) {
    for (const r of w.ratings) {
      usersMap.set(r.user.id, r.user);
    }
  }
  const allUsers = Array.from(usersMap.values());

  if (allUsers.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No ratings were submitted for this session.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full min-w-[500px] border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 text-xs font-medium text-muted-foreground border-b border-border/50 sticky left-0 bg-background">
              Whiskey
            </th>
            {allUsers.map((user) => (
              <th
                key={user.id}
                className="text-center p-2 text-xs font-medium text-muted-foreground border-b border-border/50"
              >
                <div className="flex flex-col items-center gap-1">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-primary">
                        {(user.displayName || user.username).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="truncate max-w-[80px]">
                    {user.displayName || user.username}
                  </span>
                </div>
              </th>
            ))}
            <th className="text-center p-2 text-xs font-medium text-muted-foreground border-b border-border/50">
              Avg
            </th>
          </tr>
        </thead>
        <tbody>
          {whiskeys.map((w) => {
            const avgRating = w.ratings.length > 0
              ? w.ratings.reduce((sum, r) => sum + r.rating, 0) / w.ratings.length
              : 0;

            return (
              <tr key={w.id} className="border-b border-border/30 hover:bg-accent/20">
                <td className="p-2 sticky left-0 bg-background">
                  <div>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mr-2">
                      {w.label}
                    </span>
                    <span className="font-medium text-sm">
                      {w.whiskey?.name || "Unknown"}
                    </span>
                  </div>
                  {w.whiskey?.distillery && (
                    <span className="text-xs text-muted-foreground ml-8">
                      {w.whiskey.distillery}
                    </span>
                  )}
                </td>
                {allUsers.map((user) => {
                  const userRating = w.ratings.find(r => r.userId === user.id);
                  return (
                    <td key={user.id} className="text-center p-2">
                      {userRating ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium">{userRating.rating}</span>
                          </div>
                          {userRating.notes && (
                            <span className="text-[10px] text-muted-foreground max-w-[80px] truncate" title={userRating.notes}>
                              {userRating.notes}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="text-center p-2">
                  <div className="flex items-center justify-center gap-0.5">
                    <Star className={cn(
                      "w-3.5 h-3.5",
                      avgRating > 0 ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                    )} />
                    <span className="text-sm font-semibold">
                      {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
