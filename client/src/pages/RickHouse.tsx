import { useState, lazy, Suspense, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { RickAtmosphere } from "@/components/rick/RickAtmosphere";
import { RickShelf } from "@/components/rick/RickShelf";
import { RickJournal } from "@/components/rick/RickJournal";
import { generateSuggestions } from "@/lib/rick-suggestions";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft } from "lucide-react";
import type { Whiskey, ReviewNote } from "@shared/schema";

const TastingModeModal = lazy(() => import("@/components/modals/TastingModeModal"));
const TastingSession = lazy(() => import("@/components/TastingSession"));
const RickReviewSession = lazy(() => import("@/components/RickReviewSession"));
const RickErrorBoundary = lazy(() => import("@/components/RickErrorBoundary"));
const ReviewModal = lazy(() => import("@/components/modals/ReviewModal"));

interface SessionHistoryItem {
  id: number;
  whiskeyId: number;
  whiskeyName: string;
  mode: "guided" | "notes";
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

const RickHouse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Tasting flow state
  const [isTastingModeModalOpen, setIsTastingModeModalOpen] = useState(false);
  const [isTastingSessionActive, setIsTastingSessionActive] = useState(false);
  const [isRickReviewSessionActive, setIsRickReviewSessionActive] = useState(false);
  const [tastingMode, setTastingMode] = useState<"guided" | "notes">("guided");
  const [selectedWhiskeyId, setSelectedWhiskeyId] = useState<string>("");
  const [resumeSessionId, setResumeSessionId] = useState<number | undefined>(undefined);

  // Review modal state (opened after tasting completion)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [existingReview, setExistingReview] = useState<ReviewNote | undefined>(undefined);

  // Data queries
  const { data: sessions = [] } = useQuery<SessionHistoryItem[]>({
    queryKey: ["/api/rick/sessions"],
  });

  const { data: whiskeys = [] } = useQuery<Whiskey[]>({
    queryKey: ["/api/whiskeys"],
  });

  const selectedWhiskey = whiskeys.find((w) => w.id === parseInt(selectedWhiskeyId)) || null;
  const availableWhiskeys = whiskeys.filter((w) => !w.isWishlist);

  // Generate shelf suggestions
  const suggestions = useMemo(
    () => generateSuggestions(whiskeys, sessions),
    [whiskeys, sessions],
  );

  // Atmosphere context
  const today = new Date().toDateString();
  const lastSessionToday = sessions.some(
    (s) => new Date(s.startedAt).toDateString() === today,
  );

  // Journal entries — enrich with whiskey data
  const journalSessions = useMemo(
    () =>
      sessions.map((s) => {
        const w = whiskeys.find((w) => w.id === s.whiskeyId);
        return {
          ...s,
          whiskeyImage: w?.image || null,
          whiskeyRating: w?.rating || 0,
        };
      }),
    [sessions, whiskeys],
  );

  // ── Handlers ──

  const handleSelectWhiskey = (whiskey: Whiskey) => {
    setSelectedWhiskeyId(String(whiskey.id));
    setIsTastingModeModalOpen(true);
  };

  const handleResumeSession = (session: { id: number; whiskeyId: number; mode: "guided" | "notes"; completedAt: string | null }) => {
    setSelectedWhiskeyId(String(session.whiskeyId));
    setTastingMode(session.mode);
    setResumeSessionId(session.id);
    setIsTastingSessionActive(true);
  };

  const handleSessionEnd = () => {
    setIsTastingSessionActive(false);
    setResumeSessionId(undefined);
    queryClient.invalidateQueries({ queryKey: ["/api/rick/sessions"] });
  };

  const handleSessionComplete = () => {
    // The seeded-review bridge (TastingCompletion, rendered inside
    // TastingSession) now owns review creation/updates for a completed
    // tasting — this handler just closes the session and refreshes data.
    setIsTastingSessionActive(false);
    setResumeSessionId(undefined);
    queryClient.invalidateQueries({ queryKey: ["/api/rick/sessions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
  };

  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#050505" }}>
      {/* Rick House header — no standard chrome */}
      {isMobile ? (
        <div className="flex items-center px-5 pt-4 pb-2">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Step out
          </button>
          <span className="ml-auto text-label-caps text-muted-foreground/50">Rick House</span>
        </div>
      ) : (
        <Header />
      )}

      {/* Zone 1 — The Atmosphere */}
      <RickAtmosphere
        userName={user?.displayName || user?.username || null}
        sessionCount={sessions.length}
        lastSessionToday={lastSessionToday}
      />

      {/* Zone divider */}
      <div className="px-5 mt-8">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-label-caps text-muted-foreground/50">THE SHELF</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>
      </div>

      {/* Zone 2 — The Shelf */}
      <RickShelf
        suggestions={suggestions}
        availableWhiskeys={availableWhiskeys}
        sessions={sessions}
        onSelectWhiskey={handleSelectWhiskey}
      />

      {/* Zone divider */}
      <div className="px-5 mt-8">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-label-caps text-muted-foreground/50">THE JOURNAL</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>
      </div>

      {/* Zone 3 — The Journal */}
      <div className="mt-4">
        <RickJournal sessions={journalSessions} onResume={handleResumeSession} />
      </div>

      {/* ── Tasting Flow (unchanged) ── */}
      {selectedWhiskey && (
        <>
          <Suspense fallback={null}>
            <TastingModeModal
              isOpen={isTastingModeModalOpen}
              onClose={() => setIsTastingModeModalOpen(false)}
              whiskey={selectedWhiskey}
              onSelectMode={(mode) => {
                setResumeSessionId(undefined);
                setIsTastingModeModalOpen(false);
                if (mode === "score") {
                  setIsRickReviewSessionActive(true);
                } else {
                  setTastingMode("guided");
                  setIsTastingSessionActive(true);
                }
              }}
            />
          </Suspense>

          {isRickReviewSessionActive && (
            <Suspense
              fallback={
                <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading Rick House...</div>
                </div>
              }
            >
              <RickErrorBoundary
                onClose={() => setIsRickReviewSessionActive(false)}
                onRetry={() => {
                  setIsRickReviewSessionActive(false);
                  setTimeout(() => setIsRickReviewSessionActive(true), 100);
                }}
              >
                <RickReviewSession
                  whiskey={selectedWhiskey}
                  onClose={() => setIsRickReviewSessionActive(false)}
                  onComplete={() => {
                    // Rick-guided score-as-we-go session finished — hand off to the
                    // regular review flow the same way a completed TastingSession does.
                    // NOTE: the six component scores computed by RickReviewSession are
                    // not yet forwarded into ReviewModal from this entry point (that
                    // wiring lives inside ReviewModal's own "Review with Rick" path,
                    // out of this slice's file scope — see handoff Open items).
                    setIsRickReviewSessionActive(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
                    if (
                      selectedWhiskey.notes &&
                      Array.isArray(selectedWhiskey.notes) &&
                      selectedWhiskey.notes.length > 0
                    ) {
                      setExistingReview(selectedWhiskey.notes[selectedWhiskey.notes.length - 1] as ReviewNote);
                    } else {
                      setExistingReview(undefined);
                    }
                    setIsReviewModalOpen(true);
                  }}
                />
              </RickErrorBoundary>
            </Suspense>
          )}

          {isTastingSessionActive && (
            <Suspense
              fallback={
                <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading Rick House...</div>
                </div>
              }
            >
              <RickErrorBoundary
                onClose={handleSessionEnd}
                onRetry={() => {
                  setIsTastingSessionActive(false);
                  setTimeout(() => setIsTastingSessionActive(true), 100);
                }}
              >
                <TastingSession
                  whiskey={selectedWhiskey}
                  mode={tastingMode}
                  resumeSessionId={resumeSessionId}
                  onClose={handleSessionEnd}
                  onComplete={handleSessionComplete}
                />
              </RickErrorBoundary>
            </Suspense>
          )}

          <Suspense fallback={null}>
            <ReviewModal
              isOpen={isReviewModalOpen}
              onClose={() => {
                setIsReviewModalOpen(false);
                setExistingReview(undefined);
              }}
              whiskey={selectedWhiskey}
              existingReview={existingReview}
            />
          </Suspense>
        </>
      )}
    </div>
  );
};

export default RickHouse;
