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
import { ArrowLeft, ArrowRight, Check, Loader2, X, Eye, Droplets, Wind, Utensils, Clock, DollarSign, Star, Sparkles, Wand2, Mic, PencilLine } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { StarRating } from "@/components/StarRating";
import { FlavorChipGroup, SingleFlavorChipGroup } from "@/components/ui/flavor-chip";
import { StandardFlavorAccordion } from "@/components/ui/flavor-accordion";
import { cn } from "@/lib/utils";
import { AiSuggestModal, AiEnhanceModal } from "@/components/modals/AiTastingModal";
import RickReviewSession from "@/components/RickReviewSession";
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
  existingReview?: ReviewNote; // Optional: if provided, modal opens in edit mode
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

type ReviewMode = 'select' | 'regular' | 'rick';

const ReviewModal = ({ isOpen, onClose, whiskey, existingReview }: ReviewModalProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [rating, setRating] = useState(0);
  const isMobile = useIsMobile();

  // Review mode: select between regular or Rick-guided
  const [reviewMode, setReviewMode] = useState<ReviewMode>('select');
  const [showRickSession, setShowRickSession] = useState(false);

  // Determine if we're in edit mode
  const isEditMode = !!existingReview;

  // State for multi-select fields
  const [selectedNoseAromas, setSelectedNoseAromas] = useState<string[]>([]);
  const [selectedTasteFlavors, setSelectedTasteFlavors] = useState<string[]>([]);
  const [selectedFinishFlavors, setSelectedFinishFlavors] = useState<string[]>([]);

  // State for score fields (using local state for reliable updates)
  const [noseScore, setNoseScore] = useState<number | undefined>(undefined);
  const [mouthfeelScore, setMouthfeelScore] = useState<number | undefined>(undefined);
  const [tasteScore, setTasteScore] = useState<number | undefined>(undefined);
  const [finishScore, setFinishScore] = useState<number | undefined>(undefined);
  const [valueScore, setValueScore] = useState<number | undefined>(undefined);

  // AI Assist modals state
  const [showAiSuggestModal, setShowAiSuggestModal] = useState(false);
  const [showAiEnhanceModal, setShowAiEnhanceModal] = useState(false);

  const form = useForm<ReviewNote>({
    resolver: zodResolver(reviewNoteSchema),
    defaultValues: existingReview ? {
      ...existingReview,
      // Ensure arrays are arrays
      noseAromas: existingReview.noseAromas || [],
      tasteFlavors: existingReview.tasteFlavors || [],
      finishFlavors: existingReview.finishFlavors || [],
    } : {
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

  // Pre-populate all form values when editing existing review
  useEffect(() => {
    if (isOpen && existingReview) {
      // Reset form first, then explicitly set each field to ensure scores are populated
      form.reset();

      // Explicitly set all fields from existing review
      Object.entries(existingReview).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.setValue(key as any, value);
        }
      });

      // Ensure arrays are properly set
      form.setValue('noseAromas', existingReview.noseAromas || []);
      form.setValue('tasteFlavors', existingReview.tasteFlavors || []);
      form.setValue('finishFlavors', existingReview.finishFlavors || []);

      // Explicitly set score values (handle both number and string formats)
      if (existingReview.noseScore !== undefined && existingReview.noseScore !== null) {
        form.setValue('noseScore', Number(existingReview.noseScore));
      }
      if (existingReview.mouthfeelScore !== undefined && existingReview.mouthfeelScore !== null) {
        form.setValue('mouthfeelScore', Number(existingReview.mouthfeelScore));
      }
      if (existingReview.tasteScore !== undefined && existingReview.tasteScore !== null) {
        form.setValue('tasteScore', Number(existingReview.tasteScore));
      }
      if (existingReview.finishScore !== undefined && existingReview.finishScore !== null) {
        form.setValue('finishScore', Number(existingReview.finishScore));
      }
      if (existingReview.valueScore !== undefined && existingReview.valueScore !== null) {
        form.setValue('valueScore', Number(existingReview.valueScore));
      }

      // Also update the local state for multi-select components
      setSelectedNoseAromas(existingReview.noseAromas || []);
      setSelectedTasteFlavors(existingReview.tasteFlavors || []);
      setSelectedFinishFlavors(existingReview.finishFlavors || []);
      setRating(existingReview.rating || 0);

      // Update score states from existing review
      setNoseScore(existingReview.noseScore !== undefined && existingReview.noseScore !== null
        ? Number(existingReview.noseScore) : undefined);
      setMouthfeelScore(existingReview.mouthfeelScore !== undefined && existingReview.mouthfeelScore !== null
        ? Number(existingReview.mouthfeelScore) : undefined);
      setTasteScore(existingReview.tasteScore !== undefined && existingReview.tasteScore !== null
        ? Number(existingReview.tasteScore) : undefined);
      setFinishScore(existingReview.finishScore !== undefined && existingReview.finishScore !== null
        ? Number(existingReview.finishScore) : undefined);
      setValueScore(existingReview.valueScore !== undefined && existingReview.valueScore !== null
        ? Number(existingReview.valueScore) : undefined);

      setCurrentStep(0);
    } else if (isOpen && !existingReview) {
      // Reset to empty values for new review
      form.reset({
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
      });
      setSelectedNoseAromas([]);
      setSelectedTasteFlavors([]);
      setSelectedFinishFlavors([]);
      setRating(0);
      // Reset scores for new review
      setNoseScore(undefined);
      setMouthfeelScore(undefined);
      setTasteScore(undefined);
      setFinishScore(undefined);
      setValueScore(undefined);
      setCurrentStep(0);
      // Reset review mode to selection screen for new reviews
      setReviewMode('select');
      setShowRickSession(false);
    }
  }, [isOpen, existingReview, form]);

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

  // Sync score selections with form
  useEffect(() => {
    if (noseScore !== undefined) {
      form.setValue('noseScore', noseScore);
    }
  }, [noseScore, form]);

  useEffect(() => {
    if (mouthfeelScore !== undefined) {
      form.setValue('mouthfeelScore', mouthfeelScore);
    }
  }, [mouthfeelScore, form]);

  useEffect(() => {
    if (tasteScore !== undefined) {
      form.setValue('tasteScore', tasteScore);
    }
  }, [tasteScore, form]);

  useEffect(() => {
    if (finishScore !== undefined) {
      form.setValue('finishScore', finishScore);
    }
  }, [finishScore, form]);

  useEffect(() => {
    if (valueScore !== undefined) {
      form.setValue('valueScore', valueScore);
    }
  }, [valueScore, form]);

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
    if (existingReview) {
      // Reset to existing review values when in edit mode
      setRating(existingReview.rating || 0);
      setSelectedNoseAromas(existingReview.noseAromas || []);
      setSelectedTasteFlavors(existingReview.tasteFlavors || []);
      setSelectedFinishFlavors(existingReview.finishFlavors || []);
      form.reset(existingReview);
    } else {
      // Reset to empty values for new review
      setRating(0);
      setSelectedNoseAromas([]);
      setSelectedTasteFlavors([]);
      setSelectedFinishFlavors([]);
      form.reset();
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Calculate weighted score (using local state values)
  const calculateWeightedScore = () => {
    const ns = Number(noseScore) || 0;
    const ms = Number(mouthfeelScore) || 0;
    const ts = Number(tasteScore) || 0;
    const fs = Number(finishScore) || 0;
    const vs = Number(valueScore) || 0;

    const weighted = (ns * 1.5) + (ms * 2.0) + (ts * 3.0) + (fs * 2.5) + (vs * 1.0);
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

      // Use PUT for editing, POST for creating new review
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `/api/whiskeys/${whiskey.id}/reviews/${existingReview!.id}`
        : `/api/whiskeys/${whiskey.id}/reviews`;

      const response = await apiRequest(method, url, reviewData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
      toast({
        title: isEditMode ? "Review Updated" : "Review Added",
        description: "Your tasting notes have been saved.",
      });
      handleClose();

      if (data && Array.isArray(data.notes) && data.notes.length > 0) {
        // For edit mode, find the updated review; for new, get the last one
        const reviewToShow = isEditMode
          ? data.notes.find((n: ReviewNote) => n.id === existingReview!.id) || data.notes[data.notes.length - 1]
          : data.notes[data.notes.length - 1];
        window.location.href = `/whiskey/${data.id}/review/${reviewToShow.id}`;
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'add'} review: ${error.message}`,
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

    // Explicitly include local state scores to ensure they're submitted
    // (useEffect syncs may not have run yet due to React batching)
    if (noseScore !== undefined) formData.noseScore = noseScore;
    if (mouthfeelScore !== undefined) formData.mouthfeelScore = mouthfeelScore;
    if (tasteScore !== undefined) formData.tasteScore = tasteScore;
    if (finishScore !== undefined) formData.finishScore = finishScore;
    if (valueScore !== undefined) formData.valueScore = valueScore;

    // Also ensure array selections are included
    formData.noseAromas = selectedNoseAromas;
    formData.tasteFlavors = selectedTasteFlavors;
    formData.finishFlavors = selectedFinishFlavors;

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
                selected={noseScore?.toString()}
                onSelect={(value) => setNoseScore(Number(value))}
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
                selected={mouthfeelScore?.toString()}
                onSelect={(value) => setMouthfeelScore(Number(value))}
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
                selected={tasteScore?.toString()}
                onSelect={(value) => setTasteScore(Number(value))}
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
                selected={finishScore?.toString()}
                onSelect={(value) => setFinishScore(Number(value))}
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
                selected={valueScore?.toString()}
                onSelect={(value) => setValueScore(Number(value))}
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

  // Handle Rick review session completion
  const handleRickReviewComplete = (rickScores: { nose: number; mouthfeel: number; taste: number; finish: number; value: number; summary: string }) => {
    // Populate scores from Rick session
    setNoseScore(rickScores.nose);
    setMouthfeelScore(rickScores.mouthfeel);
    setTasteScore(rickScores.taste);
    setFinishScore(rickScores.finish);
    setValueScore(rickScores.value);

    // Set summary if provided
    if (rickScores.summary) {
      form.setValue('text', rickScores.summary);
    }

    // Close Rick session and go to regular review at summary step
    setShowRickSession(false);
    setReviewMode('regular');
    setCurrentStep(STEPS.length - 1); // Jump to summary

    toast({
      title: "Scores Applied",
      description: "Your Rick-guided scores have been added. Review and save!",
    });
  };

  // Show Rick Review Session
  if (showRickSession) {
    return (
      <RickReviewSession
        whiskey={whiskey}
        onClose={() => {
          setShowRickSession(false);
          setReviewMode('select');
        }}
        onComplete={handleRickReviewComplete}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        hideCloseButton
        description="Write a tasting review"
        className={cn(
          "p-0 gap-0 overflow-hidden flex flex-col",
          isMobile
            ? "w-full h-full max-w-none max-h-none rounded-none border-0 translate-x-0 translate-y-0 left-0 top-0"
            : "max-w-2xl max-h-[90vh]"
        )}
      >
        {/* Mode Selection Screen (for new reviews only) */}
        {reviewMode === 'select' && !isEditMode ? (
          <>
            <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
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
            </div>

            <div className="p-6 space-y-4">
              <p className="text-muted-foreground">How would you like to review this whiskey?</p>

              <Button
                variant="outline"
                className="w-full min-h-20 py-4 justify-start gap-4 text-left"
                onClick={() => {
                  setShowRickSession(true);
                }}
              >
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Mic className="h-6 w-6 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-base">Review with Rick</div>
                  <div className="text-sm text-muted-foreground">Rick guides you through scoring each aspect</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full min-h-20 py-4 justify-start gap-4 text-left"
                onClick={() => setReviewMode('regular')}
              >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <PencilLine className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-base">Regular Review</div>
                  <div className="text-sm text-muted-foreground">Fill in the review form yourself</div>
                </div>
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border">
              {/* Progress bar */}
              <div className="h-1.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Title and whiskey info */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <DialogTitle className="font-heading text-xl text-foreground">
                    {isEditMode ? 'Edit Review' : 'Review'}: {whiskey.name}
                  </DialogTitle>
                  <button
                    onClick={handleClose}
                    className="p-1 rounded-md hover:bg-accent transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Step indicator with circles */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  )}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-heading text-lg text-foreground">
                      {currentStepData.title}
                      <span className="text-muted-foreground font-sans text-sm font-normal ml-2">
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
          </>
        )}
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
