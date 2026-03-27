import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Whiskey } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X, Volume2, VolumeX, Star, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import AudioPlayer from "./AudioPlayer";

// Rick Review Script interface
interface RickReviewScript {
  intro: string;
  visual: string;
  nose: string;
  mouthfeel: string;
  taste: string;
  finish: string;
  value: string;
  closing: string;
  quip: string;
}

// Review phases that require scoring
type ReviewPhase = 'intro' | 'visual' | 'nose' | 'mouthfeel' | 'taste' | 'finish' | 'value' | 'closing';

const PHASES: ReviewPhase[] = ['intro', 'visual', 'nose', 'mouthfeel', 'taste', 'finish', 'value', 'closing'];
const PHASE_LABELS: Record<ReviewPhase, string> = {
  intro: 'Welcome',
  visual: 'Visual',
  nose: 'Nose',
  mouthfeel: 'Mouthfeel',
  taste: 'Taste',
  finish: 'Finish',
  value: 'Value',
  closing: 'Summary'
};

// Rick's guiding voice for each phase
const PHASE_PROMPTS: Record<ReviewPhase, string> = {
  intro: "Let's take our time with this one.",
  visual: "Hold it up. Let the light do the talking.",
  nose: "Bring it close. What finds you first?",
  mouthfeel: "Notice the weight. The texture. The warmth.",
  taste: "Now — what's the story on the palate?",
  finish: "Swallow. What stays behind matters most.",
  value: "The final measure. Was it worth the pour?",
  closing: "Let's put it all together.",
};

// Phases that have scoring
const SCORING_PHASES: ReviewPhase[] = ['nose', 'mouthfeel', 'taste', 'finish', 'value'];

interface PhaseAudio {
  audio: string | null;
  contentType: string | null;
  textOnly: boolean;
  error?: string;
}

interface ReviewScores {
  nose: number;
  mouthfeel: number;
  taste: number;
  finish: number;
  value: number;
  summary: string;
}

interface RickReviewSessionProps {
  whiskey: Whiskey;
  onClose: () => void;
  onComplete: (scores: ReviewScores) => void;
}

// Loading messages — Rick's personality
const LOADING_MESSAGES = [
  "Rick is studying the label...",
  "Pulling up a stool, gathering his thoughts...",
  "Every bottle has a story. Let's find this one...",
  "Forty-two years of experience, distilled into this moment...",
];

const RickReviewSession = ({ whiskey, onClose, onComplete }: RickReviewSessionProps) => {
  const { toast } = useToast();
  const [script, setScript] = useState<RickReviewScript | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [phaseAudio, setPhaseAudio] = useState<Record<ReviewPhase, PhaseAudio | null>>({
    intro: null, visual: null, nose: null, mouthfeel: null,
    taste: null, finish: null, value: null, closing: null
  });
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Review scores state
  const [scores, setScores] = useState<ReviewScores>({
    nose: 0, mouthfeel: 0, taste: 0, finish: 0, value: 0, summary: ''
  });

  const currentPhase = PHASES[currentPhaseIndex];
  const isCurrentScoringPhase = SCORING_PHASES.includes(currentPhase);
  const isSummaryPhase = currentPhase === 'closing';

  // Rotate loading messages
  useEffect(() => {
    if (!script) {
      const interval = setInterval(() => {
        setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [script]);

  // Generate review guide mutation
  const generateGuideMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rick/review-guide", {
        whiskeyId: whiskey.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      setScript(data.script);
    },
    onError: (error) => {
      toast({
        title: "Failed to start review",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Load audio for current phase (if enabled)
  const loadPhaseAudio = async (phase: ReviewPhase, text: string) => {
    if (!isAudioEnabled) return;
    if (phaseAudio[phase]) return;

    setIsLoadingAudio(true);
    try {
      const response = await apiRequest("POST", "/api/rick/text-to-speech", {
        text,
        phase
      });
      const data = await response.json();
      setPhaseAudio(prev => ({
        ...prev,
        [phase]: {
          audio: data.audio,
          contentType: data.contentType,
          textOnly: data.textOnly || false,
          error: data.error
        }
      }));
    } catch (error) {
      setPhaseAudio(prev => ({
        ...prev,
        [phase]: {
          audio: null, contentType: null, textOnly: true,
          error: error instanceof Error ? error.message : 'Failed to load audio'
        }
      }));
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Load audio when phase changes (if enabled)
  useEffect(() => {
    if (script && isAudioEnabled) {
      loadPhaseAudio(currentPhase, script[currentPhase]);
    }
  }, [currentPhase, script, isAudioEnabled]);

  // Start guide on mount
  useEffect(() => {
    generateGuideMutation.mutate();
  }, []);

  const handleScoreChange = (phase: keyof ReviewScores, value: number) => {
    setScores(prev => ({ ...prev, [phase]: value }));
  };

  const handleNext = () => {
    if (isCurrentScoringPhase && scores[currentPhase as keyof ReviewScores] === 0) {
      toast({
        title: "Score Required",
        description: `Please rate the ${PHASE_LABELS[currentPhase].toLowerCase()} before continuing.`,
        variant: "destructive"
      });
      return;
    }

    if (currentPhaseIndex < PHASES.length - 1) {
      setCurrentPhaseIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentPhaseIndex > 0) {
      setCurrentPhaseIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete(scores);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
  };

  // Haptic feedback
  const triggerHaptic = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // ── Star Rating ──

  const ScoreInput = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => {
            onChange(star);
            triggerHaptic(30);
          }}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full p-1 transition-transform active:scale-90"
        >
          <Star
            className={cn(
              "h-9 w-9 sm:h-10 sm:w-10 transition-all duration-200",
              star <= value
                ? "text-primary fill-primary drop-shadow-[0_0_6px_rgba(212,164,76,0.4)]"
                : "text-muted-foreground/20 hover:text-primary/40"
            )}
          />
        </button>
      ))}
    </div>
  );

  // ── Progress indicator — minimal line ──

  const ProgressBar = () => {
    const progress = ((currentPhaseIndex + 1) / PHASES.length) * 100;
    return (
      <div className="h-[2px] bg-border/30 w-full">
        <div
          className="h-full bg-primary/60 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  // ── Phase stepper — refined dots ──

  const PhaseStepper = () => (
    <div className="flex items-center justify-center gap-1.5 py-3 px-4">
      {PHASES.map((phase, index) => (
        <button
          key={phase}
          onClick={() => {
            if (index <= currentPhaseIndex) {
              setCurrentPhaseIndex(index);
              triggerHaptic(20);
            }
          }}
          disabled={index > currentPhaseIndex}
          className={cn(
            "transition-all duration-300 rounded-full",
            index === currentPhaseIndex
              ? "w-6 h-2 bg-primary"
              : index < currentPhaseIndex
                ? "w-2 h-2 bg-primary/40 cursor-pointer hover:bg-primary/60"
                : "w-2 h-2 bg-muted-foreground/15"
          )}
          aria-label={`${PHASE_LABELS[phase]}${index <= currentPhaseIndex ? ' (visited)' : ''}`}
        />
      ))}
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPLETION SCREEN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (isCompleted && script) {
    const overallScore = (scores.nose + scores.mouthfeel + scores.taste + scores.finish + scores.value) / 5;

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Thin gold accent */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto px-6 py-10 sm:py-14">

            {/* Animated check */}
            <div className="flex justify-center mb-8">
              <div className="rick-check-enter w-14 h-14 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center">
                <Check className="h-7 w-7 text-primary" strokeWidth={2.5} />
              </div>
            </div>

            {/* Whiskey name — editorial */}
            <div className="rick-fade-up rick-fade-up-1 text-center mb-10">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 font-medium mb-2">
                Review Complete
              </p>
              <h1 className="font-display text-2xl sm:text-3xl text-foreground tracking-tight leading-tight">
                {whiskey.name}
              </h1>
              {whiskey.distillery && (
                <p className="text-sm text-muted-foreground/50 mt-1 tracking-wide">{whiskey.distillery}</p>
              )}
            </div>

            {/* Score circles */}
            <div className="rick-fade-up rick-fade-up-2 mb-10">
              <div className="flex items-end justify-center gap-3 sm:gap-4">
                {SCORING_PHASES.map((phase) => {
                  const score = scores[phase as keyof ReviewScores] as number;
                  return (
                    <div key={phase} className="text-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-border/40 bg-card flex items-center justify-center mx-auto mb-1.5">
                        <span className="font-display text-xl sm:text-2xl font-bold text-foreground tabular-nums">{score}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 font-medium">{PHASE_LABELS[phase]}</p>
                    </div>
                  );
                })}
              </div>

              {/* Overall — prominent */}
              <div className="flex items-center justify-center mt-6 gap-3">
                <div className="h-px w-8 bg-primary/20" />
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-primary tabular-nums">
                    {overallScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground/40 uppercase tracking-wider">overall</span>
                </div>
                <div className="h-px w-8 bg-primary/20" />
              </div>
            </div>

            {/* Rick's quip */}
            {script.quip && (
              <div className="rick-fade-up rick-fade-up-3 text-center mb-10">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-px w-10 bg-border/40" />
                  <div className="h-1 w-1 rounded-full bg-primary/30" />
                  <div className="h-px w-10 bg-border/40" />
                </div>
                <p className="font-display text-lg text-foreground/70 leading-relaxed italic">
                  "{script.quip}"
                </p>
                <p className="text-xs text-primary/40 mt-2 tracking-wide">— Rick</p>
              </div>
            )}

            {/* Actions */}
            <div className="rick-fade-up rick-fade-up-4 space-y-3">
              <Button
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium tracking-wide"
                onClick={handleComplete}
              >
                <Check className="h-4 w-4 mr-2" />
                Save Review
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 text-muted-foreground/60 hover:text-muted-foreground"
                onClick={onClose}
              >
                Discard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LOADING STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (generateGuideMutation.isPending || !script) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          {/* Glencairn glass — same as TastingSession for brand consistency */}
          <svg
            width="48"
            height="48"
            viewBox="58 36 84 114"
            fill="none"
            className="text-primary animate-pulse mb-8"
          >
            <ellipse cx="100" cy="46" rx="14" ry="3.5" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M86 46 C86 46 83 58 81 66 C76 76 68 88 68 102 C68 118 82 130 100 130 C118 130 132 118 132 102 C132 88 124 76 119 66 C117 58 114 46 114 46" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            <path d="M72 100 Q100 106 128 100 C129 104 130 108 130 110 C130 116 118 127 100 127 C82 127 70 116 70 110 C70 108 71 104 72 100 Z" fill="currentColor" opacity="0.15" />
            <line x1="100" y1="130" x2="100" y2="140" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="100" cy="142" rx="18" ry="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
          </svg>
          <p className="font-display text-lg text-foreground/70 text-center transition-opacity duration-500">
            {LOADING_MESSAGES[loadingMsgIndex]}
          </p>
          <p className="text-sm text-muted-foreground/40 mt-2 tracking-wide">{whiskey.name}</p>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAIN SESSION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">

      {/* ── Header: clean, minimal ── */}
      <header className="shrink-0">
        {/* Progress line */}
        <ProgressBar />

        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-sm sm:text-base text-foreground truncate">
              {whiskey.name}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 font-medium">
              Review with Rick
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground/50 hover:text-foreground"
              onClick={toggleAudio}
              title={isAudioEnabled ? "Disable audio" : "Enable audio"}
            >
              {isAudioEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground/50 hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Phase dots */}
        <PhaseStepper />
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-6 pb-32">

          {/* Phase label + Rick's prompt */}
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/50 font-medium mb-1">
              {PHASE_LABELS[currentPhase]}
            </p>
            <p className="font-display text-lg sm:text-xl text-foreground/50 italic leading-relaxed">
              {PHASE_PROMPTS[currentPhase]}
            </p>
          </div>

          {/* Rick's guidance text */}
          <div className="mb-8">
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed whitespace-pre-line">
              {script[currentPhase]}
            </p>
          </div>

          {/* Audio Player (if enabled) */}
          {isAudioEnabled && (
            <div className="mb-8">
              <AudioPlayer
                audioBase64={phaseAudio[currentPhase]?.audio}
                contentType={phaseAudio[currentPhase]?.contentType || 'audio/mpeg'}
                isLoading={isLoadingAudio && !phaseAudio[currentPhase]}
                textOnly={phaseAudio[currentPhase]?.textOnly}
                error={phaseAudio[currentPhase]?.error}
                showSkipButtons={false}
                autoPlay={true}
              />
            </div>
          )}

          {/* ── Scoring ── */}
          {isCurrentScoringPhase && (
            <div className="pt-6 border-t border-border/20">
              <div className="text-center space-y-5">
                <p className="text-xs text-muted-foreground/50 uppercase tracking-[0.15em] font-medium">
                  Your rating
                </p>
                <ScoreInput
                  value={scores[currentPhase as keyof ReviewScores] as number}
                  onChange={(v) => handleScoreChange(currentPhase as keyof ReviewScores, v)}
                />
                {isCurrentScoringPhase && (scores[currentPhase as keyof Omit<ReviewScores, 'summary'>] as number) > 0 && (
                  <p className="font-display text-2xl text-primary tabular-nums">
                    {scores[currentPhase as keyof Omit<ReviewScores, 'summary'>] as number}
                    <span className="text-sm text-muted-foreground/30 ml-1">/ 5</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Summary textarea ── */}
          {isSummaryPhase && (
            <div className="pt-6 border-t border-border/20">
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground/50 uppercase tracking-[0.15em] font-medium">
                  Your thoughts <span className="normal-case tracking-normal text-muted-foreground/30">(optional)</span>
                </label>
                <Textarea
                  placeholder="What will you remember about this pour?"
                  value={scores.summary}
                  onChange={(e) => setScores(prev => ({ ...prev, summary: e.target.value }))}
                  className="min-h-[140px] resize-none bg-transparent border-border/30 focus:border-primary/30 text-foreground/80 placeholder:text-muted-foreground/25"
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Navigation Footer ── */}
      <footer className="shrink-0 bg-background border-t border-border/20 safe-area-bottom">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentPhaseIndex === 0}
            className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>

          <span className="text-[10px] text-muted-foreground/30 uppercase tracking-wider tabular-nums">
            {currentPhaseIndex + 1} / {PHASES.length}
          </span>

          <Button
            onClick={() => {
              handleNext();
              triggerHaptic(currentPhaseIndex === PHASES.length - 1 ? [50, 50, 50] : 30);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] px-6 font-medium tracking-wide"
          >
            {currentPhaseIndex === PHASES.length - 1 ? (
              <>
                Finish
                <Check className="h-4 w-4 ml-1.5" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default RickReviewSession;
