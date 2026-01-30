import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Whiskey } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, X, Mic, Volume2, VolumeX, CheckCircle, PenLine, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import AudioPlayer from "./AudioPlayer";
import { RickAnalytics } from "@/lib/analytics";

// Rick Script interface matching the backend
interface RickScript {
  visual: string;
  nose: string;
  palate: string;
  finish: string;
  ricksTake: string;
  quip: string;
  metadata?: {
    whiskeyId: number;
    whiskeyName: string;
    mode: 'guided' | 'notes';
    generatedAt: string;
    personalized: boolean;
    communityReviewCount: number;
  };
}

// Session from API
interface TastingSessionData {
  id: number;
  whiskeyId: number;
  mode: 'guided' | 'notes';
  startedAt: string;
  completedAt: string | null;
}

// Phase type
type TastingPhase = 'visual' | 'nose' | 'palate' | 'finish' | 'ricksTake';

const PHASES: TastingPhase[] = ['visual', 'nose', 'palate', 'finish', 'ricksTake'];
const PHASE_LABELS: Record<TastingPhase, string> = {
  visual: 'Visual',
  nose: 'Nose',
  palate: 'Palate',
  finish: 'Finish',
  ricksTake: "Rick's Take"
};

interface TastingSessionProps {
  whiskey: Whiskey;
  mode: 'guided' | 'notes';
  onClose: () => void;
  onComplete: () => void;
}

// Audio data for a phase
interface PhaseAudio {
  audio: string | null;
  contentType: string | null;
  textOnly: boolean;
  error?: string;
}

const TastingSession = ({ whiskey, mode, onClose, onComplete }: TastingSessionProps) => {
  const { toast } = useToast();
  const [session, setSession] = useState<TastingSessionData | null>(null);
  const [script, setScript] = useState<RickScript | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [phaseAudio, setPhaseAudio] = useState<Record<TastingPhase, PhaseAudio | null>>({
    visual: null,
    nose: null,
    palate: null,
    finish: null,
    ricksTake: null
  });
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const currentPhase = PHASES[currentPhaseIndex];

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rick/start-session", {
        whiskeyId: whiskey.id,
        mode
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSession(data.session);
      setScript(data.script);
      // Track session started
      RickAnalytics.sessionStarted(whiskey.id, whiskey.name, mode);
    },
    onError: (error) => {
      toast({
        title: "Failed to start session",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Load audio for current phase
  const loadPhaseAudio = async (phase: TastingPhase, text: string) => {
    if (!isAudioEnabled) return;
    if (phaseAudio[phase]) return; // Already loaded

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

  // Load audio when phase changes or script loads
  useEffect(() => {
    if (script && isAudioEnabled) {
      loadPhaseAudio(currentPhase, script[currentPhase]);

      // Preload next phase audio for smoother transitions
      const nextPhaseIndex = PHASES.indexOf(currentPhase) + 1;
      if (nextPhaseIndex < PHASES.length) {
        const nextPhase = PHASES[nextPhaseIndex];
        // Load next phase audio in background (non-blocking)
        setTimeout(() => {
          if (script[nextPhase]) {
            loadPhaseAudio(nextPhase, script[nextPhase]);
          }
        }, 1000); // Delay to not compete with current phase load
      }
    }
  }, [currentPhase, script, isAudioEnabled]);

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!session) return;
      const response = await apiRequest("POST", "/api/rick/complete-session", {
        sessionId: session.id
      });
      return response.json();
    },
    onSuccess: () => {
      // Show completion screen instead of immediately navigating away
      setIsCompleted(true);
      // Track session completed (duration would require tracking start time)
      RickAnalytics.sessionCompleted(whiskey.id, whiskey.name, mode, 0);
    },
    onError: (error) => {
      toast({
        title: "Failed to complete session",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Start session on mount
  useEffect(() => {
    startSessionMutation.mutate();
  }, []);

  // Haptic feedback for mobile
  const triggerHaptic = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleNext = () => {
    if (currentPhaseIndex < PHASES.length - 1) {
      triggerHaptic(30); // Short vibration for phase transition
      const nextPhaseIndex = currentPhaseIndex + 1;
      setCurrentPhaseIndex(nextPhaseIndex);
      // Track phase advancement
      RickAnalytics.phaseAdvanced(whiskey.id, PHASES[nextPhaseIndex], nextPhaseIndex);
    } else {
      // Last phase - complete session
      triggerHaptic([50, 50, 50]); // Longer pattern for completion
      completeSessionMutation.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentPhaseIndex > 0) {
      triggerHaptic(20); // Light vibration for going back
      setCurrentPhaseIndex(prev => prev - 1);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
  };

  // Completion screen
  if (isCompleted && script) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="max-w-lg w-full">
            <Card className="border-border/50 shadow-warm-lg">
              <CardContent className="p-8 text-center space-y-6">
                {/* Success Icon */}
                <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-amber-500" />
                </div>

                {/* Title & Whiskey */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Tasting Complete!</h2>
                  <p className="text-muted-foreground">{whiskey.name}</p>
                </div>

                {/* Rick's Closing Quip */}
                {script.quip && (
                  <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <p className="text-amber-700 dark:text-amber-400 italic">
                      "{script.quip}"
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">— Rick House</p>
                  </div>
                )}

                {/* Summary */}
                <div className="text-left space-y-3 border-t border-border/50 pt-4">
                  <h3 className="font-semibold text-foreground">Rick's Take</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {script.ricksTake}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Collection
                  </Button>
                  <Button
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={onComplete}
                  >
                    <PenLine className="h-4 w-4 mr-2" />
                    Write Your Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (startSessionMutation.isPending || !script) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center space-y-4">
            <div className="relative">
              <Mic className="h-16 w-16 text-amber-500 animate-pulse mx-auto" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Rick is preparing your tasting...
              </h2>
              <p className="text-muted-foreground">
                {whiskey.name}
              </p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white border-b border-amber-800/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mic className="h-5 w-5 text-amber-400" />
            <div>
              <h1 className="font-semibold text-amber-50">{whiskey.name}</h1>
              <p className="text-xs text-amber-200/70">
                {mode === 'guided' ? 'Guided Tasting' : 'Quick Notes'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-amber-200 hover:text-white hover:bg-amber-700/40"
              onClick={toggleAudio}
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

        {/* Phase Progress Indicator - Only show in guided mode */}
        {mode === 'guided' && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between max-w-xl mx-auto">
              {PHASES.map((phase, index) => (
                <div
                  key={phase}
                  className="flex items-center"
                >
                  <div
                    className={cn(
                      "flex flex-col items-center cursor-pointer transition-all",
                      index <= currentPhaseIndex ? "opacity-100" : "opacity-50"
                    )}
                    onClick={() => index <= currentPhaseIndex && setCurrentPhaseIndex(index)}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                        index === currentPhaseIndex
                          ? "bg-amber-500 text-white scale-110"
                          : index < currentPhaseIndex
                            ? "bg-amber-600/60 text-white"
                            : "bg-amber-900/50 text-amber-300/50"
                      )}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] mt-1 hidden sm:block",
                        index === currentPhaseIndex
                          ? "text-amber-200"
                          : "text-amber-400/50"
                      )}
                    >
                      {PHASE_LABELS[phase]}
                    </span>
                  </div>
                  {index < PHASES.length - 1 && (
                    <div
                      className={cn(
                        "w-8 sm:w-12 h-0.5 mx-1",
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
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {mode === 'notes' ? (
          /* Just Notes View - All sections at once */
          <div className="space-y-6">
            <Card className="border-border/50 shadow-warm-lg">
              <CardContent className="p-6 space-y-6">
                {/* Quick Notes Header */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Quick Tasting Notes</h2>
                  {script.quip && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 italic">
                      "{script.quip}"
                    </p>
                  )}
                </div>

                {/* All Sections */}
                {PHASES.map((phase) => (
                  <div key={phase} className="border-b border-border/30 pb-4 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-foreground text-lg mb-2">
                      {PHASE_LABELS[phase]}
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {script[phase]}
                    </p>
                  </div>
                ))}

                {/* Single Audio Player for full script */}
                {isAudioEnabled && (
                  <AudioPlayer
                    audioBase64={phaseAudio.visual?.audio}
                    contentType={phaseAudio.visual?.contentType || 'audio/mpeg'}
                    isLoading={isLoadingAudio}
                    textOnly={phaseAudio.visual?.textOnly}
                    error={phaseAudio.visual?.error}
                    showSkipButtons={false}
                    autoPlay={false}
                    className="mt-4"
                  />
                )}
              </CardContent>
            </Card>

            {/* Complete Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => completeSessionMutation.mutate()}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8"
                disabled={completeSessionMutation.isPending}
              >
                {completeSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  "Complete Tasting"
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Guided View - Phase by phase */
          <>
            <Card className="border-border/50 shadow-warm-lg">
              <CardContent className="p-6">
                {/* Phase Title */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    {PHASE_LABELS[currentPhase]}
                  </h2>
                  {script.quip && currentPhaseIndex === PHASES.length - 1 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 italic mt-1">
                      "{script.quip}"
                    </p>
                  )}
                </div>

                {/* Script Content */}
                <div className="prose prose-amber dark:prose-invert max-w-none">
                  <p className="text-lg text-foreground leading-relaxed whitespace-pre-line">
                    {script[currentPhase]}
                  </p>
                </div>

                {/* Audio Player */}
                {isAudioEnabled && (
                  <AudioPlayer
                    audioBase64={phaseAudio[currentPhase]?.audio}
                    contentType={phaseAudio[currentPhase]?.contentType || 'audio/mpeg'}
                    isLoading={isLoadingAudio && !phaseAudio[currentPhase]}
                    textOnly={phaseAudio[currentPhase]?.textOnly}
                    error={phaseAudio[currentPhase]?.error}
                    onEnded={() => {
                      // Optionally auto-advance after audio ends
                    }}
                    onSkipBack={currentPhaseIndex > 0 ? handlePrevious : undefined}
                    onSkipForward={currentPhaseIndex < PHASES.length - 1 ? handleNext : undefined}
                    showSkipButtons={true}
                    autoPlay={true}
                    className="mt-6"
                  />
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentPhaseIndex === 0}
              >
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                {currentPhaseIndex + 1} of {PHASES.length}
              </span>

              <Button
                onClick={handleNext}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={completeSessionMutation.isPending}
              >
                {completeSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : currentPhaseIndex === PHASES.length - 1 ? (
                  "Complete Tasting"
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TastingSession;
