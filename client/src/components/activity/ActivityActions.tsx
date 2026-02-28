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
    <div className="flex items-center gap-5 mt-3">
      <button
        onClick={onLike}
        className={`flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-colors ${
          liked ? "text-primary" : "text-muted-foreground"
        }`}
        style={{ fontSize: "0.7rem" }}
      >
        <Heart className={`w-4 h-4 ${liked ? "fill-primary" : ""}`} />
        {likes}
      </button>

      <button
        onClick={onComment}
        className="flex items-center gap-1.5 text-muted-foreground bg-transparent border-none cursor-pointer"
        style={{ fontSize: "0.7rem" }}
      >
        <MessageCircle className="w-4 h-4" />
        {comments}
      </button>
    </div>
  );
}
