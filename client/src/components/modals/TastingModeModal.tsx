import { useState } from "react";
import { formatWhiskeyName } from "@/lib/utils/formatName";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Whiskey } from "@shared/schema";
import { Mic, BookOpen, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TastingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
  onSelectMode: (mode: 'guided' | 'notes') => void;
  isLoading?: boolean;
}

const TastingModeModal = ({ isOpen, onClose, whiskey, onSelectMode, isLoading }: TastingModeModalProps) => {
  const [selectedMode, setSelectedMode] = useState<'guided' | 'notes' | null>(null);

  const handleStart = () => {
    if (selectedMode) {
      onSelectMode(selectedMode);
    }
  };

  const handleClose = () => {
    setSelectedMode(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Mic className="h-5 w-5 text-amber-500" />
            Taste with Rick
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose how you'd like Rick to guide your tasting of{" "}
            <span className="font-medium text-foreground">{formatWhiskeyName(whiskey.name)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Guide Me Option */}
          <button
            type="button"
            className={cn(
              "w-full p-4 rounded-lg border-2 text-left transition-all",
              "hover:border-amber-500/50 hover:bg-amber-500/5",
              selectedMode === 'guided'
                ? "border-amber-500 bg-amber-500/10"
                : "border-border/50 bg-card"
            )}
            onClick={() => setSelectedMode('guided')}
            disabled={isLoading}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                selectedMode === 'guided' ? "bg-amber-500 text-white" : "bg-accent text-muted-foreground"
              )}>
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Guide Me</h3>
                <p className="text-sm text-muted-foreground">
                  Full walkthrough experience. Rick will guide you through each phase of the tasting,
                  explaining what to look for and helping you develop your palate.
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>~10-15 minutes</span>
                </div>
              </div>
            </div>
          </button>

          {/* Just Notes Option */}
          <button
            type="button"
            className={cn(
              "w-full p-4 rounded-lg border-2 text-left transition-all",
              "hover:border-amber-500/50 hover:bg-amber-500/5",
              selectedMode === 'notes'
                ? "border-amber-500 bg-amber-500/10"
                : "border-border/50 bg-card"
            )}
            onClick={() => setSelectedMode('notes')}
            disabled={isLoading}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                selectedMode === 'notes' ? "bg-amber-500 text-white" : "bg-accent text-muted-foreground"
              )}>
                <Mic className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Just the Notes</h3>
                <p className="text-sm text-muted-foreground">
                  Brief flavor profile and Rick's take. For experienced tasters who know what they're doing
                  and just want the highlights.
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>~3-5 minutes</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={!selectedMode || isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Tasting
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TastingModeModal;
