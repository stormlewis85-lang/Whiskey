import { GlencairnIcon } from "@/components/GlencairnIcon";
import { cn } from "@/lib/utils";

// ── 1e — Journal provenance ──
// Spec: scratchpad/design/rick-session-surfaces-spec.md §1e.
// Session rows never show a score/star (RICK-UX-04 conflation fix) — the
// review's rating lived on the whiskey, not the session, and showing it here
// implied the session itself was scored. This journal only renders tasting
// SESSIONS (no separate review-derived rows exist in this data), so no
// review-row variant is implemented — see handoff notes.

interface JournalSession {
  id: number;
  whiskeyId: number;
  whiskeyName: string;
  whiskeyImage?: string | null;
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
  const when = formatWhen(isCompleted ? (session.completedAt as string) : session.startedAt);
  const meta = isCompleted
    ? `${when} · Rick's take + your notes · no score`
    : `${when} · In progress`;

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

        {/* Content — no score/star on session rows (spec §1e). */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-medium truncate" style={{ color: "#EDE8E0" }}>
            Tasting with Rick — {session.whiskeyName}
          </h3>
          <p className="text-[12px] mt-1 truncate" style={{ color: "#8A8072" }}>
            {meta}
          </p>
        </div>
      </div>
    </button>
  );
}

// "Tonight" if the reference date is today, else "Mon D" (no year — spec §1e).
function formatWhen(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "Unknown date";
    if (d.toDateString() === new Date().toDateString()) return "Tonight";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Unknown date";
  }
}
