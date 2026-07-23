import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import { Loader2, Star } from "lucide-react";
import { Whiskey, ReviewNote } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// ── 1d — Completion → re-score → seeded review bridge → share overlay ──
// Spec: scratchpad/design/rick-session-surfaces-spec.md §1d.
// Gold (#D4A44C) is reserved for: chosen re-score stars, the existing-review
// ★ in the provenance label, and ONE primary CTA per screen.

export interface RickScriptPhases {
  visual: string;
  nose: string;
  palate: string;
  finish: string;
  ricksTake: string;
  quip: string;
}

interface TastingCompletionProps {
  whiskey: Whiskey;
  script: RickScriptPhases;
  /** Pre-formatted display date for the session (e.g. "July 22, 2026"). */
  sessionDate: string;
  /** Most recent review for this whiskey, if one exists. */
  existingReview?: ReviewNote;
  /** "Back to the room" — exits without touching review data (GET-only). */
  onClose: () => void;
  /** Fired after a successful save — parent invalidates + closes the room. */
  onSaved: () => void;
}

type CompletionView = "completion" | "bridge";

const PHASE_KEYS = ["visual", "nose", "palate", "finish"] as const;
type PhaseKey = (typeof PHASE_KEYS)[number];

// Bridge phase kicker + which ReviewNote note-field each phase seeds.
// "palate" (the tasting-session phase) maps to the review's "taste" step —
// there is no session phase for mouthfeel/value, so those note fields are
// left untouched (update) / absent (create).
const PHASE_META: Record<PhaseKey, { kicker: string; field: "visualNotes" | "noseNotes" | "tasteNotes" | "finishNotes" }> = {
  visual: { kicker: "VISUAL", field: "visualNotes" },
  nose: { kicker: "NOSE", field: "noseNotes" },
  palate: { kicker: "PALATE", field: "tasteNotes" },
  finish: { kicker: "FINISH", field: "finishNotes" },
};

// "{N} phases in the books" / bridge phase cards — Visual, Nose, Palate, Finish.
const PHASE_COUNT = PHASE_KEYS.length;

// Weighted-overall formula — READ ONLY, mirrors ReviewModal.calculateWeightedScore
// exactly (nose 15%, mouthfeel 20%, taste 30%, finish 25%, value 10%; weights
// sum to 10). Not modified here — only read to derive a scaling factor.
function computeWeighted(scores: {
  nose?: number;
  mouthfeel?: number;
  taste?: number;
  finish?: number;
  value?: number;
}) {
  const ns = Number(scores.nose) || 0;
  const ms = Number(scores.mouthfeel) || 0;
  const ts = Number(scores.taste) || 0;
  const fs = Number(scores.finish) || 0;
  const vs = Number(scores.value) || 0;
  return (ns * 1.5 + ms * 2.0 + ts * 3.0 + fs * 2.5 + vs * 1.0) / 10;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// Strip a single layer of surrounding straight/smart quotes from seeded prose
// (Rick's script strings render wrapped in quotes on the session screen).
function stripQuotes(text: string) {
  return text.trim().replace(/^[“”"']+/, "").replace(/[“”"']+$/, "");
}

function formatMonYear(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatMon(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short" });
}

// ── Session card — shared between the completion screen (full) and the
// share overlay (295px variant with branding footer). ──
interface SessionCardProps {
  whiskey: Whiskey;
  script: RickScriptPhases;
  sessionDate: string;
  variant: "full" | "share";
  onShare?: () => void;
}

const SessionCard = ({ whiskey, script, sessionDate, variant, onShare }: SessionCardProps) => (
  <div
    className={variant === "share" ? "w-[295px] rounded-[14px] border p-5" : "rounded-[14px] border p-5"}
    style={{ backgroundColor: "#0D0C0A", borderColor: "rgba(237,232,224,0.10)" }}
  >
    <div className="flex items-center justify-between">
      <span className="font-display text-[12px] uppercase tracking-[0.24em]" style={{ color: "#7A7060" }}>
        RICK HOUSE
      </span>
      <span className="text-[12px]" style={{ color: "#8A8072" }}>
        {sessionDate}
      </span>
    </div>

    <h2 className="font-heading text-[22px] font-normal leading-tight mt-2" style={{ color: "#EDE8E0" }}>
      {whiskey.name}
    </h2>

    {script.ricksTake && (
      <p className="font-heading italic text-[15px] leading-[1.6] mt-3" style={{ color: "#D8D1C6" }}>
        "{script.ricksTake}"
      </p>
    )}

    <p className="text-[12px] mt-3" style={{ color: "#8A8072" }}>
      Rick's take · your notes on all {PHASE_COUNT} phases
    </p>

    <div className="h-px my-4" style={{ backgroundColor: "rgba(237,232,224,0.08)" }} />

    <div className="flex items-center justify-between">
      <span className="text-[12px]" style={{ color: "#7A7060" }}>
        {variant === "share" ? "Tasted with Rick · mywhiskeypedia.com" : "Tasted with Rick"}
      </span>
      {variant === "full" && onShare && (
        <button
          type="button"
          onClick={onShare}
          className="rounded-full px-4 min-h-[38px] text-[13px] font-semibold"
          style={{ backgroundColor: "rgba(237,232,224,0.08)", color: "#EDE8E0" }}
        >
          Share card
        </button>
      )}
    </div>
  </div>
);

const TastingCompletion = ({ whiskey, script, sessionDate, existingReview, onClose, onSaved }: TastingCompletionProps) => {
  const { toast } = useToast();
  const [view, setView] = useState<CompletionView>("completion");
  const [showShare, setShowShare] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [rescore, setRescore] = useState<number | null>(null);
  const [phaseNotes, setPhaseNotes] = useState<Record<PhaseKey, string>>({
    visual: stripQuotes(script.visual || ""),
    nose: stripQuotes(script.nose || ""),
    palate: stripQuotes(script.palate || ""),
    finish: stripQuotes(script.finish || ""),
  });
  const shareCardRef = useRef<HTMLDivElement>(null);

  const isEditMode = !!existingReview;
  const wasRescored = rescore !== null;

  const saveReviewMutation = useMutation({
    mutationFn: async () => {
      const noteOverrides: Record<string, string> = {};
      PHASE_KEYS.forEach((key) => {
        noteOverrides[PHASE_META[key].field] = phaseNotes[key];
      });

      if (existingReview) {
        let scoreOverrides: Partial<ReviewNote> = {};
        let rating = existingReview.rating;

        if (wasRescored) {
          const target = rescore as number;
          const current = computeWeighted({
            nose: existingReview.noseScore,
            mouthfeel: existingReview.mouthfeelScore,
            taste: existingReview.tasteScore,
            finish: existingReview.finishScore,
            value: existingReview.valueScore,
          });

          const scale = (v?: number) => {
            if (current > 0) {
              // Proportional path — undefined components stay undefined.
              if (v === undefined || v === null) return v;
              return clamp(Math.round((v * target) / current), 1, 5);
            }
            // Zero baseline (no scorable components at all) — there's
            // nothing to scale proportionally from, so every weighted
            // component becomes the chosen target directly (clamped).
            // With all five equal to round(target), computeWeighted's
            // weights (which sum to 10) recompute the overall back to
            // round(target) exactly.
            return clamp(Math.round(target), 1, 5);
          };

          scoreOverrides = {
            noseScore: scale(existingReview.noseScore),
            mouthfeelScore: scale(existingReview.mouthfeelScore),
            tasteScore: scale(existingReview.tasteScore),
            finishScore: scale(existingReview.finishScore),
            valueScore: scale(existingReview.valueScore),
          };

          // Recompute the overall from the final (clamped) components — this
          // is the same weighted formula ReviewModal already uses; we don't
          // invent a new one. Clamping can leave it a shade off the exact
          // chosen target when a component hits its ceiling/floor.
          rating =
            Math.round(
              computeWeighted({
                nose: scoreOverrides.noseScore,
                mouthfeel: scoreOverrides.mouthfeelScore,
                taste: scoreOverrides.tasteScore,
                finish: scoreOverrides.finishScore,
                value: scoreOverrides.valueScore,
              }) * 10,
            ) / 10;
        }

        const payload: ReviewNote = {
          ...existingReview,
          ...scoreOverrides,
          ...noteOverrides,
          rating,
        };

        const response = await apiRequest("PUT", `/api/whiskeys/${whiskey.id}/reviews/${existingReview.id}`, payload);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update review");
        }
        return response.json();
      }

      // No existing review — create one with seeded notes and standard
      // neutral defaults (never invent scores).
      const payload = {
        rating: 0,
        date: new Date().toISOString().split("T")[0],
        text: "",
        flavor: "",
        noseAromas: [] as string[],
        tasteFlavors: [] as string[],
        finishFlavors: [] as string[],
        isPublic: false,
        ...noteOverrides,
      };

      const response = await apiRequest("POST", `/api/whiskeys/${whiskey.id}/reviews`, payload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create review");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rick/sessions"] });
      toast({
        title: isEditMode ? "Review Updated" : "Review Added",
        description: "Your tasting notes have been saved.",
      });
      onSaved();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "add"} review: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveImage = async () => {
    if (!shareCardRef.current) return;
    setIsSavingImage(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0D0C0A",
        logging: false,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${whiskey.name.replace(/[^a-zA-Z0-9]/g, "_")}_tasting.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
          title: "Image downloaded!",
          description: "Your share image has been saved.",
        });
      }, "image/png", 1.0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingImage(false);
    }
  };

  // ── Re-score stars — 5 buttons, 44x44 touch target, tap-same-to-unset. ──
  const renderStars = () => (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = rescore !== null && n <= rescore;
        return (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRescore((prev) => (prev === n ? null : n))}
            className="flex items-center justify-center w-11 h-11 shrink-0"
          >
            <Star
              className="w-[26px] h-[26px]"
              style={{ color: active ? "#D4A44C" : "rgba(237,232,224,0.22)" }}
              fill={active ? "#D4A44C" : "none"}
            />
          </button>
        );
      })}
    </div>
  );

  // ── BRIDGE VIEW ──
  if (view === "bridge") {
    return (
      <div className="fixed inset-0 z-[60] bg-background overflow-y-auto">
        <div className="flex flex-col items-center px-5 py-10">
          <div className="max-w-md w-full space-y-6">
            <button
              type="button"
              onClick={() => setView("completion")}
              className="text-[13px]"
              style={{ color: "#A69C8D" }}
            >
              ← Back
            </button>

            <div className="space-y-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#8A8072" }}>
                SEEDED FROM TONIGHT'S TASTING
              </p>
              <h1 className="font-heading text-[24px]" style={{ color: "#EDE8E0" }}>
                Your {whiskey.name} review
              </h1>
              {isEditMode && wasRescored && (
                <p className="text-[13px]" style={{ color: "#A69C8D" }}>
                  Overall updated to {rescore}.0 — the six components tune together when you save.
                </p>
              )}
              {isEditMode && !wasRescored && existingReview && (
                <p className="text-[13px]" style={{ color: "#A69C8D" }}>
                  Score carried from your {formatMon(existingReview.date)} review — ★ {existingReview.rating.toFixed(1)}. Six components unchanged.
                </p>
              )}
            </div>

            <div className="space-y-5">
              {PHASE_KEYS.map((key) => (
                <div key={key} className="space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#8A8072" }}>
                    {PHASE_META[key].kicker}
                  </p>
                  <textarea
                    value={phaseNotes[key]}
                    onChange={(e) => setPhaseNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                    rows={4}
                    className="w-full rounded-[10px] border px-4 py-3.5 text-[14px] leading-[1.6] resize-none focus:outline-none"
                    style={{ backgroundColor: "#0D0C0A", borderColor: "rgba(237,232,224,0.12)", color: "#D8D1C6" }}
                  />
                </div>
              ))}
            </div>

            <p className="italic text-[13px]" style={{ color: "#8A8072" }}>
              Rick's phrasing is a starting point — make it yours. Tap any section to edit.
            </p>

            <Button
              onClick={() => saveReviewMutation.mutate()}
              disabled={saveReviewMutation.isPending}
              className="w-full h-[52px] rounded-[10px] font-semibold hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#D4A44C", color: "#1A1200" }}
            >
              {saveReviewMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save review"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── COMPLETION VIEW ──
  return (
    <div className="fixed inset-0 z-[60] bg-background overflow-y-auto">
      <div className="flex flex-col items-center px-5 py-10">
        <div className="max-w-md w-full space-y-8">
          {/* Hero — outline check, NOT gold */}
          <div className="flex justify-center">
            <div
              className="w-11 h-11 rounded-full border flex items-center justify-center"
              style={{ borderColor: "rgba(237,232,224,0.35)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#EDE8E0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="text-center space-y-1.5">
            <h1 className="font-heading text-[26px]" style={{ color: "#EDE8E0" }}>
              Tasting complete
            </h1>
            <p className="text-[14px]" style={{ color: "#A69C8D" }}>
              {PHASE_COUNT} phases in the books.
            </p>
          </div>

          <SessionCard
            whiskey={whiskey}
            script={script}
            sessionDate={sessionDate}
            variant="full"
            onShare={() => setShowShare(true)}
          />

          {existingReview && (
            <div className="rounded-[14px] border p-5 space-y-4" style={{ borderColor: "rgba(237,232,224,0.08)" }}>
              <p className="text-[13px] flex items-center justify-center gap-1.5" style={{ color: "#A69C8D" }}>
                Your review ·
                <Star className="w-3.5 h-3.5" style={{ color: "#D4A44C" }} fill="#D4A44C" />
                {existingReview.rating.toFixed(1)} · {formatMonYear(existingReview.date)}
              </p>
              <p className="text-[15px] text-center" style={{ color: "#D8D1C6" }}>
                Palates evolve — update your {existingReview.rating.toFixed(1)}?
              </p>

              {renderStars()}

              {wasRescored && (
                <p className="text-[13px] text-center" style={{ color: "#B5AC9F" }}>
                  You called it {rescore}.0 tonight — that carries into the review below.
                </p>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setRescore(null)}
                  className="text-[13px] underline"
                  style={{ color: "#8A8072" }}
                >
                  Keep it at {existingReview.rating.toFixed(1)}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3 text-center">
            <Button
              onClick={() => setView("bridge")}
              className="w-full h-[52px] rounded-[10px] font-semibold hover:opacity-90"
              style={{ backgroundColor: "#D4A44C", color: "#1A1200" }}
            >
              Refine into your review
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="text-[14px]"
              style={{ color: "#A69C8D" }}
            >
              Back to the room
            </button>
          </div>
        </div>
      </div>

      {/* Share overlay */}
      {showShare && (
        <div
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 px-5"
          style={{ backgroundColor: "rgba(5,5,5,0.88)" }}
        >
          <div ref={shareCardRef}>
            <SessionCard whiskey={whiskey} script={script} sessionDate={sessionDate} variant="share" />
          </div>

          <div className="flex gap-3 w-full max-w-[295px]">
            <button
              type="button"
              onClick={handleSaveImage}
              disabled={isSavingImage}
              className="flex-1 min-h-[44px] rounded-full text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: "rgba(237,232,224,0.12)", color: "#EDE8E0" }}
            >
              {isSavingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save as image
            </button>
            <button
              type="button"
              onClick={() => setShowShare(false)}
              className="flex-1 min-h-[44px] rounded-full border text-[13px] font-semibold"
              style={{ borderColor: "rgba(237,232,224,0.25)", color: "#EDE8E0" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TastingCompletion;
