import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Check, X, Wand2 } from "lucide-react";
import { useSuggestNotes, useEnhanceNotes, useAiStatus } from "@/hooks/use-ai-tasting";
import { useToast } from "@/hooks/use-toast";

interface SuggestedNotes {
  nose: string[];
  palate: string[];
  finish: string[];
  summary: string;
}

interface EnhancedNotes {
  nose: string;
  palate: string;
  finish: string;
  enhanced: string;
}

interface AiSuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskeyId?: number;
  whiskeyName: string;
  whiskeyDetails?: {
    name?: string;
    distillery?: string;
    type?: string;
    age?: number;
    abv?: number;
  };
  onApplySuggestions: (suggestions: {
    noseAromas: string[];
    tasteFlavors: string[];
    finishFlavors: string[];
  }) => void;
}

export function AiSuggestModal({
  isOpen,
  onClose,
  whiskeyId,
  whiskeyName,
  whiskeyDetails,
  onApplySuggestions,
}: AiSuggestModalProps) {
  const { toast } = useToast();
  const { data: aiStatus } = useAiStatus();
  const suggestMutation = useSuggestNotes();
  const [suggestions, setSuggestions] = useState<SuggestedNotes | null>(null);
  const [selectedNose, setSelectedNose] = useState<string[]>([]);
  const [selectedPalate, setSelectedPalate] = useState<string[]>([]);
  const [selectedFinish, setSelectedFinish] = useState<string[]>([]);

  const handleSuggest = async () => {
    try {
      const result = await suggestMutation.mutateAsync(
        whiskeyId ? { whiskeyId } : whiskeyDetails || { name: whiskeyName }
      );
      setSuggestions(result);
      // Pre-select all suggestions
      setSelectedNose(result.nose);
      setSelectedPalate(result.palate);
      setSelectedFinish(result.finish);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get suggestions",
        variant: "destructive",
      });
    }
  };

  const toggleNose = (item: string) => {
    setSelectedNose((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const togglePalate = (item: string) => {
    setSelectedPalate((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleFinish = (item: string) => {
    setSelectedFinish((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleApply = () => {
    onApplySuggestions({
      noseAromas: selectedNose,
      tasteFlavors: selectedPalate,
      finishFlavors: selectedFinish,
    });
    onClose();
    toast({
      title: "Suggestions Applied",
      description: "AI-suggested flavors have been added to your review.",
    });
  };

  const handleClose = () => {
    setSuggestions(null);
    setSelectedNose([]);
    setSelectedPalate([]);
    setSelectedFinish([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Tasting Suggestions
          </DialogTitle>
          <DialogDescription>
            Get AI-powered suggestions for what flavors to look for in {whiskeyName}.
          </DialogDescription>
        </DialogHeader>

        {!suggestions ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Based on the whiskey type, distillery style, and common characteristics,
              the AI will suggest likely tasting notes to help guide your experience.
            </p>

            {aiStatus && (
              <div className="text-xs text-muted-foreground">
                {aiStatus.remaining} AI requests remaining today
              </div>
            )}

            <Button
              onClick={handleSuggest}
              disabled={suggestMutation.isPending || (aiStatus && !aiStatus.allowed)}
              className="w-full"
            >
              {suggestMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing whiskey...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Get Suggestions
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm">
              <p className="font-medium mb-1">Summary</p>
              <p className="text-muted-foreground">{suggestions.summary}</p>
            </div>

            <div>
              <p className="font-medium mb-2">Nose (Aromas)</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.nose.map((item) => (
                  <Badge
                    key={item}
                    variant={selectedNose.includes(item) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleNose(item)}
                  >
                    {selectedNose.includes(item) && <Check className="w-3 h-3 mr-1" />}
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Palate (Taste)</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.palate.map((item) => (
                  <Badge
                    key={item}
                    variant={selectedPalate.includes(item) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePalate(item)}
                  >
                    {selectedPalate.includes(item) && <Check className="w-3 h-3 mr-1" />}
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Finish</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.finish.map((item) => (
                  <Badge
                    key={item}
                    variant={selectedFinish.includes(item) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFinish(item)}
                  >
                    {selectedFinish.includes(item) && <Check className="w-3 h-3 mr-1" />}
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleApply} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Apply Selected
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AiEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskeyId?: number;
  whiskeyName: string;
  currentNotes: string;
  rating?: number;
  onApplyEnhanced: (enhanced: string) => void;
}

export function AiEnhanceModal({
  isOpen,
  onClose,
  whiskeyId,
  whiskeyName,
  currentNotes,
  rating,
  onApplyEnhanced,
}: AiEnhanceModalProps) {
  const { toast } = useToast();
  const { data: aiStatus } = useAiStatus();
  const enhanceMutation = useEnhanceNotes();
  const [enhanced, setEnhanced] = useState<EnhancedNotes | null>(null);
  const [editedText, setEditedText] = useState("");

  const handleEnhance = async () => {
    try {
      const result = await enhanceMutation.mutateAsync({
        whiskeyId,
        userNotes: currentNotes,
        rating,
      });
      setEnhanced(result);
      setEditedText(result.enhanced);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enhance notes",
        variant: "destructive",
      });
    }
  };

  const handleApply = () => {
    onApplyEnhanced(editedText);
    onClose();
    toast({
      title: "Notes Enhanced",
      description: "Your tasting notes have been updated with the AI-enhanced version.",
    });
  };

  const handleClose = () => {
    setEnhanced(null);
    setEditedText("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-500" />
            Enhance Your Notes
          </DialogTitle>
          <DialogDescription>
            AI will expand your brief observations into polished tasting notes.
          </DialogDescription>
        </DialogHeader>

        {!enhanced ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Your notes:</p>
              <div className="p-3 bg-muted rounded-lg text-sm">
                "{currentNotes}"
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              The AI will elaborate on your observations while keeping your authentic voice.
              It won't invent flavors you didn't mention.
            </p>

            {aiStatus && (
              <div className="text-xs text-muted-foreground">
                {aiStatus.remaining} AI requests remaining today
              </div>
            )}

            <Button
              onClick={handleEnhance}
              disabled={enhanceMutation.isPending || (aiStatus && !aiStatus.allowed)}
              className="w-full"
            >
              {enhanceMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enhance Notes
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Nose</p>
                <p className="text-sm">{enhanced.nose}</p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Palate</p>
                <p className="text-sm">{enhanced.palate}</p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Finish</p>
                <p className="text-sm">{enhanced.finish}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Enhanced summary (editable):</p>
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleApply} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Use This
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
