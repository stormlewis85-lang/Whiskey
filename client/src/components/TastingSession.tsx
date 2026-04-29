import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Whiskey } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, X, Mic, Volume2, VolumeX, PenLine, ArrowLeft, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import AudioPlayer from "./AudioPlayer";
import { RickAnalytics } from "@/lib/analytics";
import { TastingNoteCard } from "./rick/TastingNoteCard";

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

// Rick's voice for each phase transition
const PHASE_PROMPTS: Record<TastingPhase, string> = {
  visual: "Hold the glass up to the light.",
  nose: "Now bring it to your nose — gentle.",
  palate: "Take a small sip. Let it sit.",
  finish: "Swallow. Pay attention to what lingers.",
  ricksTake: "Here's what I think.",
};

interface TastingSessionProps {
  whiskey: Whiskey;
  mode: 'guided' | 'notes';
  resumeSessionId?: number;
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

// Loading state rotating messages
const LOADING_MESSAGES = [
  "Rick is reaching for the right words...",
  "Studying the label, gathering his thoughts...",
  "Forty-two years of experience, distilled into this moment...",
  "Opening the cellar...",
];

const TastingSession = ({ whiskey, mode, resumeSessionId, onClose, onComplete }: TastingSessionProps) => {
  const { toast } = useToast();
  const [session, setSession] = useState<TastingSessionData | null>(null);
  const [script, setScript] = useState<RickScript | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [phaseAudio, setPhaseAudio] = useState<Record<TastingPhase, PhaseAudio | null>>({
    visual: null,
    nose: null,
    palate: null,
    finish: null,
    ricksTake: null
  });
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const currentPhase = PHASES[currentPhaseIndex];

  // Rotate loading messages
  useEffect(() => {
    if (!script) {
      const interval = setInterval(() => {
        setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [script]);

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      if (resumeSessionId) {
        const response = await apiRequest("GET", `/api/rick/session/${resumeSessionId}`);
        return response.json();
      }
      const response = await apiRequest("POST", "/api/rick/start-session", {
        whiskeyId: whiskey.id,
        mode
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSession(data.session);
      setScript(data.script);
      if (!resumeSessionId) {
        RickAnalytics.sessionStarted(whiskey.id, whiskey.name, mode);
      }
    },
    onError: (error) => {
      toast({
        title: resumeSessionId ? "Failed to resume session" : "Failed to start session",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Load audio for current phase
  const loadPhaseAudio = async (phase: TastingPhase, text: string) => {
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

  // Load audio when phase changes
  useEffect(() => {
    if (script && isAudioEnabled) {
      loadPhaseAudio(currentPhase, script[currentPhase]);
      const nextPhaseIndex = PHASES.indexOf(currentPhase) + 1;
      if (nextPhaseIndex < PHASES.length) {
        const nextPhase = PHASES[nextPhaseIndex];
        setTimeout(() => {
          if (script[nextPhase]) {
            loadPhaseAudio(nextPhase, script[nextPhase]);
          }
        }, 1000);
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
      setIsCompleted(true);
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

  // Haptic feedback
  const triggerHaptic = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleNext = () => {
    if (currentPhaseIndex < PHASES.length - 1) {
      triggerHaptic(30);
      const nextPhaseIndex = currentPhaseIndex + 1;
      setCurrentPhaseIndex(nextPhaseIndex);
      RickAnalytics.phaseAdvanced(whiskey.id, PHASES[nextPhaseIndex], nextPhaseIndex);
    } else {
      triggerHaptic([50, 50, 50]);
      completeSessionMutation.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentPhaseIndex > 0) {
      triggerHaptic(20);
      setCurrentPhaseIndex(prev => prev - 1);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
  };

  const handleCloseAttempt = () => {
    if (session && !isCompleted) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const todayDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // ── COMPLETION SCREEN ──
  if (isCompleted && script) {
    return (
      <div className="fixed inset-0 z-[60] bg-background overflow-y-auto">
        <div className="flex flex-col items-center min-h-screen px-5 py-10">
          <div className="max-w-md w-full space-y-8">

            {/* Animated check */}
            <div className="flex justify-center">
              <div className="rick-check-enter w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Rick's closing words — hero element */}
            <div className="rick-fade-up rick-fade-up-1 text-center space-y-2">
              {script.quip ? (
                <p className="font-display text-xl text-foreground/90 leading-relaxed italic">
                  "{script.quip}"
                </p>
              ) : (
                <p className="font-display text-xl text-foreground/90">
                  Well poured, well tasted.
                </p>
              )}
              <p className="text-primary/60 text-sm">— Rick</p>
            </div>

            {/* Shareable Tasting Note Card */}
            <div className="rick-fade-up rick-fade-up-2">
              <TastingNoteCard
                whiskeyName={whiskey.name}
                distillery={whiskey.distillery}
                rating={whiskey.rating || 0}
                ricksSummary={script.ricksTake}
                quip={script.quip}
                date={todayDate}
                mode={mode}
              />
            </div>

            {/* Actions */}
            <div className="rick-fade-up rick-fade-up-3 space-y-3">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-border/50"
                  onClick={onClose}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={onComplete}
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  Write Review
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── LOADING STATE ──
  if (startSessionMutation.isPending || !script) {
    return (
      <div className="fixed inset-0 z-[60] bg-background">
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          {/* Glencairn glass as loading anchor */}
          <svg
            width="56"
            height="56"
            viewBox="58 36 84 114"
            fill="none"
            className="text-primary animate-pulse mb-6"
          >
            <ellipse cx="100" cy="46" rx="14" ry="3.5" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M86 46 C86 46 83 58 81 66 C76 76 68 88 68 102 C68 118 82 130 100 130 C118 130 132 118 132 102 C132 88 124 76 119 66 C117 58 114 46 114 46" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            <path d="M72 100 Q100 106 128 100 C129 104 130 108 130 110 C130 116 118 127 100 127 C82 127 70 116 70 110 C70 108 71 104 72 100 Z" fill="currentColor" opacity="0.15" />
            <line x1="100" y1="130" x2="100" y2="140" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="100" cy="142" rx="18" ry="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
          </svg>
          <p className="font-display text-lg text-foreground/80 text-center transition-opacity duration-500">
            {LOADING_MESSAGES[loadingMsgIndex]}
          </p>
          <p className="text-muted-foreground text-sm mt-2">{whiskey.name}</p>
        </div>
      </div>
    );
  }

  // ── MAIN SESSION ──
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-background flex flex-col">
        {/* Header */}
        <header className="shrink-0 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white border-b border-amber-800/30">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic className="h-5 w-5 text-amber-400" />
              <div>
                <h1 className="font-semibold text-amber-50">{whiskey.name}</h1>
                <p className="text-xs text-amber-200/70">
                  {mode === 'guided' ? 'Guided Tasting with Rick' : 'Quick Notes'}
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
                onClick={handleCloseAttempt}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Phase Progress — visible on ALL screen sizes */}
          {mode === 'guided' && (
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
                      {/* Phase labels — now visible on mobile too */}
                      <span
                        className={cn(
                          "text-[9px] sm:text-[10px] mt-1",
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
                          "w-6 sm:w-12 h-0.5 mx-0.5 sm:mx-1",
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
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 max-w-2xl pb-24 sm:pb-6">
          {mode === 'notes' ? (
            /* Just Notes View */
            <div className="space-y-6">
              <Card className="border-border/50 shadow-warm-lg">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Quick Tasting Notes</h2>
                    {script.quip && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 italic">
                        "{script.quip}"
                      </p>
                    )}
                  </div>

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
            /* Guided View — phase by phase */
            <>
              <Card className="border-border/50 shadow-warm-lg">
                <CardContent className="p-6">
                  {/* Rick's phase prompt — his voice guiding you */}
                  <p className="text-primary/70 text-sm italic mb-4">
                    {PHASE_PROMPTS[currentPhase]}
                  </p>

                  {/* Phase Title */}
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    {PHASE_LABELS[currentPhase]}
                  </h2>

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
                      onEnded={() => {}}
                      onSkipBack={currentPhaseIndex > 0 ? handlePrevious : undefined}
                      onSkipForward={currentPhaseIndex < PHASES.length - 1 ? handleNext : undefined}
                      showSkipButtons={true}
                      autoPlay={true}
                      className="mt-6"
                    />
                  )}
                </CardContent>
              </Card>
            </>
          )}
          </div>
        </main>

        {/* Navigation Footer — guided mode */}
        {mode === 'guided' && (
          <footer className="shrink-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4 sm:p-6">
            <div className="container mx-auto max-w-2xl flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentPhaseIndex === 0}
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                {currentPhaseIndex + 1} of {PHASES.length}
              </span>

              <Button
                onClick={handleNext}
                className="bg-amber-600 hover:bg-amber-700 text-white flex-1 sm:flex-none min-h-[44px]"
                disabled={completeSessionMutation.isPending}
              >
                {completeSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : currentPhaseIndex === PHASES.length - 1 ? (
                  "Complete"
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </footer>
        )}
      </div>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Leave the tasting?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You can pick up where you left off later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">Stay</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onClose}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TastingSession;
