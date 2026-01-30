import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Whiskey } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, X, Mic, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

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

const TastingSession = ({ whiskey, mode, onClose, onComplete }: TastingSessionProps) => {
  const { toast } = useToast();
  const [session, setSession] = useState<TastingSessionData | null>(null);
  const [script, setScript] = useState<RickScript | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

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
    },
    onError: (error) => {
      toast({
        title: "Failed to start session",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

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
      toast({
        title: "Tasting Complete",
        description: "Great job! Ready to write your review?"
      });
      onComplete();
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

  const handleNext = () => {
    if (currentPhaseIndex < PHASES.length - 1) {
      setCurrentPhaseIndex(prev => prev + 1);
    } else {
      // Last phase - complete session
      completeSessionMutation.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentPhaseIndex > 0) {
      setCurrentPhaseIndex(prev => prev - 1);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
  };

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

        {/* Phase Progress Indicator */}
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
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

            {/* Audio Player Placeholder - R034 */}
            {isAudioEnabled && (
              <div className="mt-6 p-4 bg-accent/30 rounded-lg border border-border/30">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mic className="h-5 w-5 text-amber-500" />
                  <span className="text-sm">Audio playback coming soon...</span>
                </div>
              </div>
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
      </main>
    </div>
  );
};

export default TastingSession;
