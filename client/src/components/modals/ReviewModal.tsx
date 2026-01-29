import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Whiskey, reviewNoteSchema, ReviewNote } from "@shared/schema";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, ArrowRight, Check, Loader2, X, Eye, Droplets, Wind, Utensils, Clock, DollarSign, Star, Sparkles, Wand2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { StarRating } from "@/components/StarRating";
import { FlavorChipGroup, SingleFlavorChipGroup } from "@/components/ui/flavor-chip";
import { StandardFlavorAccordion } from "@/components/ui/flavor-accordion";
import { cn } from "@/lib/utils";
import { AiSuggestModal, AiEnhanceModal } from "@/components/modals/AiTastingModal";
import {
  COLOR_OPTIONS,
  VISCOSITY_OPTIONS,
  CLARITY_OPTIONS,
  ALCOHOL_FEEL_OPTIONS,
  MOUTHFEEL_VISCOSITY_OPTIONS,
  PLEASANTNESS_OPTIONS,
  FINISH_LENGTH_OPTIONS,
  AVAILABILITY_OPTIONS,
  BUY_AGAIN_OPTIONS,
  OCCASION_OPTIONS,
  SCORE_OPTIONS
} from "@/lib/reviewOptions";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
}

// Define the review steps
const STEPS = [
  { id: "visual", title: "Visual", icon: Eye, description: "Color, clarity & legs" },
  { id: "nose", title: "Nose", icon: Wind, description: "Aromas & scents" },
  { id: "mouthfeel", title: "Mouthfeel", icon: Droplets, description: "Texture & weight" },
  { id: "taste", title: "Taste", icon: Utensils, description: "Flavors on the palate" },
  { id: "finish", title: "Finish", icon: Clock, description: "Aftertaste & length" },
  { id: "value", title: "Value", icon: DollarSign, description: "Worth the price?" },
  { id: "summary", title: "Summary", icon: Star, description: "Final thoughts" },
];

const ReviewModal = ({ isOpen, onClose, whiskey }: ReviewModalProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [rating, setRating] = useState(0);
  const isMobile = useIsMobile();

  // State for multi-select fields
  const [selectedNoseAromas, setSelectedNoseAromas] = useState<string[]>([]);
  const [selectedTasteFlavors, setSelectedTasteFlavors] = useState<string[]>([]);
  const [selectedFinishFlavors, setSelectedFinishFlavors] = useState<string[]>([]);

  // AI Assist modals state
  const [showAiSuggestModal, setShowAiSuggestModal] = useState(false);
  const [showAiEnhanceModal, setShowAiEnhanceModal] = useState(false);

  const form = useForm<ReviewNote>({
    resolver: zodResolver(reviewNoteSchema),
    defaultValues: {
      rating: 0,
      date: new Date().toISOString().split('T')[0],
      text: "",
      flavor: "",
      id: nanoid(),
      visual: "",
      nose: "",
      mouthfeel: "",
      taste: "",
      finish: "",
      value: "",
      visualColor: "",
      visualViscosity: "",
      visualClarity: "",
      visualNotes: "",
      noseAromas: [],
      noseScore: undefined,
      noseNotes: "",
      mouthfeelAlcohol: "",
      mouthfeelViscosity: "",
      mouthfeelPleasantness: "",
      mouthfeelScore: undefined,
      mouthfeelNotes: "",
      tasteFlavors: [],
      tasteCorrelation: undefined,
      tasteScore: undefined,
      tasteNotes: "",
      finishFlavors: [],
      finishCorrelation: undefined,
      finishLength: "",
      finishPleasantness: "",
      finishScore: undefined,
      finishNotes: "",
      valueAvailability: "",
      valueBuyAgain: "",
      valueOccasion: "",
      valueScore: undefined,
      valueNotes: "",
      flavorProfileFruitFloral: 0,
      flavorProfileSweet: 0,
      flavorProfileSpice: 0,
      flavorProfileHerbal: 0,
      flavorProfileGrain: 0,
      flavorProfileOak: 0,
      isPublic: false,
      shareId: undefined
    },
  });

  // Sync flavor selections with form
  useEffect(() => {
    form.setValue('noseAromas', selectedNoseAromas);
  }, [selectedNoseAromas, form]);

  useEffect(() => {
    form.setValue('tasteFlavors', selectedTasteFlavors);
  }, [selectedTasteFlavors, form]);

  useEffect(() => {
    form.setValue('finishFlavors', selectedFinishFlavors);
  }, [selectedFinishFlavors, form]);

  const toggleAroma = (value: string) => {
    setSelectedNoseAromas(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleTaste = (value: string) => {
    setSelectedTasteFlavors(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleFinish = (value: string) => {
    setSelectedFinishFlavors(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const resetForm = () => {
    setCurrentStep(0);
    setRating(0);
    setSelectedNoseAromas([]);
    setSelectedTasteFlavors([]);
    setSelectedFinishFlavors([]);
    form.reset();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Calculate weighted score
  const calculateWeightedScore = () => {
    const noseScore = Number(form.getValues('noseScore')) || 0;
    const mouthfeelScore = Number(form.getValues('mouthfeelScore')) || 0;
    const tasteScore = Number(form.getValues('tasteScore')) || 0;
    const finishScore = Number(form.getValues('finishScore')) || 0;
    const valueScore = Number(form.getValues('valueScore')) || 0;

    const weighted = (noseScore * 1.5) + (mouthfeelScore * 2.0) + (tasteScore * 3.0) + (finishScore * 2.5) + (valueScore * 1.0);
    return weighted / 10;
  };

  const addReviewMutation = useMutation({
    mutationFn: async (data: ReviewNote) => {
      const reviewData = {
        ...data,
        flavorProfileFruitFloral: Number(data.flavorProfileFruitFloral || 0),
        flavorProfileSweet: Number(data.flavorProfileSweet || 0),
        flavorProfileSpice: Number(data.flavorProfileSpice || 0),
        flavorProfileHerbal: Number(data.flavorProfileHerbal || 0),
        flavorProfileGrain: Number(data.flavorProfileGrain || 0),
        flavorProfileOak: Number(data.flavorProfileOak || 0),
      };

      // Build comprehensive text summary
      const sections = [
        `## Visual\nColor: ${reviewData.visualColor}, Viscosity: ${reviewData.visualViscosity}, Clarity: ${reviewData.visualClarity}\n${reviewData.visualNotes || ''}`,
        `## Nose\nAromas: ${reviewData.noseAromas?.join(', ') || 'None'}\nScore: ${reviewData.noseScore}/5\n${reviewData.noseNotes || ''}`,
        `## Mouthfeel\nAlcohol: ${reviewData.mouthfeelAlcohol}, Viscosity: ${reviewData.mouthfeelViscosity}, Pleasantness: ${reviewData.mouthfeelPleasantness}\nScore: ${reviewData.mouthfeelScore}/5\n${reviewData.mouthfeelNotes || ''}`,
        `## Taste\nFlavors: ${reviewData.tasteFlavors?.join(', ') || 'None'}\nScore: ${reviewData.tasteScore}/5\n${reviewData.tasteNotes || ''}`,
        `## Finish\nLength: ${reviewData.finishLength}, Flavors: ${reviewData.finishFlavors?.join(', ') || 'None'}\nScore: ${reviewData.finishScore}/5\n${reviewData.finishNotes || ''}`,
        `## Value\nAvailability: ${reviewData.valueAvailability}, Buy Again: ${reviewData.valueBuyAgain}, Occasion: ${reviewData.valueOccasion}\nScore: ${reviewData.valueScore}/5\n${reviewData.valueNotes || ''}`,
        `## Overall\n${reviewData.text || 'No additional notes.'}\nRating: ${reviewData.rating}/5`,
      ];

      reviewData.text = sections.join('\n\n');

      const response = await apiRequest(
        "POST",
        `/api/whiskeys/${whiskey.id}/reviews`,
        reviewData
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
      toast({
        title: "Review Added",
        description: "Your tasting notes have been saved.",
      });
      handleClose();

      if (data && Array.isArray(data.notes) && data.notes.length > 0) {
        const newReview = data.notes[data.notes.length - 1];
        window.location.href = `/whiskey/${data.id}/review/${newReview.id}`;
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add review: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const formData = form.getValues();
    const weightedScore = calculateWeightedScore();
    formData.rating = Math.round(weightedScore * 10) / 10;
    addReviewMutation.mutate(formData);
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];
  const StepIcon = currentStepData.icon;

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Visual
        return (
          <div className="space-y-6">
            {/* AI Suggest Button */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">Need help knowing what to look for?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get AI-suggested tasting notes based on this whiskey's profile.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAiSuggestModal(true)}
                  className="shrink-0"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Suggest Flavors
                </Button>
              </div>
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Color</FormLabel>
              <SingleFlavorChipGroup
                options={COLOR_OPTIONS.map(c => ({ value: c.value, label: c.label, hex: c.hex }))}
                selected={form.watch('visualColor')}
                onSelect={(value) => form.setValue('visualColor', value)}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Viscosity (Legs)</FormLabel>
              <SingleFlavorChipGroup
                options={VISCOSITY_OPTIONS}
                selected={form.watch('visualViscosity')}
                onSelect={(value) => form.setValue('visualViscosity', value)}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Clarity</FormLabel>
              <SingleFlavorChipGroup
                options={CLARITY_OPTIONS}
                selected={form.watch('visualClarity')}
                onSelect={(value) => form.setValue('visualClarity', value)}
              />
            </div>

            <FormField
              control={form.control}
              name="visualNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any other visual observations..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 1: // Nose
        return (
          <div className="space-y-6">
            <div>
              <FormLabel className="text-base font-medium mb-3 block">
                Aromas Detected
                {selectedNoseAromas.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-primary">
                    ({selectedNoseAromas.length} selected)
                  </span>
                )}
              </FormLabel>
              <StandardFlavorAccordion
                selected={selectedNoseAromas}
                onToggle={toggleAroma}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Nose Score</FormLabel>
              <SingleFlavorChipGroup
                options={SCORE_OPTIONS.map(s => ({ value: String(s.value), label: s.label }))}
                selected={form.watch('noseScore')?.toString()}
                onSelect={(value) => form.setValue('noseScore', Number(value))}
              />
            </div>

            <FormField
              control={form.control}
              name="noseNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nose Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you smell..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 2: // Mouthfeel
        return (
          <div className="space-y-6">
            <div>
              <FormLabel className="text-base font-medium mb-3 block">Alcohol Feel</FormLabel>
              <SingleFlavorChipGroup
                options={ALCOHOL_FEEL_OPTIONS}
                selected={form.watch('mouthfeelAlcohol')}
                onSelect={(value) => form.setValue('mouthfeelAlcohol', value)}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Body/Weight</FormLabel>
              <SingleFlavorChipGroup
                options={MOUTHFEEL_VISCOSITY_OPTIONS}
                selected={form.watch('mouthfeelViscosity')}
                onSelect={(value) => form.setValue('mouthfeelViscosity', value)}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Pleasantness</FormLabel>
              <SingleFlavorChipGroup
                options={PLEASANTNESS_OPTIONS}
                selected={form.watch('mouthfeelPleasantness')}
                onSelect={(value) => form.setValue('mouthfeelPleasantness', value)}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Mouthfeel Score</FormLabel>
              <SingleFlavorChipGroup
                options={SCORE_OPTIONS.map(s => ({ value: String(s.value), label: s.label }))}
                selected={form.watch('mouthfeelScore')?.toString()}
                onSelect={(value) => form.setValue('mouthfeelScore', Number(value))}
              />
            </div>

            <FormField
              control={form.control}
              name="mouthfeelNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mouthfeel Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the texture and feel..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 3: // Taste
        return (
          <div className="space-y-6">
            <div>
              <FormLabel className="text-base font-medium mb-3 block">
                Flavors on Palate
                {selectedTasteFlavors.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-primary">
                    ({selectedTasteFlavors.length} selected)
                  </span>
                )}
              </FormLabel>
              <StandardFlavorAccordion
                selected={selectedTasteFlavors}
                onToggle={toggleTaste}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Matches the Nose?</FormLabel>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant={form.watch('tasteCorrelation') === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => form.setValue('tasteCorrelation', true)}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={form.watch('tasteCorrelation') === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => form.setValue('tasteCorrelation', false)}
                >
                  No
                </Button>
              </div>
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Taste Score</FormLabel>
              <SingleFlavorChipGroup
                options={SCORE_OPTIONS.map(s => ({ value: String(s.value), label: s.label }))}
                selected={form.watch('tasteScore')?.toString()}
                onSelect={(value) => form.setValue('tasteScore', Number(value))}
              />
            </div>

            <FormField
              control={form.control}
              name="tasteNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taste Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you taste..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 4: // Finish
        return (
          <div className="space-y-6">
            <div>
              <FormLabel className="text-base font-medium mb-3 block">Finish Length</FormLabel>
              <SingleFlavorChipGroup
                options={FINISH_LENGTH_OPTIONS}
                selected={form.watch('finishLength')}
                onSelect={(value) => form.setValue('finishLength', value)}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">
                Lingering Flavors
                {selectedFinishFlavors.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-primary">
                    ({selectedFinishFlavors.length} selected)
                  </span>
                )}
              </FormLabel>
              <StandardFlavorAccordion
                selected={selectedFinishFlavors}
                onToggle={toggleFinish}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Finish Pleasantness</FormLabel>
              <SingleFlavorChipGroup
                options={PLEASANTNESS_OPTIONS}
                selected={form.watch('finishPleasantness')}
                onSelect={(value) => form.setValue('finishPleasantness', value)}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Finish Score</FormLabel>
              <SingleFlavorChipGroup
                options={SCORE_OPTIONS.map(s => ({ value: String(s.value), label: s.label }))}
                selected={form.watch('finishScore')?.toString()}
                onSelect={(value) => form.setValue('finishScore', Number(value))}
              />
            </div>

            <FormField
              control={form.control}
              name="finishNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finish Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the aftertaste..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 5: // Value
        return (
          <div className="space-y-6">
            {whiskey.price && (
              <div className="p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Price: <span className="text-foreground font-medium">${whiskey.price}</span></p>
                <p className="text-sm text-muted-foreground">Per pour (~14 pours): <span className="text-foreground font-medium">${(whiskey.price / 14).toFixed(2)}</span></p>
              </div>
            )}

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Availability</FormLabel>
              <SingleFlavorChipGroup
                options={AVAILABILITY_OPTIONS}
                selected={form.watch('valueAvailability')}
                onSelect={(value) => form.setValue('valueAvailability', value)}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Would Buy Again?</FormLabel>
              <SingleFlavorChipGroup
                options={BUY_AGAIN_OPTIONS}
                selected={form.watch('valueBuyAgain')}
                onSelect={(value) => form.setValue('valueBuyAgain', value)}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Best For</FormLabel>
              <SingleFlavorChipGroup
                options={OCCASION_OPTIONS}
                selected={form.watch('valueOccasion')}
                onSelect={(value) => form.setValue('valueOccasion', value)}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium mb-3 block">Value Score</FormLabel>
              <SingleFlavorChipGroup
                options={SCORE_OPTIONS.map(s => ({ value: String(s.value), label: s.label }))}
                selected={form.watch('valueScore')?.toString()}
                onSelect={(value) => form.setValue('valueScore', Number(value))}
              />
            </div>

            <FormField
              control={form.control}
              name="valueNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Worth the price? Any value thoughts..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 6: // Summary
        const weightedScore = calculateWeightedScore();
        return (
          <div className="space-y-6">
            <div className="text-center p-6 bg-accent/30 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">Calculated Rating</p>
              <div className="text-4xl font-bold text-primary mb-2">
                {weightedScore.toFixed(1)}/5
              </div>
              <StarRating rating={weightedScore} size="lg" />
              <p className="text-xs text-muted-foreground mt-2">
                Based on weighted scores: Nose (15%), Mouthfeel (20%), Taste (30%), Finish (25%), Value (10%)
              </p>
            </div>

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>Overall Thoughts</FormLabel>
                    {field.value && field.value.length > 10 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAiEnhanceModal(true)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      >
                        <Wand2 className="w-4 h-4 mr-1" />
                        Enhance Notes
                      </Button>
                    )}
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Your final thoughts on this whiskey..."
                      className="resize-none h-32"
                      {...field}
                    />
                  </FormControl>
                  {(!field.value || field.value.length <= 10) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Write a brief note first, then use AI to enhance it.
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
              <div>
                <p className="font-medium">Make Review Public</p>
                <p className="text-sm text-muted-foreground">Share with the community</p>
              </div>
              <Switch
                checked={form.watch('isPublic')}
                onCheckedChange={(checked) => form.setValue('isPublic', checked)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        hideCloseButton
        className={cn(
          "p-0 gap-0 overflow-hidden flex flex-col",
          isMobile
            ? "w-screen h-screen max-w-none max-h-none rounded-none border-0 translate-x-0 translate-y-0 left-0 top-0"
            : "max-w-2xl max-h-[90vh]"
        )}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Title and whiskey info */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <DialogTitle className="text-lg font-semibold text-foreground">
                Review: {whiskey.name}
              </DialogTitle>
              <button
                onClick={handleClose}
                className="p-1 rounded-md hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <StepIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {currentStepData.title}
                  <span className="text-muted-foreground font-normal ml-2">
                    {currentStep + 1}/{STEPS.length}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className={cn(
          "overflow-y-auto",
          isMobile ? "flex-1" : "max-h-[calc(90vh-200px)]"
        )}>
          <Form {...form}>
            <form className="p-6">
              {renderStepContent()}
            </form>
          </Form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-card border-t border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={addReviewMutation.isPending}
                className="gap-2"
              >
                {addReviewMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Review
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* AI Suggest Flavors Modal */}
      <AiSuggestModal
        isOpen={showAiSuggestModal}
        onClose={() => setShowAiSuggestModal(false)}
        whiskeyId={whiskey.id}
        whiskeyName={whiskey.name}
        whiskeyDetails={{
          name: whiskey.name,
          distillery: whiskey.distillery || undefined,
          type: whiskey.type || undefined,
          age: whiskey.age || undefined,
          abv: whiskey.abv || undefined,
        }}
        onApplySuggestions={(suggestions) => {
          // Merge with existing selections
          setSelectedNoseAromas((prev) => Array.from(new Set([...prev, ...suggestions.noseAromas])));
          setSelectedTasteFlavors((prev) => Array.from(new Set([...prev, ...suggestions.tasteFlavors])));
          setSelectedFinishFlavors((prev) => Array.from(new Set([...prev, ...suggestions.finishFlavors])));
          // Update form values
          form.setValue('noseAromas', Array.from(new Set([...selectedNoseAromas, ...suggestions.noseAromas])));
          form.setValue('tasteFlavors', Array.from(new Set([...selectedTasteFlavors, ...suggestions.tasteFlavors])));
          form.setValue('finishFlavors', Array.from(new Set([...selectedFinishFlavors, ...suggestions.finishFlavors])));
        }}
      />

      {/* AI Enhance Notes Modal */}
      <AiEnhanceModal
        isOpen={showAiEnhanceModal}
        onClose={() => setShowAiEnhanceModal(false)}
        whiskeyId={whiskey.id}
        whiskeyName={whiskey.name}
        currentNotes={form.watch('text') || ''}
        rating={rating}
        onApplyEnhanced={(enhanced) => {
          form.setValue('text', enhanced);
        }}
      />
    </Dialog>
  );
};

export default ReviewModal;
