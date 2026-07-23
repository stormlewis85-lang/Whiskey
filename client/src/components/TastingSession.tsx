import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Whiskey, ReviewNote } from "@shared/schema";
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
import { Loader2, Share2, Play, Pause, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import AudioPlayer from "./AudioPlayer";
import { RickAnalytics } from "@/lib/analytics";
import TastingCompletion from "./rick/TastingCompletion";

// A single Ask Rick question/answer exchange, scoped to one phase
interface AskExchange {
  question: string;
  answer: string;
  handBack: string;
  at: string;
}

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
  // Persisted Ask Rick exchanges, keyed by phase — hydrated on resume
  exchanges?: Record<string, AskExchange[]>;
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

// Ask Rick — 2 static contextual prompt chips per phase (client-side, kept simple)
const ASK_RICK_CHIPS: Record<TastingPhase, [string, string]> = {
  visual: ["What do the legs actually tell me?", "Why does color matter?"],
  nose: ["What am I smelling if it's sharper than caramel?", "How do I nose without burning out?"],
  palate: ["Where should I feel this on my tongue?", "What's the mashbill doing here?"],
  finish: ["Is a long finish always better?", "What's the oak doing at the end?"],
  ricksTake: ["Compare it to something I'd know", "Is this worth the price?"],
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

// ── 1c minimal audio player ──
// Session-screen player: 36px outline play/pause, 2px hairline progress,
// "m:ss / m:ss" time. No gold, no skip controls (phases advance forward-only
// via the Continue CTA, not by scrubbing audio).
interface MinimalAudioPlayerProps {
  audioBase64?: string | null;
  contentType?: string;
  isLoading?: boolean;
  textOnly?: boolean;
  error?: string;
  autoPlay?: boolean;
  className?: string;
}

const MinimalAudioPlayer = ({
  audioBase64,
  contentType = "audio/mpeg",
  isLoading = false,
  textOnly = false,
  error,
  autoPlay = false,
  className,
}: MinimalAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioSrc = audioBase64 ? `data:${contentType};base64,${audioBase64}` : null;

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioSrc]);

  useEffect(() => {
    if (autoPlay && audioSrc && audioRef.current && !isLoading && !textOnly) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    }
  }, [audioSrc, autoPlay, isLoading, textOnly]);

  const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-[12px]", className)} style={{ color: "#8A8072" }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading audio...
      </div>
    );
  }

  if (textOnly || !audioSrc) {
    return (
      <div className={cn("text-[12px]", className)} style={{ color: "#7A7060" }}>
        {error || "Audio unavailable — read along with Rick."}
      </div>
    );
  }

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <audio
        ref={audioRef}
        src={audioSrc}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />
      <button
        type="button"
        onClick={handlePlayPause}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full border"
        style={{ borderColor: "rgba(237,232,224,0.25)" }}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" style={{ color: "#EDE8E0" }} fill="currentColor" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" style={{ color: "#EDE8E0" }} fill="currentColor" />
        )}
      </button>
      <div
        className="flex-1 h-[2px] rounded-full overflow-hidden"
        style={{ backgroundColor: "rgba(237,232,224,0.14)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress * 100}%`, backgroundColor: "#B5AC9F" }}
        />
      </div>
      <span className="shrink-0 text-[12px] tabular-nums" style={{ color: "#8A8072" }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
};

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

  // ── ASK RICK — exchanges by phase, hydrated from scriptJson on load/resume ──
  const [exchangesByPhase, setExchangesByPhase] = useState<Record<string, AskExchange[]>>({});
  const [askInput, setAskInput] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<{ phase: TastingPhase; question: string } | null>(null);

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
      // Resume: rehydrate any Ask Rick exchanges already persisted for this session
      setExchangesByPhase(data.script?.exchanges || {});
      // Resuming a session that's already completed — render the existing
      // completion view instead of replaying phase 1.
      if (data.session?.completedAt) {
        setIsCompleted(true);
      }
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

  // Load audio when phase changes — skip entirely when viewing a completed
  // session's record view (no phase audio should ever fetch/play there).
  useEffect(() => {
    if (script && isAudioEnabled && !isCompleted) {
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
  }, [currentPhase, script, isAudioEnabled, isCompleted]);

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

  // Ask Rick a question mid-phase — depth is bounded, never blocks Continue
  const askRickMutation = useMutation({
    mutationFn: async (vars: { phase: TastingPhase; question: string }) => {
      if (!session) throw new Error("No active session");
      const response = await apiRequest("POST", "/api/rick/ask", {
        sessionId: session.id,
        phase: vars.phase,
        question: vars.question,
      });
      return response.json();
    },
    onSuccess: (data, vars) => {
      const newExchange: AskExchange = {
        question: vars.question,
        answer: data.answer,
        handBack: data.handBack,
        at: new Date().toISOString(),
      };
      setExchangesByPhase((prev) => ({
        ...prev,
        [vars.phase]: [...(prev[vars.phase] || []), newExchange],
      }));
      setPendingQuestion(null);
    },
    onError: (error, vars) => {
      setPendingQuestion(null);
      // Keep the question in the input so they don't have to retype it
      if (vars.phase === currentPhase) {
        setAskInput(vars.question);
      }
      toast({
        title: "Rick didn't catch that",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const submitAskRick = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || askRickMutation.isPending) return;
    setPendingQuestion({ phase: currentPhase, question: trimmed });
    setAskInput("");
    askRickMutation.mutate({ phase: currentPhase, question: trimmed });
  };

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

  const handleCloseAttempt = () => {
    if (session && !isCompleted) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  // ── COMPLETION SCREEN (1d) — completion → re-score → seeded review bridge ──
  if (isCompleted && script) {
    // Most recent review for this whiskey, if one exists (whiskey.notes is
    // jsonb — same cast pattern RickHouse.tsx uses at its call sites).
    const notes = Array.isArray(whiskey.notes) ? (whiskey.notes as unknown as ReviewNote[]) : [];
    const existingReview = notes.length > 0 ? notes[notes.length - 1] : undefined;

    const sessionDate = new Date(session?.completedAt || session?.startedAt || Date.now()).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return (
      <TastingCompletion
        whiskey={whiskey}
        script={script}
        sessionDate={sessionDate}
        existingReview={existingReview}
        onClose={onClose}
        onSaved={onComplete}
      />
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
        <header
          className="shrink-0"
          style={{ background: "linear-gradient(180deg, #100E0B 0%, #050505 100%)" }}
        >
          <div className="container mx-auto px-4 sm:px-6 pt-4 pb-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleCloseAttempt}
                className="text-[13px] transition-colors hover:opacity-80"
                style={{ color: "#A69C8D" }}
              >
                ← Step out
              </button>
              <span
                className="font-display text-[12px] uppercase tracking-[0.24em]"
                style={{ color: "#7A7060" }}
              >
                RICK HOUSE
              </span>
            </div>

            <div className="mt-3">
              <h1 className="font-heading text-[26px] font-normal leading-tight" style={{ color: "#EDE8E0" }}>
                {whiskey.name}
              </h1>
              {(whiskey.type || whiskey.proof) && (
                <p className="mt-0.5 text-[13px]" style={{ color: "#A69C8D" }}>
                  {[whiskey.type, whiskey.proof ? `${whiskey.proof} proof` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </div>

          {/* 1c text stepper — phase name + "N of 5" + hairline progress */}
          {mode === 'guided' && (
            <div className="px-4 sm:px-6 pb-4">
              <div className="max-w-xl mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold" style={{ color: "#EDE8E0" }}>
                    {PHASE_LABELS[currentPhase]}
                  </span>
                  <span className="text-[12px]" style={{ color: "#8A8072" }}>
                    {currentPhaseIndex + 1} of {PHASES.length}
                  </span>
                </div>
                <div
                  className="mt-2 h-[2px] w-full rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(237,232,224,0.12)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentPhaseIndex + 1) / PHASES.length) * 100}%`,
                      backgroundColor: "#B5AC9F",
                    }}
                  />
                </div>
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
            /* Guided View — phase by phase (1c) */
            <>
              <div
                className="rounded-[14px] border p-5"
                style={{ backgroundColor: "#0D0C0A", borderColor: "rgba(237,232,224,0.08)" }}
              >
                {/* Stage direction — Rick's phase prompt (italic, NOT gold) */}
                <p className="text-[13px] italic mb-3" style={{ color: "#C9C1B4" }}>
                  {PHASE_PROMPTS[currentPhase]}
                </p>

                {/* Rick's prose, in quotes */}
                <p
                  className="text-[15px] leading-[1.6] whitespace-pre-line"
                  style={{ color: "#D8D1C6" }}
                >
                  "{script[currentPhase]}"
                </p>

                {/* Minimal audio player */}
                {isAudioEnabled && (
                  <MinimalAudioPlayer
                    audioBase64={phaseAudio[currentPhase]?.audio}
                    contentType={phaseAudio[currentPhase]?.contentType || 'audio/mpeg'}
                    isLoading={isLoadingAudio && !phaseAudio[currentPhase]}
                    textOnly={phaseAudio[currentPhase]?.textOnly}
                    error={phaseAudio[currentPhase]?.error}
                    autoPlay={true}
                    className="mt-5"
                  />
                )}
              </div>

              {/* ASK RICK — optional in-session depth path (1c). Guided mode only;
                  hidden on completed/record views since this whole branch already
                  returns via TastingCompletion once isCompleted is true. */}
              <div className="mt-5">
                <p
                  className="text-[12px] font-semibold uppercase"
                  style={{ color: "#8A8072", letterSpacing: "0.12em" }}
                >
                  Ask Rick — optional
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {ASK_RICK_CHIPS[currentPhase].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => submitAskRick(chip)}
                      disabled={askRickMutation.isPending}
                      className="rounded-full border px-[14px] py-[9px] text-[13px] text-left transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ borderColor: "rgba(237,232,224,0.16)", color: "#D8D1C6" }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Exchange history for this phase — chronological, persists across phase nav */}
                {(exchangesByPhase[currentPhase] || []).map((exchange, i) => (
                  <div key={`${currentPhase}-${i}`} className="mt-4">
                    <div className="flex justify-end">
                      <div
                        className="max-w-[280px] px-[15px] py-[11px] text-[14px]"
                        style={{
                          backgroundColor: "#1B1712",
                          color: "#EDE8E0",
                          borderTopLeftRadius: 14,
                          borderTopRightRadius: 14,
                          borderBottomRightRadius: 4,
                          borderBottomLeftRadius: 14,
                        }}
                      >
                        {exchange.question}
                      </div>
                    </div>
                    <div className="mt-2">
                      <p
                        className="text-[12px] font-semibold"
                        style={{ color: "#8A8072", letterSpacing: "0.12em" }}
                      >
                        RICK
                      </p>
                      <p
                        className="mt-1 text-[15px] leading-[1.65] whitespace-pre-line"
                        style={{ color: "#D8D1C6" }}
                      >
                        {exchange.answer}
                      </p>
                      <p className="mt-1.5 text-[13px] italic" style={{ color: "#C9C1B4" }}>
                        {exchange.handBack}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Pending exchange — user bubble shows immediately; no spinner, just a quiet line */}
                {pendingQuestion?.phase === currentPhase && (
                  <div className="mt-4">
                    <div className="flex justify-end">
                      <div
                        className="max-w-[280px] px-[15px] py-[11px] text-[14px]"
                        style={{
                          backgroundColor: "#1B1712",
                          color: "#EDE8E0",
                          borderTopLeftRadius: 14,
                          borderTopRightRadius: 14,
                          borderBottomRightRadius: 4,
                          borderBottomLeftRadius: 14,
                        }}
                      >
                        {pendingQuestion.question}
                      </div>
                    </div>
                    <p className="mt-2 text-[13px] italic" style={{ color: "#8A8072" }}>
                      Rick's thinking…
                    </p>
                  </div>
                )}

                {/* Free input pill */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitAskRick(askInput);
                  }}
                  className="mt-4 flex items-center gap-2 rounded-full border py-1.5 pl-4 pr-1.5"
                  style={{ backgroundColor: "#0D0C0A", borderColor: "rgba(237,232,224,0.10)" }}
                >
                  <input
                    type="text"
                    value={askInput}
                    onChange={(e) => setAskInput(e.target.value)}
                    placeholder={
                      (exchangesByPhase[currentPhase]?.length || 0) > 0
                        ? "Ask a follow-up…"
                        : "Ask anything about this pour…"
                    }
                    disabled={askRickMutation.isPending}
                    className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#7A7060] disabled:opacity-60"
                    style={{ color: "#EDE8E0" }}
                  />
                  <button
                    type="submit"
                    disabled={!askInput.trim() || askRickMutation.isPending}
                    aria-label="Ask Rick"
                    className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full disabled:opacity-40"
                    style={{ backgroundColor: "rgba(237,232,224,0.1)" }}
                  >
                    <ArrowUp className="h-4 w-4" style={{ color: "#B5AC9F" }} />
                  </button>
                </form>
              </div>
            </>
          )}
          </div>
        </main>

        {/* Footer — guided mode: single gold Continue CTA, forward-only (1c) */}
        {mode === 'guided' && (
          <footer
            className="shrink-0 border-t p-4 sm:p-6"
            style={{ backgroundColor: "#050505", borderColor: "rgba(237,232,224,0.08)" }}
          >
            <div className="container mx-auto max-w-2xl">
              <Button
                onClick={handleNext}
                disabled={completeSessionMutation.isPending}
                className="w-full h-[52px] rounded-[10px] font-semibold hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#D4A44C", color: "#1A1200" }}
              >
                {completeSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : currentPhaseIndex === PHASES.length - 1 ? (
                  "Complete"
                ) : (
                  `Continue to ${PHASE_LABELS[PHASES[currentPhaseIndex + 1]]}`
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
