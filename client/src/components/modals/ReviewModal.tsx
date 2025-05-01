import { useState, useEffect } from "react";
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
  Summary = 6
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
  }
];

const ReviewModal = ({ isOpen, onClose, whiskey }: ReviewModalProps) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState<ReviewPage>(ReviewPage.Visual);
  const [rating, setRating] = useState(0);
  
  // State for selected aromas and flavors
  const [selectedNoseAromas, setSelectedNoseAromas] = useState<string[]>([]);
  const [selectedTasteFlavors, setSelectedTasteFlavors] = useState<string[]>([]);
  const [selectedFinishFlavors, setSelectedFinishFlavors] = useState<string[]>([]);
  
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
      valueNotes: ""
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
      
      const summary = [
        `## VISUAL ##\n${visualSection}`,
        `## NOSE ##\n${noseSection}`,
        `## MOUTHFEEL ##\n${mouthfeelSection}`,
        `## TASTE ##\n${tasteSection}`,
        `## FINISH ##\n${finishSection}`,
        `## VALUE ##\n${valueSection}`,
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
      
      const response = await apiRequest("POST", `/api/whiskeys/${whiskey.id}/reviews`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
      toast({
        title: "Review Added",
        description: "Your detailed tasting notes have been saved.",
      });
      form.reset();
      setCurrentPage(ReviewPage.Visual);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add review: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle page navigation
  const nextPage = () => {
    if (currentPage < ReviewPage.Summary) {
      setCurrentPage(prevPage => (prevPage + 1) as ReviewPage);
    }
  };

  const prevPage = () => {
    if (currentPage > ReviewPage.Visual) {
      setCurrentPage(prevPage => (prevPage - 1) as ReviewPage);
    }
  };

  const onSubmit = (data: ReviewNote) => {
    data.rating = rating;
    addReviewMutation.mutate(data);
  };

  // Render content based on current page
  const renderPageContent = () => {
    switch(currentPage) {
      case ReviewPage.Visual:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Color</h3>
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
              <h3 className="font-medium mb-2">Viscosity</h3>
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
              <h3 className="font-medium mb-2">Clarity</h3>
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
              <h3 className="font-medium mb-2">Aromas</h3>
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
              <h3 className="font-medium mb-2">Nose Score (1-5)</h3>
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
              <h3 className="font-medium mb-2">Alcohol Feel</h3>
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
              <h3 className="font-medium mb-2">Viscosity</h3>
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
              <h3 className="font-medium mb-2">Pleasantness</h3>
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
              <h3 className="font-medium mb-2">Mouthfeel Score (1-5)</h3>
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
              <h3 className="font-medium mb-2">Flavors</h3>
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
              <h3 className="font-medium mb-2">Correlation with Nose</h3>
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
              <h3 className="font-medium mb-2">Taste Score (1-5)</h3>
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
              <h3 className="font-medium mb-2">Finish Flavors</h3>
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
              <h3 className="font-medium mb-2">Correlation with Taste</h3>
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
              <h3 className="font-medium mb-2">Finish Length</h3>
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
              <h3 className="font-medium mb-2">Finish Pleasantness</h3>
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
              <h3 className="font-medium mb-2">Finish Score (1-5)</h3>
              <FormField
                control={form.control}
                name="finishScore"
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
              <h3 className="font-medium mb-2">Availability</h3>
              <FormField
                control={form.control}
                name="valueAvailability"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
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
              <h3 className="font-medium mb-2">Would You Buy Again?</h3>
              <FormField
                control={form.control}
                name="valueBuyAgain"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
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
              <h3 className="font-medium mb-2">Occasion</h3>
              <FormField
                control={form.control}
                name="valueOccasion"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
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
              <h3 className="font-medium mb-2">Value Score (1-5)</h3>
              <FormField
                control={form.control}
                name="valueScore"
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
            {/* Review Summary */}
            <div className="mb-6 bg-secondary/20 p-4 rounded-lg">
              <h3 className="font-medium text-lg mb-2">Review Summary</h3>
              
              <div className="space-y-3 text-sm">
                {/* Visual Summary */}
                <div>
                  <h4 className="font-medium">Visual:</h4>
                  <p>
                    {form.getValues('visualColor') && 
                      `Color: ${COLOR_OPTIONS.find(c => c.value === form.getValues('visualColor'))?.label || form.getValues('visualColor')}`}
                    {form.getValues('visualViscosity') && 
                      `, Viscosity: ${VISCOSITY_OPTIONS.find(v => v.value === form.getValues('visualViscosity'))?.label || form.getValues('visualViscosity')}`}
                    {form.getValues('visualClarity') && 
                      `, Clarity: ${CLARITY_OPTIONS.find(c => c.value === form.getValues('visualClarity'))?.label || form.getValues('visualClarity')}`}
                  </p>
                </div>
                
                {/* Nose Summary */}
                <div>
                  <h4 className="font-medium">Nose:</h4>
                  <p>
                    {selectedNoseAromas.length > 0 && 
                      `Detected: ${selectedNoseAromas.map(aroma => {
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
                      }).join(', ')}`}
                    {form.getValues('noseScore') && 
                      `, Score: ${form.getValues('noseScore')}/5`}
                  </p>
                </div>
                
                {/* Mouthfeel Summary */}
                <div>
                  <h4 className="font-medium">Mouthfeel:</h4>
                  <p>
                    {form.getValues('mouthfeelAlcohol') && 
                      `Alcohol: ${ALCOHOL_FEEL_OPTIONS.find(a => a.value === form.getValues('mouthfeelAlcohol'))?.label || form.getValues('mouthfeelAlcohol')}`}
                    {form.getValues('mouthfeelViscosity') && 
                      `, Viscosity: ${MOUTHFEEL_VISCOSITY_OPTIONS.find(v => v.value === form.getValues('mouthfeelViscosity'))?.label || form.getValues('mouthfeelViscosity')}`}
                    {form.getValues('mouthfeelPleasantness') && 
                      `, Pleasantness: ${PLEASANTNESS_OPTIONS.find(p => p.value === form.getValues('mouthfeelPleasantness'))?.label || form.getValues('mouthfeelPleasantness')}`}
                    {form.getValues('mouthfeelScore') && 
                      `, Score: ${form.getValues('mouthfeelScore')}/5`}
                  </p>
                </div>
                
                {/* Taste Summary */}
                <div>
                  <h4 className="font-medium">Taste:</h4>
                  <p>
                    {selectedTasteFlavors.length > 0 && 
                      `Detected: ${selectedTasteFlavors.map(flavor => {
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
                      }).join(', ')}`}
                    {form.getValues('tasteCorrelation') !== undefined && 
                      `, Matches Nose: ${form.getValues('tasteCorrelation') ? 'Yes' : 'No'}`}
                    {form.getValues('tasteScore') && 
                      `, Score: ${form.getValues('tasteScore')}/5`}
                  </p>
                </div>
                
                {/* Finish Summary */}
                <div>
                  <h4 className="font-medium">Finish:</h4>
                  <p>
                    {selectedFinishFlavors.length > 0 && 
                      `Detected: ${selectedFinishFlavors.map(flavor => {
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
                      }).join(', ')}`}
                    {form.getValues('finishLength') && 
                      `, Length: ${FINISH_LENGTH_OPTIONS.find(l => l.value === form.getValues('finishLength'))?.label || form.getValues('finishLength')}`}
                    {form.getValues('finishScore') && 
                      `, Score: ${form.getValues('finishScore')}/5`}
                  </p>
                </div>
                
                {/* Value Summary */}
                <div>
                  <h4 className="font-medium">Value:</h4>
                  <p>
                    Price: ${whiskey.price ? whiskey.price.toFixed(2) : 'N/A'} (${whiskey.price ? (whiskey.price / 14).toFixed(2) : 'N/A'} per pour)
                    {form.getValues('valueAvailability') && 
                      `, Availability: ${AVAILABILITY_OPTIONS.find(a => a.value === form.getValues('valueAvailability'))?.label || form.getValues('valueAvailability')}`}
                    {form.getValues('valueBuyAgain') && 
                      `, Buy Again: ${BUY_AGAIN_OPTIONS.find(b => b.value === form.getValues('valueBuyAgain'))?.label || form.getValues('valueBuyAgain')}`}
                    {form.getValues('valueScore') && 
                      `, Score: ${form.getValues('valueScore')}/5`}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Overall Rating */}
            <div className="mb-4">
              <FormLabel>Overall Rating</FormLabel>
              <div className="flex justify-center space-x-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      form.setValue("rating", star);
                    }}
                    className="focus:outline-none"
                  >
                    <svg
                      className={`w-8 h-8 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  </button>
                ))}
              </div>
              {form.formState.errors.rating && (
                <p className="text-sm text-red-500 text-center mt-1">Please select a rating</p>
              )}
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
              <FormField
                control={form.control}
                name="flavor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dominant Flavor Profile</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Profile" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sweet">Sweet</SelectItem>
                        <SelectItem value="Spicy">Spicy</SelectItem>
                        <SelectItem value="Smoky">Smoky</SelectItem>
                        <SelectItem value="Fruity">Fruity</SelectItem>
                        <SelectItem value="Floral">Floral</SelectItem>
                        <SelectItem value="Woody">Woody</SelectItem>
                        <SelectItem value="Complex">Complex</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md dialog-content">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif font-medium text-[#593d25]">
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 scrollable-content">
            {renderPageContent()}
            
            <div className="flex justify-between pt-2">
              <div>
                {currentPage > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevPage}
                    className="border-[#d9c4a3] text-[#794e2f] hover:bg-[#f5efe0]"
                  >
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
                
                {currentPage < ReviewPage.Summary ? (
                  <Button
                    type="button"
                    className="barrel-button"
                    onClick={nextPage}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="barrel-button"
                    disabled={addReviewMutation.isPending || !rating}
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
