import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl?: string | null;
  audioBase64?: string | null;
  contentType?: string;
  isLoading?: boolean;
  textOnly?: boolean;
  error?: string;
  onEnded?: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  showSkipButtons?: boolean;
  autoPlay?: boolean;
  className?: string;
}

const AudioPlayer = ({
  audioUrl,
  audioBase64,
  contentType = 'audio/mpeg',
  isLoading = false,
  textOnly = false,
  error,
  onEnded,
  onSkipBack,
  onSkipForward,
  showSkipButtons = true,
  autoPlay = false,
  className
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Create audio source URL
  const audioSrc = audioBase64
    ? `data:${contentType};base64,${audioBase64}`
    : audioUrl;

  // Reset state when audio source changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioSrc]);

  // Handle autoplay
  useEffect(() => {
    if (autoPlay && audioSrc && audioRef.current && !isLoading && !textOnly) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked - user will need to click play
          setIsPlaying(false);
        });
      }
    }
  }, [audioSrc, autoPlay, isLoading, textOnly]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onEnded?.();
  };

  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Text-only mode
  if (textOnly) {
    return (
      <div className={cn("p-4 bg-accent/30 rounded-lg border border-border/30", className)}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <VolumeX className="h-5 w-5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Audio unavailable</p>
            {error && <p className="text-xs text-muted-foreground mt-0.5">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("p-4 bg-accent/30 rounded-lg border border-border/30", className)}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          <span className="text-sm">Loading audio...</span>
        </div>
      </div>
    );
  }

  // No audio available
  if (!audioSrc) {
    return (
      <div className={cn("p-4 bg-accent/30 rounded-lg border border-border/30", className)}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Volume2 className="h-5 w-5" />
          <span className="text-sm">No audio available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 bg-accent/30 rounded-lg border border-border/30", className)}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Skip Back */}
        {showSkipButtons && onSkipBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onSkipBack}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
        )}

        {/* Play/Pause */}
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 rounded-full bg-amber-600 hover:bg-amber-700 text-white"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Skip Forward */}
        {showSkipButtons && onSkipForward && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onSkipForward}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        )}

        {/* Progress */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
