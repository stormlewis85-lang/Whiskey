import { Star, BookOpen, Mic } from "lucide-react";
import { GlencairnIcon } from "@/components/GlencairnIcon";
import { cn } from "@/lib/utils";

interface JournalSession {
  id: number;
  whiskeyId: number;
  whiskeyName: string;
  whiskeyImage?: string | null;
  whiskeyRating?: number;
  mode: "guided" | "notes";
  startedAt: string;
  completedAt: string | null;
}

interface RickJournalProps {
  sessions: JournalSession[];
  onResume: (session: JournalSession) => void;
}

export function RickJournal({ sessions, onResume }: RickJournalProps) {
  if (sessions.length === 0) {
    return (
      <section className="px-5 py-12">
        <div className="flex flex-col items-center text-center">
          {/* Glencairn glass empty state */}
          <svg
            width="40"
            height="40"
            viewBox="58 36 84 114"
            fill="none"
            className="text-muted-foreground/30 mb-4"
          >
            <ellipse cx="100" cy="46" rx="14" ry="3.5" stroke="currentColor" strokeWidth="3" fill="none" />
            <path d="M86 46 C86 46 83 58 81 66 C76 76 68 88 68 102 C68 118 82 130 100 130 C118 130 132 118 132 102 C132 88 124 76 119 66 C117 58 114 46 114 46" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" />
            <line x1="100" y1="130" x2="100" y2="140" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="100" cy="142" rx="18" ry="4" stroke="currentColor" strokeWidth="3" fill="none" />
          </svg>
          <p className="text-muted-foreground text-sm">Your first guided tasting awaits</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 pb-28">
      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-4">
        Tasting Journal
      </p>
      <div className="space-y-3">
        {sessions.map((session) => (
          <JournalEntry key={session.id} session={session} onTap={() => onResume(session)} />
        ))}
      </div>
    </section>
  );
}

function JournalEntry({
  session,
  onTap,
}: {
  session: JournalSession;
  onTap: () => void;
}) {
  const isCompleted = !!session.completedAt;
  const date = formatDate(session.startedAt);
  const rating = session.whiskeyRating || 0;

  return (
    <button
      onClick={onTap}
      className={cn(
        "w-full text-left bg-card rounded-xl p-4 transition-all duration-200 cursor-pointer border",
        "hover:shadow-warm-sm active:scale-[0.98]",
        isCompleted
          ? "border-l-[3px] border-l-amber-500/60 border-t-border/50 border-r-border/50 border-b-border/50"
          : "border-border/50",
      )}
    >
      <div className="flex gap-3">
        {/* Bottle thumbnail */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-accent/30 flex items-center justify-center shrink-0">
          {session.whiskeyImage ? (
            <img src={session.whiskeyImage} alt={session.whiskeyName} className="w-full h-full object-cover" />
          ) : (
            <GlencairnIcon className="w-5 h-5 text-muted-foreground/40" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-sm text-foreground truncate">{session.whiskeyName}</h3>
            {rating > 0 && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs text-primary font-medium">{rating}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {session.mode === "guided" ? (
              <BookOpen className="w-3 h-3" />
            ) : (
              <Mic className="w-3 h-3" />
            )}
            <span>{date}</span>
            {!isCompleted && (
              <span className="text-amber-500 font-medium">In progress</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Unknown date";
  }
}
