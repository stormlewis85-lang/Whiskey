import { useState, useEffect } from "react";
import { formatWhiskeyName } from "@/lib/utils/formatName";
import { useMutation } from "@tanstack/react-query";
import { Whiskey } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X, Mic, Volume2, VolumeX, CheckCircle, Star, ArrowLeft } from "lucide-react";
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

const RickReviewSession = ({ whiskey, onClose, onComplete }: RickReviewSessionProps) => {
  const { toast } = useToast();
  const [script, setScript] = useState<RickReviewScript | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false); // Audio optional, off by default
  const [isCompleted, setIsCompleted] = useState(false);
  const [phaseAudio, setPhaseAudio] = useState<Record<ReviewPhase, PhaseAudio | null>>({
    intro: null,
    visual: null,
    nose: null,
    mouthfeel: null,
    taste: null,
    finish: null,
    value: null,
    closing: null
  });
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Review scores state
  const [scores, setScores] = useState<ReviewScores>({
    nose: 0,
    mouthfeel: 0,
    taste: 0,
    finish: 0,
    value: 0,
    summary: ''
  });

  const currentPhase = PHASES[currentPhaseIndex];
  const isCurrentScoringPhase = SCORING_PHASES.includes(currentPhase);
  const isSummaryPhase = currentPhase === 'closing';

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
      console.error('Failed to load audio:', error);
      setPhaseAudio(prev => ({
        ...prev,
        [phase]: {
          audio: null,
          contentType: null,
          textOnly: true,
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
    // Check if current phase requires a score
    if (isCurrentScoringPhase && scores[currentPhase as keyof ReviewScores] === 0) {
      toast({
        title: "Score Required",
        description: `Please rate the ${PHASE_LABELS[currentPhase]} before continuing.`,
        variant: "destructive"
      });
      return;
    }

    if (currentPhaseIndex < PHASES.length - 1) {
      setCurrentPhaseIndex(prev => prev + 1);
    } else {
      // Complete the review
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

  // Star Rating Component
  const StarRating = ({ value, onChange, size = "lg" }: { value: number; onChange: (v: number) => void; size?: "sm" | "lg" }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
        >
          <Star
            className={cn(
              "transition-all",
              size === "lg" ? "h-10 w-10" : "h-6 w-6",
              star <= value
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground/30 hover:text-amber-300"
            )}
          />
        </button>
      ))}
    </div>
  );

  // Completion screen
  if (isCompleted && script) {
    const overallScore = (scores.nose + scores.mouthfeel + scores.taste + scores.finish + scores.value) / 5;

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="shrink-0 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white border-b border-amber-800/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic className="h-5 w-5 text-amber-400" />
              <h1 className="font-semibold text-amber-50">Review Complete</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-lg mx-auto">
            <Card className="border-border/50 shadow-warm-lg">
              <CardContent className="p-6 sm:p-8 text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-amber-500" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Great Work!</h2>
                  <p className="text-muted-foreground">{formatWhiskeyName(whiskey.name)}</p>
                </div>

                {/* Score Summary */}
                <div className="text-left space-y-3 border-t border-border/50 pt-4">
                  <h3 className="font-semibold text-foreground text-center">Your Scores</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {SCORING_PHASES.map(phase => (
                      <div key={phase} className="flex justify-between p-2 bg-accent/30 rounded">
                        <span className="text-muted-foreground">{PHASE_LABELS[phase]}</span>
                        <span className="font-bold text-foreground">{scores[phase as keyof ReviewScores]}/5</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <span className="font-semibold text-amber-700 dark:text-amber-400">Overall</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{overallScore.toFixed(1)}/5</span>
                  </div>
                </div>

                {/* Quip */}
                {script.quip && (
                  <div className="p-4 bg-accent/30 rounded-lg">
                    <p className="text-muted-foreground italic">"{script.quip}"</p>
                    <p className="text-sm text-muted-foreground mt-2">— Rick House</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleComplete}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Loading state
  if (generateGuideMutation.isPending || !script) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center space-y-4">
            <Mic className="h-16 w-16 text-amber-500 animate-pulse mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Rick is preparing your review guide...
              </h2>
              <p className="text-muted-foreground">{formatWhiskeyName(whiskey.name)}</p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="shrink-0 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white border-b border-amber-800/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mic className="h-5 w-5 text-amber-400" />
            <div>
              <h1 className="font-semibold text-amber-50 text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                {formatWhiskeyName(whiskey.name)}
              </h1>
              <p className="text-xs text-amber-200/70">Review with Rick</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-amber-200 hover:text-white hover:bg-amber-700/40"
              onClick={toggleAudio}
              title={isAudioEnabled ? "Disable audio" : "Enable audio"}
            >
              {isAudioEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-amber-200 hover:text-white hover:bg-amber-700/40"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {PHASES.map((phase, index) => (
              <div key={phase} className="flex items-center">
                <div
                  className={cn(
                    "flex flex-col items-center cursor-pointer transition-all",
                    index <= currentPhaseIndex ? "opacity-100" : "opacity-50"
                  )}
                  onClick={() => index <= currentPhaseIndex && setCurrentPhaseIndex(index)}
                >
                  <div
                    className={cn(
                      "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium transition-all",
                      index === currentPhaseIndex
                        ? "bg-amber-500 text-white scale-110"
                        : index < currentPhaseIndex
                          ? "bg-amber-600/60 text-white"
                          : "bg-amber-900/50 text-amber-300/50"
                    )}
                  >
                    {index + 1}
                  </div>
                </div>
                {index < PHASES.length - 1 && (
                  <div
                    className={cn(
                      "w-3 sm:w-6 h-0.5 mx-0.5 sm:mx-1",
                      index < currentPhaseIndex
                        ? "bg-amber-500/60"
                        : "bg-amber-900/50"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-2xl pb-32">
          <Card className="border-border/50 shadow-warm-lg">
            <CardContent className="p-4 sm:p-6">
              {/* Phase Title */}
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {PHASE_LABELS[currentPhase]}
                </h2>
              </div>

              {/* Rick's Guidance */}
              <div className="prose prose-amber dark:prose-invert max-w-none mb-6">
                <p className="text-base sm:text-lg text-foreground leading-relaxed whitespace-pre-line">
                  {script[currentPhase]}
                </p>
              </div>

              {/* Audio Player (if enabled) */}
              {isAudioEnabled && (
                <AudioPlayer
                  audioBase64={phaseAudio[currentPhase]?.audio}
                  contentType={phaseAudio[currentPhase]?.contentType || 'audio/mpeg'}
                  isLoading={isLoadingAudio && !phaseAudio[currentPhase]}
                  textOnly={phaseAudio[currentPhase]?.textOnly}
                  error={phaseAudio[currentPhase]?.error}
                  showSkipButtons={false}
                  autoPlay={true}
                  className="mb-6"
                />
              )}

              {/* Scoring Input (for scoring phases) */}
              {isCurrentScoringPhase && (
                <div className="border-t border-border/50 pt-6">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Rate the {PHASE_LABELS[currentPhase].toLowerCase()}
                    </p>
                    <StarRating
                      value={scores[currentPhase as keyof ReviewScores] as number}
                      onChange={(v) => handleScoreChange(currentPhase as keyof ReviewScores, v)}
                    />
                    {scores[currentPhase as keyof ReviewScores] > 0 && (
                      <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                        {scores[currentPhase as keyof ReviewScores]} / 5
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Summary Input (for closing phase) */}
              {isSummaryPhase && (
                <div className="border-t border-border/50 pt-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      Your Summary (optional)
                    </label>
                    <Textarea
                      placeholder="Capture your overall thoughts about this whiskey..."
                      value={scores.summary}
                      onChange={(e) => setScores(prev => ({ ...prev, summary: e.target.value }))}
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Fixed Navigation Footer */}
      <footer className="shrink-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4">
        <div className="container mx-auto max-w-2xl flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentPhaseIndex === 0}
            className="flex-1 sm:flex-none"
          >
            Previous
          </Button>

          <span className="text-sm text-muted-foreground hidden sm:block">
            {currentPhaseIndex + 1} of {PHASES.length}
          </span>

          <Button
            onClick={handleNext}
            className="bg-amber-600 hover:bg-amber-700 text-white flex-1 sm:flex-none"
          >
            {currentPhaseIndex === PHASES.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default RickReviewSession;
