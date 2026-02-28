import { Heart, MessageCircle } from "lucide-react";

interface ActivityActionsProps {
  likes: number;
  comments: number;
  liked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
}

export function ActivityActions({ likes, comments, liked, onLike, onComment }: ActivityActionsProps) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        onClick={onLike}
        className={`flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-colors ${
          liked ? "text-primary" : "text-muted-foreground"
        }`}
        style={{ fontSize: "0.7rem", minHeight: "44px", padding: "8px 12px" }}
      >
        <Heart className={`w-4 h-4 ${liked ? "fill-primary" : ""}`} />
        {likes}
      </button>

      <button
        onClick={onComment}
        className="flex items-center gap-1.5 text-muted-foreground bg-transparent border-none cursor-pointer"
        style={{ fontSize: "0.7rem", minHeight: "44px", padding: "8px 12px" }}
      >
        <MessageCircle className="w-4 h-4" />
        {comments}
      </button>
    </div>
  );
}
