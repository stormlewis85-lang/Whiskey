import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Whiskey, reviewNoteSchema, ReviewNote } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useSwipeable } from "react-swipeable";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { StarRating } from "@/components/StarRating";
import RadarChart from "@/components/RadarChart";
import { 
  COLOR_OPTIONS, 
  VISCOSITY_OPTIONS, 
  CLARITY_OPTIONS,
  AROMA_FLAVOR_OPTIONS,
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

// Define the review pages
enum ReviewPage {
  Visual = 0,
  Nose = 1,
  MouthFeel = 2,
  Taste = 3,
  Finish = 4,
  Value = 5,
  Summary = 6,
  FinalScores = 7
}

// Page titles and descriptions
const pageData = [
  {
    title: "Visual",
    description: "Describe the color, clarity, and appearance of the whiskey.",
    placeholder: "Golden amber with slow, thick legs..."
  },
  {
    title: "Nose",
    description: "What aromas do you detect?",
    placeholder: "Vanilla, caramel, hints of oak and spice..."
  },
  {
    title: "Mouth Feel",
    description: "How does it feel in your mouth? Texture, weight, etc.",
    placeholder: "Velvety, creamy, oily, light bodied..."
  },
  {
    title: "Taste",
    description: "What flavors come through on the palate?",
    placeholder: "Rich caramel, vanilla, baking spices with hints of dried fruits..."
  },
  {
    title: "Finish",
    description: "How long does the flavor last? What notes linger?",
    placeholder: "Long finish with warming spice and oak tannins..."
  },
  {
    title: "Value",
    description: "Is this whiskey worth the price? How would you rate its value?",
    placeholder: "Good value for the complexity and age..."
  },
  {
    title: "Summary",
    description: "Overall impression and final rating.",
    placeholder: "Overall an excellent bourbon that balances..."
  },
  {
    title: "Final Scores",
    description: "Review your weighted category scores and make final adjustments.",
    placeholder: ""
  }
];

const ReviewModal = ({ isOpen, onClose, whiskey }: ReviewModalProps) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState<ReviewPage>(ReviewPage.Visual);
  const [rating, setRating] = useState(0);
  const isMobile = useIsMobile();
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  // Content element referenced by id="review-content" to avoid ref issues
  
  // State for selected aromas and flavors
  const [selectedNoseAromas, setSelectedNoseAromas] = useState<string[]>([]);
  const [selectedTasteFlavors, setSelectedTasteFlavors] = useState<string[]>([]);
  const [selectedFinishFlavors, setSelectedFinishFlavors] = useState<string[]>([]);
  
  // State for score adjustments
  const [noseAdjustment, setNoseAdjustment] = useState(0);
  const [mouthfeelAdjustment, setMouthfeelAdjustment] = useState(0);
  const [tasteAdjustment, setTasteAdjustment] = useState(0);
  const [finishAdjustment, setFinishAdjustment] = useState(0);
  const [valueAdjustment, setValueAdjustment] = useState(0);
  const [finalNotes, setFinalNotes] = useState('');
  
  // Handle swipe gestures
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentPage < ReviewPage.FinalScores) {
        setSwipeDirection('left');
        nextPage();
      }
    },
    onSwipedRight: () => {
      if (currentPage > ReviewPage.Visual) {
        setSwipeDirection('right');
        prevPage();
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: true,
    delta: 10, // min distance(px) before a swipe starts
    swipeDuration: 500, // max time in ms for a swipe
    touchEventOptions: { passive: true },
  });
  
  // Handle animation end
  useEffect(() => {
    if (swipeDirection) {
      const contentElement = document.getElementById('review-content');
      if (contentElement) {
        const handleAnimationEnd = () => {
          setSwipeDirection(null);
        };
        
        contentElement.addEventListener('animationend', handleAnimationEnd);
        
        return () => {
          contentElement.removeEventListener('animationend', handleAnimationEnd);
        };
      }
    }
  }, [swipeDirection]);

  // Reset function to clear all form values and states
  const resetReview = () => {
    setCurrentPage(ReviewPage.Visual);
    setRating(0);
    setSelectedNoseAromas([]);
    setSelectedTasteFlavors([]);
    setSelectedFinishFlavors([]);
    setNoseAdjustment(0);
    setMouthfeelAdjustment(0);
    setTasteAdjustment(0);
    setFinishAdjustment(0);
    setValueAdjustment(0);
    setFinalNotes('');
    
    // Force clear Value-related fields explicitly
    setTimeout(() => {
      form.setValue('valueScore', undefined);
      form.setValue('valueAvailability', "");
      form.setValue('valueBuyAgain', "");
      form.setValue('valueOccasion', "");
      form.setValue('valueNotes', "");
    }, 0);
    
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
      // Reset flavor profile ratings
      flavorProfileFruitFloral: 0,
      flavorProfileSweet: 0,
      flavorProfileSpice: 0,
      flavorProfileHerbal: 0,
      flavorProfileGrain: 0,
      flavorProfileOak: 0,
      isPublic: false,
      shareId: undefined
    });
  };
  
  const form = useForm<ReviewNote>({
    resolver: zodResolver(reviewNoteSchema),
    defaultValues: {
      rating: 0,
      date: new Date().toISOString().split('T')[0],
      text: "",
      flavor: "",
      id: nanoid(),
      // Legacy fields
      visual: "",
      nose: "",
      mouthfeel: "",
      taste: "",
      finish: "",
      value: "",
      // New detailed fields
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
      // Flavor profile ratings
      flavorProfileFruitFloral: 0,
      flavorProfileSweet: 0,
      flavorProfileSpice: 0,
      flavorProfileHerbal: 0,
      flavorProfileGrain: 0,
      flavorProfileOak: 0,
      // Social features
      isPublic: false,
      shareId: undefined
    },
  });
  
  // Update form when selections change
  useEffect(() => {
    form.setValue('noseAromas', selectedNoseAromas);
  }, [selectedNoseAromas, form]);
  
  useEffect(() => {
    form.setValue('tasteFlavors', selectedTasteFlavors);
  }, [selectedTasteFlavors, form]);
  
  useEffect(() => {
    form.setValue('finishFlavors', selectedFinishFlavors);
  }, [selectedFinishFlavors, form]);
  
  // Helper function to toggle selection in array
  const toggleSelection = (
    array: string[], 
    setter: React.Dispatch<React.SetStateAction<string[]>>, 
    value: string
  ) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  // Calculate progress percentage
  const progressPercentage = (currentPage / pageData.length) * 100;

  const addReviewMutation = useMutation({
    mutationFn: async (data: ReviewNote) => {
      // Generate a comprehensive summary from all the detailed review sections
      const visualSection = [
        `COLOR: ${data.visualColor || 'Not specified'}`,
        `VISCOSITY: ${data.visualViscosity || 'Not specified'}`,
        `CLARITY: ${data.visualClarity || 'Not specified'}`,
        `NOTES: ${data.visualNotes || 'None'}`
      ].join('\n');
      
      const noseSection = [
        `AROMAS: ${data.noseAromas?.join(', ') || 'None selected'}`,
        `SCORE: ${data.noseScore}/5`,
        `NOTES: ${data.noseNotes || 'None'}`
      ].join('\n');
      
      const mouthfeelSection = [
        `ALCOHOL: ${data.mouthfeelAlcohol || 'Not specified'}`,
        `VISCOSITY: ${data.mouthfeelViscosity || 'Not specified'}`,
        `PLEASANTNESS: ${data.mouthfeelPleasantness || 'Not specified'}`,
        `SCORE: ${data.mouthfeelScore}/5`,
        `NOTES: ${data.mouthfeelNotes || 'None'}`
      ].join('\n');
      
      const tasteSection = [
        `FLAVORS: ${data.tasteFlavors?.join(', ') || 'None selected'}`,
        `MATCHES NOSE: ${data.tasteCorrelation ? 'Yes' : 'No'}`,
        `SCORE: ${data.tasteScore}/5`,
        `NOTES: ${data.tasteNotes || 'None'}`
      ].join('\n');
      
      const finishSection = [
        `FLAVORS: ${data.finishFlavors?.join(', ') || 'None selected'}`,
        `MATCHES TASTE: ${data.finishCorrelation ? 'Yes' : 'No'}`,
        `LENGTH: ${data.finishLength || 'Not specified'}`,
        `PLEASANTNESS: ${data.finishPleasantness || 'Not specified'}`,
        `SCORE: ${data.finishScore}/5`,
        `NOTES: ${data.finishNotes || 'None'}`
      ].join('\n');
      
      const valueSection = [
        `PRICE: $${whiskey.price}`,
        `PRICE PER POUR: $${(whiskey.price ? (whiskey.price / 14).toFixed(2) : 'N/A')}`,
        `AVAILABILITY: ${data.valueAvailability || 'Not specified'}`,
        `BUY AGAIN: ${data.valueBuyAgain || 'Not specified'}`,
        `OCCASION: ${data.valueOccasion || 'Not specified'}`,
        `SCORE: ${data.valueScore}/5`,
        `NOTES: ${data.valueNotes || 'None'}`
      ].join('\n');
      
      const flavorProfileSection = [
        `FRUIT/FLORAL: ${data.flavorProfileFruitFloral}/5`,
        `SWEET: ${data.flavorProfileSweet}/5`, 
        `SPICE: ${data.flavorProfileSpice}/5`,
        `HERBAL: ${data.flavorProfileHerbal}/5`,
        `GRAIN: ${data.flavorProfileGrain}/5`,
        `OAK: ${data.flavorProfileOak}/5`
      ].join('\n');
      
      const summary = [
        `## VISUAL ##\n${visualSection}`,
        `## NOSE ##\n${noseSection}`,
        `## MOUTHFEEL ##\n${mouthfeelSection}`,
        `## TASTE ##\n${tasteSection}`,
        `## FINISH ##\n${finishSection}`,
        `## VALUE ##\n${valueSection}`,
        `## FLAVOR PROFILE ##\n${flavorProfileSection}`,
        `## OVERALL ##\n${data.text}`,
        `OVERALL RATING: ${data.rating}/5`
      ].join('\n\n');
      
      // Update the main text field with our comprehensive notes
      data.text = summary;
      
      // Include legacy fields for backward compatibility
      data.visual = `Color: ${data.visualColor}, Viscosity: ${data.visualViscosity}, Clarity: ${data.visualClarity}`;
      data.nose = `Aromas: ${data.noseAromas?.join(', ')} - ${data.noseNotes}`;
      data.mouthfeel = `Alcohol: ${data.mouthfeelAlcohol}, Viscosity: ${data.mouthfeelViscosity}, Pleasantness: ${data.mouthfeelPleasantness}`;
      data.taste = `Flavors: ${data.tasteFlavors?.join(', ')} - ${data.tasteNotes}`;
      data.finish = `Length: ${data.finishLength}, Pleasantness: ${data.finishPleasantness} - ${data.finishNotes}`;
      data.value = `Availability: ${data.valueAvailability}, Buy Again: ${data.valueBuyAgain}, Occasion: ${data.valueOccasion}`;
      
      const response = await apiRequest(
        "POST",
        `/api/whiskeys/${whiskey.id}/reviews`,
        data
      );
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
      toast({
        title: "Review Added",
        description: "Your detailed tasting notes have been saved.",
      });
      
      // Find the newly added review from the returned updated whiskey
      if (data && Array.isArray(data.notes) && data.notes.length > 0) {
        // Get the last (most recently added) review
        const newReview = data.notes[data.notes.length - 1];
        
        // Add console log for debugging
        console.log("New review created:", newReview.id, "type:", typeof newReview.id);
        
        // Close the modal
        onClose();
        
        // Make sure the review ID is properly converted for URL purposes
        const reviewIdForUrl = newReview.id.toString();
        
        // Navigate to the review detail page
        window.location.href = `/whiskey/${data.id}/review/${reviewIdForUrl}`;
      } else {
        // Fallback if review not found in response
        form.reset();
        setCurrentPage(ReviewPage.Visual);
        onClose();
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

  // Calculate weighted scores
  const calculateWeightedScores = () => {
    // Get all scores with fallback to 0 for undefined values
    const noseScore = Number(form.getValues('noseScore')) || 0;
    const mouthfeelScore = Number(form.getValues('mouthfeelScore')) || 0;
    const tasteScore = Number(form.getValues('tasteScore')) || 0;
    const finishScore = Number(form.getValues('finishScore')) || 0;
    const valueScore = Number(form.getValues('valueScore')) || 0;
    
    // Calculate individual weighted scores
    const noseWeighted = noseScore * 1.5;
    const mouthfeelWeighted = mouthfeelScore * 2.0;
    const tasteWeighted = tasteScore * 3.0;
    const finishWeighted = finishScore * 2.5;
    const valueWeighted = valueScore * 1.0;
    
    // Calculate total weighted score
    const weightedTotal = noseWeighted + mouthfeelWeighted + tasteWeighted + finishWeighted + valueWeighted;
    
    // Calculate 5-star score (weighted total / 10)
    const fiveStarScore = weightedTotal / 10;
    
    // Calculate final score (weighted total * 2)
    const finalScore = weightedTotal * 2;
    
    return {
      nose: parseFloat(noseWeighted.toFixed(1)),
      mouthfeel: parseFloat(mouthfeelWeighted.toFixed(1)),
      taste: parseFloat(tasteWeighted.toFixed(1)),
      finish: parseFloat(finishWeighted.toFixed(1)),
      value: parseFloat(valueWeighted.toFixed(1)),
      weightedTotal: parseFloat(weightedTotal.toFixed(1)),
      fiveStarScore: parseFloat(fiveStarScore.toFixed(1)),
      finalScore: Math.round(finalScore)
    };
  };
  
  // Reference to dialog content div for scrolling
  const dialogContentRef = useRef<HTMLDivElement>(null);
  
  // Scroll to top of dialog content
  const scrollToTop = () => {
    if (dialogContentRef.current) {
      // Reset all possible scroll positions
      dialogContentRef.current.scrollTop = 0;
      
      // Get the form element which is now scrollable
      const formElement = dialogContentRef.current.querySelector('form');
      if (formElement) {
        formElement.scrollTop = 0;
      }
      
      // Also try to find the content by ID
      const contentElement = document.getElementById('review-content');
      if (contentElement) {
        contentElement.scrollTop = 0;
      }
      
      // Additionally force scroll to top after a short delay
      setTimeout(() => {
        if (formElement) formElement.scrollTop = 0;
        if (dialogContentRef.current) dialogContentRef.current.scrollTop = 0;
      }, 50);
    }
  };

  // Handle page navigation
  const handleNext = () => {
    if (currentPage < ReviewPage.FinalScores) {
      // Going to Summary page, clear the text field
      if (currentPage === ReviewPage.Value) {
        form.setValue('text', '');
      }
      
      // If we're on the Summary page, set the initial rating based on weighted calculations
      if (currentPage === ReviewPage.Summary) {
        // Calculate the weighted scores and set the initial rating
        const scores = calculateWeightedScores();
        // Use the 5-star score for the initial rating
        setRating(scores.fiveStarScore);
      }
      
      // Go to the next page
      setCurrentPage(prevPage => (prevPage + 1) as ReviewPage);
      
      // Scroll to top after state update with a longer delay to ensure the DOM has updated
      setTimeout(scrollToTop, 100);
    }
  };

  const handlePrevious = () => {
    if (currentPage > ReviewPage.Visual) {
      setCurrentPage(prevPage => (prevPage - 1) as ReviewPage);
      
      // Scroll to top after state update with a longer delay to ensure the DOM has updated
      setTimeout(scrollToTop, 100);
    }
  };
  
  // Alias functions for backward compatibility
  const nextPage = handleNext;
  const prevPage = handlePrevious;

  const onSubmit = (data: ReviewNote) => {
    console.log("Form submission triggered, current page:", currentPage, "FinalScores page:", ReviewPage.FinalScores);
    
    // If we're not on the final page, prevent form submission and go to next page instead
    if (currentPage !== ReviewPage.FinalScores) {
      nextPage();
      // Returning false prevents the default form submission behavior
      return false;
    }
    
    // We are on the final page, proceed with form submission
    // Calculate the final weighted scores with adjustments
    const scores = calculateWeightedScores();
    
    // Use the scores calculated by the calculateWeightedScores function
    const weightedTotal = scores.weightedTotal;
    const fiveStarScore = scores.fiveStarScore;
    const finalScore = scores.finalScore;
    
    // Set the overall rating (now using 5-star score for rating)
    data.rating = fiveStarScore;
    
    // Add the final adjustment notes to the review
    if (finalNotes) {
      data.text = data.text ? `${data.text}\n\nFINAL NOTES: ${finalNotes}` : `FINAL NOTES: ${finalNotes}`;
    }
    
    // Get base scores
    const noseScore = Number(form.getValues('noseScore')) || 0;
    const mouthfeelScore = Number(form.getValues('mouthfeelScore')) || 0;
    const tasteScore = Number(form.getValues('tasteScore')) || 0;
    const finishScore = Number(form.getValues('finishScore')) || 0;
    const valueScore = Number(form.getValues('valueScore')) || 0;
    
    // Add weighted scores to the review text
    const weightedScoresText = [
      `WEIGHTED SCORES:`,
      `- Nose: ${noseScore} × 1.5 = ${scores.nose}/7.5`,
      `- Mouth Feel: ${mouthfeelScore} × 2.0 = ${scores.mouthfeel}/10`,
      `- Taste: ${tasteScore} × 3.0 = ${scores.taste}/15`,
      `- Finish: ${finishScore} × 2.5 = ${scores.finish}/12.5`,
      `- Value: ${valueScore} × 1.0 = ${scores.value}/5`,
      `- Weighted Total: ${weightedTotal}/50`,
      `- 5-Star Score: ${fiveStarScore}/5 (Weighted Total ÷ 10)`,
      `- Final Score: ${finalScore}/100 (Weighted Total × 2)`
    ].join('\n');
    
    // Append the weighted scores to the review text
    data.text = data.text ? `${data.text}\n\n${weightedScoresText}` : weightedScoresText;
    
    // Submit the review
    addReviewMutation.mutate(data);
  };

  // Render content based on current page
  const renderPageContent = () => {
    switch(currentPage) {
      case ReviewPage.Visual:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="section-header">Color</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <FormField
                    key={color.value}
                    control={form.control}
                    name="visualColor"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={color.value} id={`color-${color.value}`} />
                              <Label 
                                htmlFor={`color-${color.value}`}
                                className="flex items-center cursor-pointer"
                              >
                                <div 
                                  className="w-4 h-4 rounded-full mr-2" 
                                  style={{ backgroundColor: color.hex }}
                                ></div>
                                <span className="text-sm">{color.label}</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="section-header">Viscosity</h3>
              <FormField
                control={form.control}
                name="visualViscosity"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {VISCOSITY_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`viscosity-${option.value}`} />
                              <Label htmlFor={`viscosity-${option.value}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <h3 className="section-header">Clarity</h3>
              <FormField
                control={form.control}
                name="visualClarity"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {CLARITY_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`clarity-${option.value}`} />
                              <Label htmlFor={`clarity-${option.value}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
                      placeholder="Any additional observations about the visual appearance..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case ReviewPage.Nose:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="section-header">Aromas</h3>
              <p className="text-sm text-gray-500 mb-2">Select all aromas that you detect (select multiple as needed)</p>
              
              <div className="space-y-4">
                {/* Sweet Aromas */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Sweet</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.sweet.map((aroma) => (
                      <div key={aroma.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`nose-${aroma.value}`} 
                          checked={selectedNoseAromas.includes(aroma.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedNoseAromas, 
                            setSelectedNoseAromas, 
                            aroma.value
                          )}
                        />
                        <Label htmlFor={`nose-${aroma.value}`} className="text-sm">{aroma.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Spice Aromas */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Spice</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.spice.map((aroma) => (
                      <div key={aroma.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`nose-${aroma.value}`} 
                          checked={selectedNoseAromas.includes(aroma.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedNoseAromas, 
                            setSelectedNoseAromas, 
                            aroma.value
                          )}
                        />
                        <Label htmlFor={`nose-${aroma.value}`} className="text-sm">{aroma.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Fruit Aromas */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Fruit</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.fruit.map((aroma) => (
                      <div key={aroma.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`nose-${aroma.value}`} 
                          checked={selectedNoseAromas.includes(aroma.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedNoseAromas, 
                            setSelectedNoseAromas, 
                            aroma.value
                          )}
                        />
                        <Label htmlFor={`nose-${aroma.value}`} className="text-sm">{aroma.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Wood Aromas */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Wood</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.wood.map((aroma) => (
                      <div key={aroma.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`nose-${aroma.value}`} 
                          checked={selectedNoseAromas.includes(aroma.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedNoseAromas, 
                            setSelectedNoseAromas, 
                            aroma.value
                          )}
                        />
                        <Label htmlFor={`nose-${aroma.value}`} className="text-sm">{aroma.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Grain Aromas */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Grain</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.grain.map((aroma) => (
                      <div key={aroma.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`nose-${aroma.value}`} 
                          checked={selectedNoseAromas.includes(aroma.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedNoseAromas, 
                            setSelectedNoseAromas, 
                            aroma.value
                          )}
                        />
                        <Label htmlFor={`nose-${aroma.value}`} className="text-sm">{aroma.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="section-header">Nose Score (1-5)</h3>
              <FormField
                control={form.control}
                name="noseScore"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                        className="flex justify-between"
                      >
                        {SCORE_OPTIONS.map((score) => (
                          <div key={score.value} className="flex flex-col items-center">
                            <RadioGroupItem value={score.value.toString()} id={`nose-score-${score.value}`} />
                            <Label htmlFor={`nose-score-${score.value}`} className="text-xs mt-1">{score.value}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="noseNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional observations about the aroma..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case ReviewPage.MouthFeel:
        return (
          <div className="space-y-6">
            {/* Alcohol Feel */}
            <div>
              <h3 className="section-header">Alcohol Feel</h3>
              <FormField
                control={form.control}
                name="mouthfeelAlcohol"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {ALCOHOL_FEEL_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`alcohol-${option.value}`} />
                              <Label htmlFor={`alcohol-${option.value}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Mouthfeel Viscosity */}
            <div>
              <h3 className="section-header">Viscosity</h3>
              <FormField
                control={form.control}
                name="mouthfeelViscosity"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {MOUTHFEEL_VISCOSITY_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`mouthfeel-viscosity-${option.value}`} />
                              <Label htmlFor={`mouthfeel-viscosity-${option.value}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Pleasantness */}
            <div>
              <h3 className="section-header">Pleasantness</h3>
              <FormField
                control={form.control}
                name="mouthfeelPleasantness"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {PLEASANTNESS_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`pleasantness-${option.value}`} />
                              <Label htmlFor={`pleasantness-${option.value}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Score */}
            <div>
              <h3 className="section-header">Mouthfeel Score (1-5)</h3>
              <FormField
                control={form.control}
                name="mouthfeelScore"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                        className="flex justify-between"
                      >
                        {SCORE_OPTIONS.map((score) => (
                          <div key={score.value} className="flex flex-col items-center">
                            <RadioGroupItem value={score.value.toString()} id={`mouthfeel-score-${score.value}`} />
                            <Label htmlFor={`mouthfeel-score-${score.value}`} className="text-xs mt-1">{score.value}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="mouthfeelNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional observations about the mouthfeel..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case ReviewPage.Taste:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="section-header">Flavors</h3>
              <p className="text-sm text-gray-500 mb-2">Select all flavors that you detect (select multiple as needed)</p>
              
              <div className="space-y-4">
                {/* Sweet Flavors */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Sweet</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.sweet.map((flavor) => (
                      <div key={flavor.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`taste-${flavor.value}`} 
                          checked={selectedTasteFlavors.includes(flavor.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedTasteFlavors, 
                            setSelectedTasteFlavors, 
                            flavor.value
                          )}
                        />
                        <Label htmlFor={`taste-${flavor.value}`} className="text-sm">{flavor.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Spice Flavors */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Spice</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.spice.map((flavor) => (
                      <div key={flavor.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`taste-${flavor.value}`} 
                          checked={selectedTasteFlavors.includes(flavor.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedTasteFlavors, 
                            setSelectedTasteFlavors, 
                            flavor.value
                          )}
                        />
                        <Label htmlFor={`taste-${flavor.value}`} className="text-sm">{flavor.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Fruit Flavors */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Fruit</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.fruit.map((flavor) => (
                      <div key={flavor.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`taste-${flavor.value}`} 
                          checked={selectedTasteFlavors.includes(flavor.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedTasteFlavors, 
                            setSelectedTasteFlavors, 
                            flavor.value
                          )}
                        />
                        <Label htmlFor={`taste-${flavor.value}`} className="text-sm">{flavor.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Wood Flavors */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Wood</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.wood.map((flavor) => (
                      <div key={flavor.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`taste-${flavor.value}`} 
                          checked={selectedTasteFlavors.includes(flavor.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedTasteFlavors, 
                            setSelectedTasteFlavors, 
                            flavor.value
                          )}
                        />
                        <Label htmlFor={`taste-${flavor.value}`} className="text-sm">{flavor.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Grain Flavors */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Grain</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.grain.map((flavor) => (
                      <div key={flavor.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`taste-${flavor.value}`} 
                          checked={selectedTasteFlavors.includes(flavor.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedTasteFlavors, 
                            setSelectedTasteFlavors, 
                            flavor.value
                          )}
                        />
                        <Label htmlFor={`taste-${flavor.value}`} className="text-sm">{flavor.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Correlation with Nose */}
            <div>
              <h3 className="section-header">Correlation with Nose</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  {selectedNoseAromas.length > 0 ? (
                    <div>
                      <p className="font-medium">Detected Aromas:</p>
                      <p>{selectedNoseAromas.map(aroma => {
                        // Find the label for this aroma value
                        const category = Object.keys(AROMA_FLAVOR_OPTIONS).find(cat => 
                          AROMA_FLAVOR_OPTIONS[cat as keyof typeof AROMA_FLAVOR_OPTIONS]
                            .some(a => a.value === aroma)
                        );
                        
                        if (category) {
                          const aromaObj = AROMA_FLAVOR_OPTIONS[category as keyof typeof AROMA_FLAVOR_OPTIONS]
                            .find(a => a.value === aroma);
                          return aromaObj?.label;
                        }
                        return aroma;
                      }).join(', ')}</p>
                    </div>
                  ) : (
                    <p>No aromas were selected in the Nose section</p>
                  )}
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="tasteCorrelation"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="taste-correlation"
                        />
                      </FormControl>
                      <Label 
                        htmlFor="taste-correlation"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        The taste correlates with the nose
                      </Label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Score */}
            <div>
              <h3 className="section-header">Taste Score (1-5)</h3>
              <FormField
                control={form.control}
                name="tasteScore"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                        className="flex justify-between"
                      >
                        {SCORE_OPTIONS.map((score) => (
                          <div key={score.value} className="flex flex-col items-center">
                            <RadioGroupItem value={score.value.toString()} id={`taste-score-${score.value}`} />
                            <Label htmlFor={`taste-score-${score.value}`} className="text-xs mt-1">{score.value}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="tasteNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional observations about the taste..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case ReviewPage.Finish:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="section-header">Finish Flavors</h3>
              <p className="text-sm text-gray-500 mb-2">Select all flavors that linger in the finish</p>
              
              <div className="space-y-4">
                {/* Sweet Flavors */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Sweet</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.sweet.map((flavor) => (
                      <div key={flavor.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`finish-${flavor.value}`} 
                          checked={selectedFinishFlavors.includes(flavor.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedFinishFlavors, 
                            setSelectedFinishFlavors, 
                            flavor.value
                          )}
                        />
                        <Label htmlFor={`finish-${flavor.value}`} className="text-sm">{flavor.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Spice Flavors */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Spice</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.spice.map((flavor) => (
                      <div key={flavor.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`finish-${flavor.value}`} 
                          checked={selectedFinishFlavors.includes(flavor.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedFinishFlavors, 
                            setSelectedFinishFlavors, 
                            flavor.value
                          )}
                        />
                        <Label htmlFor={`finish-${flavor.value}`} className="text-sm">{flavor.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Fruit Flavors */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Fruit</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.fruit.map((flavor) => (
                      <div key={flavor.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`finish-${flavor.value}`} 
                          checked={selectedFinishFlavors.includes(flavor.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedFinishFlavors, 
                            setSelectedFinishFlavors, 
                            flavor.value
                          )}
                        />
                        <Label htmlFor={`finish-${flavor.value}`} className="text-sm">{flavor.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Wood Flavors */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Wood</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.wood.map((flavor) => (
                      <div key={flavor.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`finish-${flavor.value}`} 
                          checked={selectedFinishFlavors.includes(flavor.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedFinishFlavors, 
                            setSelectedFinishFlavors, 
                            flavor.value
                          )}
                        />
                        <Label htmlFor={`finish-${flavor.value}`} className="text-sm">{flavor.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Grain Flavors */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Grain</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AROMA_FLAVOR_OPTIONS.grain.map((flavor) => (
                      <div key={flavor.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`finish-${flavor.value}`} 
                          checked={selectedFinishFlavors.includes(flavor.value)}
                          onCheckedChange={() => toggleSelection(
                            selectedFinishFlavors, 
                            setSelectedFinishFlavors, 
                            flavor.value
                          )}
                        />
                        <Label htmlFor={`finish-${flavor.value}`} className="text-sm">{flavor.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Correlation with Taste */}
            <div>
              <h3 className="section-header">Correlation with Taste</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  {selectedTasteFlavors.length > 0 ? (
                    <div>
                      <p className="font-medium">Detected Taste Flavors:</p>
                      <p>{selectedTasteFlavors.map(flavor => {
                        // Find the label for this flavor value
                        const category = Object.keys(AROMA_FLAVOR_OPTIONS).find(cat => 
                          AROMA_FLAVOR_OPTIONS[cat as keyof typeof AROMA_FLAVOR_OPTIONS]
                            .some(f => f.value === flavor)
                        );
                        
                        if (category) {
                          const flavorObj = AROMA_FLAVOR_OPTIONS[category as keyof typeof AROMA_FLAVOR_OPTIONS]
                            .find(f => f.value === flavor);
                          return flavorObj?.label;
                        }
                        return flavor;
                      }).join(', ')}</p>
                    </div>
                  ) : (
                    <p>No flavors were selected in the Taste section</p>
                  )}
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="finishCorrelation"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="finish-correlation"
                        />
                      </FormControl>
                      <Label 
                        htmlFor="finish-correlation"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        The finish correlates with the taste
                      </Label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Finish Length */}
            <div>
              <h3 className="section-header">Finish Length</h3>
              <FormField
                control={form.control}
                name="finishLength"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {FINISH_LENGTH_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`length-${option.value}`} />
                              <Label htmlFor={`length-${option.value}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Finish Pleasantness */}
            <div>
              <h3 className="section-header">Finish Pleasantness</h3>
              <FormField
                control={form.control}
                name="finishPleasantness"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {PLEASANTNESS_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`finish-pleasantness-${option.value}`} />
                              <Label htmlFor={`finish-pleasantness-${option.value}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Score */}
            <div>
              <h3 className="section-header">Finish Score (1-5)</h3>
              <FormField
                control={form.control}
                name="finishScore"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString() || ""}
                        className="flex justify-between"
                      >
                        {SCORE_OPTIONS.map((score) => (
                          <div key={score.value} className="flex flex-col items-center">
                            <RadioGroupItem value={score.value.toString()} id={`finish-score-${score.value}`} />
                            <Label htmlFor={`finish-score-${score.value}`} className="text-xs mt-1">{score.value}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="finishNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional observations about the finish..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case ReviewPage.Value:
        return (
          <div className="space-y-6">
            {/* Price Display */}
            <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
              <h3 className="font-medium">Bottle Price</h3>
              <div className="text-2xl font-bold">${whiskey.price ? whiskey.price.toFixed(2) : 'N/A'}</div>
              
              <h3 className="font-medium mt-4">Price Per Pour</h3>
              <div className="text-xl font-medium">
                ${whiskey.price ? (whiskey.price / 14).toFixed(2) : 'N/A'}
                <span className="text-sm text-muted-foreground ml-2">(Bottle price ÷ 14)</span>
              </div>
            </div>
            
            {/* Availability */}
            <div>
              <h3 className="section-header">Availability</h3>
              <FormField
                control={form.control}
                name="valueAvailability"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                        className="flex flex-col space-y-1"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {AVAILABILITY_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`availability-${option.value}`} />
                              <Label htmlFor={`availability-${option.value}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Buy Again */}
            <div>
              <h3 className="section-header">Would You Buy Again?</h3>
              <FormField
                control={form.control}
                name="valueBuyAgain"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                        className="flex flex-col space-y-1"
                      >
                        <div className="grid grid-cols-1 gap-2">
                          {BUY_AGAIN_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`buy-again-${option.value}`} />
                              <Label htmlFor={`buy-again-${option.value}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Occasion */}
            <div>
              <h3 className="section-header">Occasion</h3>
              <FormField
                control={form.control}
                name="valueOccasion"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                        className="flex flex-col space-y-1"
                      >
                        <div className="grid grid-cols-1 gap-2">
                          {OCCASION_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`occasion-${option.value}`} />
                              <Label htmlFor={`occasion-${option.value}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Score */}
            <div>
              <h3 className="section-header">Value Score (1-5)</h3>
              <FormField
                control={form.control}
                name="valueScore"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString() || ""}
                        className="flex justify-between"
                      >
                        {SCORE_OPTIONS.map((score) => (
                          <div key={score.value} className="flex flex-col items-center">
                            <RadioGroupItem value={score.value.toString()} id={`value-score-${score.value}`} />
                            <Label htmlFor={`value-score-${score.value}`} className="text-xs mt-1">{score.value}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="valueNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional thoughts on the value of this whiskey..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case ReviewPage.Summary:
        return (
          <>
            {/* Sharing Options */}
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Share2 className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-800">Share This Review</h3>
                </div>
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm text-gray-600">Make public</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-sm text-blue-600 mt-2">
                {form.watch("isPublic") 
                  ? "This review will be shared with other users. They will be able to like and comment on it." 
                  : "This review is private. Only you can see it."}
              </p>
            </div>
            
            {/* Review Summary */}
            <div className="mb-6 bg-secondary/20 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Review Summary</h3>
              
              <div className="grid gap-4">
                {/* Nose */}
                <div className="border-b pb-3 border-[#D9C4A3] last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-[#7d5936]">Nose:</h4>
                    <span className="text-[#794E2F] font-bold">{form.getValues('noseScore')}/5</span>
                  </div>
                  <div className="flex justify-end">
                    <StarRating 
                      rating={Number(form.getValues('noseScore')) || 0} 
                      maxRating={5}
                      size="md"
                    />
                  </div>
                </div>
                
                {/* Mouthfeel */}
                <div className="border-b pb-3 border-[#D9C4A3] last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-[#7d5936]">Mouthfeel:</h4>
                    <span className="text-[#794E2F] font-bold">{form.getValues('mouthfeelScore')}/5</span>
                  </div>
                  <div className="flex justify-end">
                    <StarRating 
                      rating={Number(form.getValues('mouthfeelScore')) || 0} 
                      maxRating={5}
                      size="md"
                    />
                  </div>
                </div>
                
                {/* Taste */}
                <div className="border-b pb-3 border-[#D9C4A3] last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-[#7d5936]">Taste:</h4>
                    <span className="text-[#794E2F] font-bold">{form.getValues('tasteScore')}/5</span>
                  </div>
                  <div className="flex justify-end">
                    <StarRating 
                      rating={Number(form.getValues('tasteScore')) || 0} 
                      maxRating={5}
                      size="md"
                    />
                  </div>
                </div>
                
                {/* Finish */}
                <div className="border-b pb-3 border-[#D9C4A3] last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-[#7d5936]">Finish:</h4>
                    <span className="text-[#794E2F] font-bold">{form.getValues('finishScore')}/5</span>
                  </div>
                  <div className="flex justify-end">
                    <StarRating 
                      rating={Number(form.getValues('finishScore')) || 0} 
                      maxRating={5}
                      size="md"
                    />
                  </div>
                </div>
                
                {/* Value */}
                <div className="border-b pb-3 border-[#D9C4A3] last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-[#7d5936]">Value:</h4>
                    <span className="text-[#794E2F] font-bold">{form.getValues('valueScore')}/5</span>
                  </div>
                  <div className="flex justify-end">
                    <StarRating 
                      rating={Number(form.getValues('valueScore')) || 0} 
                      maxRating={5}
                      size="md"
                    />
                  </div>
                </div>
              </div>
            </div>
            

            
            {/* Overall Impression */}
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Impression</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide your final thoughts and summary of this whiskey..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Final Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <h3 className="section-header">Flavor Profile</h3>
                <p className="text-sm text-muted-foreground mb-3">Rate each flavor characteristic from 0 to 5</p>
                
                {/* Fruit/Floral */}
                <div className="mb-2">
                  <FormField
                    control={form.control}
                    name="flavorProfileFruitFloral"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-1">
                          <FormLabel className="text-[#7d5936]">Fruit/Floral</FormLabel>
                          <span className="text-sm">{field.value || 0}/5</span>
                        </div>
                        <FormControl>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={field.value || 0}
                            onChange={field.onChange}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Sweet */}
                <div className="mb-2">
                  <FormField
                    control={form.control}
                    name="flavorProfileSweet"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-1">
                          <FormLabel className="text-[#7d5936]">Sweet</FormLabel>
                          <span className="text-sm">{field.value || 0}/5</span>
                        </div>
                        <FormControl>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={field.value || 0}
                            onChange={field.onChange}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Spice */}
                <div className="mb-2">
                  <FormField
                    control={form.control}
                    name="flavorProfileSpice"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-1">
                          <FormLabel className="text-[#7d5936]">Spice</FormLabel>
                          <span className="text-sm">{field.value || 0}/5</span>
                        </div>
                        <FormControl>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={field.value || 0}
                            onChange={field.onChange}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Herbal */}
                <div className="mb-2">
                  <FormField
                    control={form.control}
                    name="flavorProfileHerbal"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-1">
                          <FormLabel className="text-[#7d5936]">Herbal</FormLabel>
                          <span className="text-sm">{field.value || 0}/5</span>
                        </div>
                        <FormControl>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={field.value || 0}
                            onChange={field.onChange}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Grain */}
                <div className="mb-2">
                  <FormField
                    control={form.control}
                    name="flavorProfileGrain"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-1">
                          <FormLabel className="text-[#7d5936]">Grain</FormLabel>
                          <span className="text-sm">{field.value || 0}/5</span>
                        </div>
                        <FormControl>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={field.value || 0}
                            onChange={field.onChange}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Oak */}
                <div className="mb-2">
                  <FormField
                    control={form.control}
                    name="flavorProfileOak"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-1">
                          <FormLabel className="text-[#7d5936]">Oak</FormLabel>
                          <span className="text-sm">{field.value || 0}/5</span>
                        </div>
                        <FormControl>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={field.value || 0}
                            onChange={field.onChange}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Review Serial Number */}
            <div className="bg-secondary/20 p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Review Serial Number:</h4>
                  <p className="text-xs text-muted-foreground">Each bottle can have multiple reviews</p>
                </div>
                <div className="bg-primary-foreground px-3 py-1 rounded font-mono text-sm">
                  {form.getValues('id') || nanoid().substring(0, 8)}
                </div>
              </div>
            </div>
          </>
        );
      case ReviewPage.FinalScores:
        const weightedScores = calculateWeightedScores();
        const totalScore = weightedScores.nose + weightedScores.mouthfeel + 
                          weightedScores.taste + weightedScores.finish + 
                          weightedScores.value;
        const finalRating = parseFloat((totalScore / 10.5).toFixed(1));
        
        // Get flavor profile values from form
        const flavorProfile = {
          fruitFloral: form.getValues('flavorProfileFruitFloral') || 0,
          sweet: form.getValues('flavorProfileSweet') || 0, 
          spice: form.getValues('flavorProfileSpice') || 0,
          herbal: form.getValues('flavorProfileHerbal') || 0,
          grain: form.getValues('flavorProfileGrain') || 0,
          oak: form.getValues('flavorProfileOak') || 0
        };
        
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-[#7d5936] mb-2">Final Score</h3>
              <div className="flex justify-center items-center">
                <StarRating rating={finalRating} size="lg" />
              </div>
            </div>
            
            <div className="bg-[#F5EFE0] p-4 rounded-lg border border-[#D9C4A3]">
              <h3 className="text-lg font-bold text-[#7d5936] mb-4">Flavor Profile</h3>
              <div className="mb-4">
                <RadarChart flavorProfile={flavorProfile} size={250} className="mb-2" />
              </div>
            </div>
            
            <div className="bg-[#F5EFE0] p-4 rounded-lg border border-[#D9C4A3]">
              <h3 className="text-lg font-bold text-[#7d5936] mb-4">Adjustments</h3>
              
              <div className="space-y-4">
                {/* Nose Score */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-[#794E2F]">Nose (×1.5)</span>
                    <span className="text-[#986A44] font-medium">{(weightedScores.nose * 2).toFixed(1)} pts</span>
                  </div>
                  <div className="flex items-center">
                    <button 
                      className="p-1 bg-[#E8D9BD] hover:bg-[#D9C4A3] rounded-l-md border border-[#D9C4A3]"
                      onClick={() => setNoseAdjustment(prev => Math.max(prev - 0.5, -2.5))}
                      type="button"
                    >
                      −0.5
                    </button>
                    <div className="flex-1 h-2 mx-1 bg-[#E8D9BD] relative">
                      <div 
                        className="absolute h-full bg-[#986A44]" 
                        style={{ width: `${(weightedScores.nose / 7.5) * 100}%` }}
                      ></div>
                    </div>
                    <button 
                      className="p-1 bg-[#E8D9BD] hover:bg-[#D9C4A3] rounded-r-md border border-[#D9C4A3]"
                      onClick={() => setNoseAdjustment(prev => Math.min(prev + 0.5, 2.5))}
                      type="button"
                    >
                      +0.5
                    </button>
                  </div>
                  {noseAdjustment !== 0 && (
                    <div className="text-xs text-[#986A44] mt-1">
                      Adjustment: {noseAdjustment > 0 ? "+" : ""}{noseAdjustment}
                    </div>
                  )}
                </div>
                
                {/* Mouthfeel Score */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-[#794E2F]">Mouthfeel (×2.0)</span>
                    <span className="text-[#986A44] font-medium">{(weightedScores.mouthfeel * 2).toFixed(1)} pts</span>
                  </div>
                  <div className="flex items-center">
                    <button 
                      className="p-1 bg-[#E8D9BD] hover:bg-[#D9C4A3] rounded-l-md border border-[#D9C4A3]"
                      onClick={() => setMouthfeelAdjustment(prev => Math.max(prev - 0.5, -2.5))}
                      type="button"
                    >
                      −0.5
                    </button>
                    <div className="flex-1 h-2 mx-1 bg-[#E8D9BD] relative">
                      <div 
                        className="absolute h-full bg-[#986A44]" 
                        style={{ width: `${(weightedScores.mouthfeel / 10) * 100}%` }}
                      ></div>
                    </div>
                    <button 
                      className="p-1 bg-[#E8D9BD] hover:bg-[#D9C4A3] rounded-r-md border border-[#D9C4A3]"
                      onClick={() => setMouthfeelAdjustment(prev => Math.min(prev + 0.5, 2.5))}
                      type="button"
                    >
                      +0.5
                    </button>
                  </div>
                  {mouthfeelAdjustment !== 0 && (
                    <div className="text-xs text-[#986A44] mt-1">
                      Adjustment: {mouthfeelAdjustment > 0 ? "+" : ""}{mouthfeelAdjustment}
                    </div>
                  )}
                </div>
                
                {/* Taste Score */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-[#794E2F]">Taste (×3.0)</span>
                    <span className="text-[#986A44] font-medium">{(weightedScores.taste * 2).toFixed(1)} pts</span>
                  </div>
                  <div className="flex items-center">
                    <button 
                      className="p-1 bg-[#E8D9BD] hover:bg-[#D9C4A3] rounded-l-md border border-[#D9C4A3]"
                      onClick={() => setTasteAdjustment(prev => Math.max(prev - 0.5, -2.5))}
                      type="button"
                    >
                      −0.5
                    </button>
                    <div className="flex-1 h-2 mx-1 bg-[#E8D9BD] relative">
                      <div 
                        className="absolute h-full bg-[#986A44]" 
                        style={{ width: `${(weightedScores.taste / 15) * 100}%` }}
                      ></div>
                    </div>
                    <button 
                      className="p-1 bg-[#E8D9BD] hover:bg-[#D9C4A3] rounded-r-md border border-[#D9C4A3]"
                      onClick={() => setTasteAdjustment(prev => Math.min(prev + 0.5, 2.5))}
                      type="button"
                    >
                      +0.5
                    </button>
                  </div>
                  {tasteAdjustment !== 0 && (
                    <div className="text-xs text-[#986A44] mt-1">
                      Adjustment: {tasteAdjustment > 0 ? "+" : ""}{tasteAdjustment}
                    </div>
                  )}
                </div>
                
                {/* Finish Score */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-[#794E2F]">Finish (×2.5)</span>
                    <span className="text-[#986A44] font-medium">{(weightedScores.finish * 2).toFixed(1)} pts</span>
                  </div>
                  <div className="flex items-center">
                    <button 
                      className="p-1 bg-[#E8D9BD] hover:bg-[#D9C4A3] rounded-l-md border border-[#D9C4A3]"
                      onClick={() => setFinishAdjustment(prev => Math.max(prev - 0.5, -2.5))}
                      type="button"
                    >
                      −0.5
                    </button>
                    <div className="flex-1 h-2 mx-1 bg-[#E8D9BD] relative">
                      <div 
                        className="absolute h-full bg-[#986A44]" 
                        style={{ width: `${(weightedScores.finish / 12.5) * 100}%` }}
                      ></div>
                    </div>
                    <button 
                      className="p-1 bg-[#E8D9BD] hover:bg-[#D9C4A3] rounded-r-md border border-[#D9C4A3]"
                      onClick={() => setFinishAdjustment(prev => Math.min(prev + 0.5, 2.5))}
                      type="button"
                    >
                      +0.5
                    </button>
                  </div>
                  {finishAdjustment !== 0 && (
                    <div className="text-xs text-[#986A44] mt-1">
                      Adjustment: {finishAdjustment > 0 ? "+" : ""}{finishAdjustment}
                    </div>
                  )}
                </div>
                
                {/* Value Score */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-[#794E2F]">Value (×1.0)</span>
                    <span className="text-[#986A44] font-medium">{(weightedScores.value * 2).toFixed(1)} pts</span>
                  </div>
                  <div className="flex items-center">
                    <button 
                      className="p-1 bg-[#E8D9BD] hover:bg-[#D9C4A3] rounded-l-md border border-[#D9C4A3]"
                      onClick={() => setValueAdjustment(prev => Math.max(prev - 0.5, -2.5))}
                      type="button"
                    >
                      −0.5
                    </button>
                    <div className="flex-1 h-2 mx-1 bg-[#E8D9BD] relative">
                      <div 
                        className="absolute h-full bg-[#986A44]" 
                        style={{ width: `${(weightedScores.value / 5.0) * 100}%` }}
                      ></div>
                    </div>
                    <button 
                      className="p-1 bg-[#E8D9BD] hover:bg-[#D9C4A3] rounded-r-md border border-[#D9C4A3]"
                      onClick={() => setValueAdjustment(prev => Math.min(prev + 0.5, 2.5))}
                      type="button"
                    >
                      +0.5
                    </button>
                  </div>
                  {valueAdjustment !== 0 && (
                    <div className="text-xs text-[#986A44] mt-1">
                      Adjustment: {valueAdjustment > 0 ? "+" : ""}{valueAdjustment}
                    </div>
                  )}
                </div>
                
                {/* Final Scores */}
                <div className="border-t border-[#D9C4A3] pt-3 mt-4">
                  {/* 5-Star Score with Star Images */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium text-[#593D25] text-lg">Final Rating</span>
                  </div>
                  <div className="flex justify-center items-center mb-4">
                    <StarRating 
                      rating={calculateWeightedScores().fiveStarScore} 
                      maxRating={5}
                      size="lg"
                    />
                  </div>
                  
                  <div className="text-center">
                    <span className="text-[#794E2F] font-bold text-xl">
                      {calculateWeightedScores().fiveStarScore.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional notes for final adjustment */}
            <div className="mt-6 bg-white p-4 rounded-lg border border-gray-300">
              <label className="block text-base font-bold text-gray-900 mb-2">
                Additional Notes
              </label>
              <p className="text-sm text-gray-600 mb-2">Add any final thoughts or comments about this whiskey.</p>
              <textarea
                value={finalNotes}
                onChange={(e) => setFinalNotes(e.target.value)}
                placeholder="Notes on bottle rarity, special occasions, personal preferences, etc..."
                className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800 min-h-[100px] focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Reset all form values when the dialog is opened
  useEffect(() => {
    if (isOpen) {
      // Always reset the review completely when opening the dialog
      resetReview();
      
      // Additional explicit reset for Value fields to ensure they are properly cleared
      // We need to set these to empty strings rather than undefined for radio groups
      form.setValue('valueAvailability', '');
      form.setValue('valueBuyAgain', '');
      form.setValue('valueOccasion', '');
      form.setValue('valueScore', undefined);
      form.setValue('valueNotes', '');
      
      // Force reset scroll position with a delay to ensure the modal is fully rendered
      setTimeout(() => {
        scrollToTop();
        // Double check with a longer delay
        setTimeout(scrollToTop, 150);
      }, 50);
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md dialog-content overflow-hidden max-h-[90vh] flex flex-col" ref={dialogContentRef}>
        <div className="sticky top-0 bg-white z-10 pb-2">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Review Whiskey - {pageData[currentPage].title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center mb-4">
            <h4 className="font-bold text-xl text-[#7d5936]">{whiskey.name}</h4>
            <p className="text-[#986A44]">{whiskey.distillery}</p>
          </div>
          
          {/* Progress bar */}
          <div className="mb-4">
            <Progress value={progressPercentage} className="h-2 bg-[#e8d9bd]" />
            <p className="text-xs text-right mt-1 text-[#986A44]">
              Step {currentPage + 1} of {pageData.length}
            </p>
          </div>
          
          {isMobile && (
            <div className="mt-0 mb-2 text-xs text-center text-amber-700 flex items-center justify-center">
              <ChevronLeft className="h-3 w-3 mr-1" />
              <span>Swipe to navigate</span>
              <ChevronRight className="h-3 w-3 ml-1" />
            </div>
          )}
        </div>
        
        <Form {...form}>
          <form 
            // Disable the normal form submission behavior entirely
            onSubmit={(e) => {
              e.preventDefault();
              // Only call form.handleSubmit manually when the submit button is clicked
              // This happens in the Submit button's onClick handler instead
              return false;
            }} 
            className="space-y-4 flex-1 overflow-y-auto"
          >
            <div 
              id="review-content"
              className={`${swipeDirection ? (swipeDirection === 'left' ? 'animate-slide-left' : 'animate-slide-right') : ''}`}
              {...(isMobile ? swipeHandlers : {})}
            >
              {renderPageContent()}
            </div>
            
            <div className="flex justify-between pt-2">
              <div>
                {currentPage > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevPage}
                    className="border-[#d9c4a3] text-[#794e2f] hover:bg-[#f5efe0] flex items-center"
                  >
                    {isMobile && <ArrowLeft className="h-4 w-4 mr-1" />}
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-[#d9c4a3] text-[#794e2f] hover:bg-[#f5efe0]"
                >
                  Cancel
                </Button>
                
                {currentPage < ReviewPage.FinalScores ? (
                  <Button
                    type="button"
                    className="barrel-button flex items-center"
                    onClick={nextPage}
                  >
                    Next
                    {isMobile && <ArrowRight className="h-4 w-4 ml-1" />}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="barrel-button"
                    disabled={addReviewMutation.isPending}
                    onClick={() => {
                      console.log("Submit button clicked, current page:", currentPage, "FinalScores page:", ReviewPage.FinalScores);
                      // Submit the form unconditionally when on the final page
                      form.handleSubmit(onSubmit)();
                    }}
                  >
                    {addReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
