import { useState } from "react";
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
      value: ""
    },
  });

  // Calculate progress percentage
  const progressPercentage = (currentPage / pageData.length) * 100;

  const addReviewMutation = useMutation({
    mutationFn: async (data: ReviewNote) => {
      // Generate a summary from all the review sections
      const summary = [
        `Visual: ${data.visual}`,
        `Nose: ${data.nose}`,
        `Mouthfeel: ${data.mouthfeel}`,
        `Taste: ${data.taste}`,
        `Finish: ${data.finish}`,
        `Value: ${data.value}`,
        `Overall: ${data.text}`
      ].filter(Boolean).join("\n\n");
      
      // Update the main text field with our comprehensive notes
      data.text = summary;
      
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
          <FormField
            control={form.control}
            name="visual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{pageData[currentPage].title}</FormLabel>
                <p className="text-sm text-gray-500 mb-2">{pageData[currentPage].description}</p>
                <FormControl>
                  <Textarea
                    placeholder={pageData[currentPage].placeholder}
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case ReviewPage.Nose:
        return (
          <FormField
            control={form.control}
            name="nose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{pageData[currentPage].title}</FormLabel>
                <p className="text-sm text-gray-500 mb-2">{pageData[currentPage].description}</p>
                <FormControl>
                  <Textarea
                    placeholder={pageData[currentPage].placeholder}
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case ReviewPage.MouthFeel:
        return (
          <FormField
            control={form.control}
            name="mouthfeel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{pageData[currentPage].title}</FormLabel>
                <p className="text-sm text-gray-500 mb-2">{pageData[currentPage].description}</p>
                <FormControl>
                  <Textarea
                    placeholder={pageData[currentPage].placeholder}
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case ReviewPage.Taste:
        return (
          <FormField
            control={form.control}
            name="taste"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{pageData[currentPage].title}</FormLabel>
                <p className="text-sm text-gray-500 mb-2">{pageData[currentPage].description}</p>
                <FormControl>
                  <Textarea
                    placeholder={pageData[currentPage].placeholder}
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case ReviewPage.Finish:
        return (
          <FormField
            control={form.control}
            name="finish"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{pageData[currentPage].title}</FormLabel>
                <p className="text-sm text-gray-500 mb-2">{pageData[currentPage].description}</p>
                <FormControl>
                  <Textarea
                    placeholder={pageData[currentPage].placeholder}
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case ReviewPage.Value:
        return (
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{pageData[currentPage].title}</FormLabel>
                <p className="text-sm text-gray-500 mb-2">{pageData[currentPage].description}</p>
                <FormControl>
                  <Textarea
                    placeholder={pageData[currentPage].placeholder}
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case ReviewPage.Summary:
        return (
          <>
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="flavor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flavor Profile</FormLabel>
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
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">
            Review Whiskey - {pageData[currentPage].title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center mb-4">
          <h4 className="font-bold text-xl">{whiskey.name}</h4>
          <p className="text-gray-600">{whiskey.distillery}</p>
        </div>
        
        {/* Progress bar */}
        <div className="mb-4">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-right mt-1 text-gray-500">
            Step {currentPage + 1} of {pageData.length}
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {renderPageContent()}
            
            <div className="flex justify-between pt-2">
              <div>
                {currentPage > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevPage}
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
                >
                  Cancel
                </Button>
                
                {currentPage < ReviewPage.Summary ? (
                  <Button
                    type="button"
                    className="bg-whiskey-600 hover:bg-whiskey-500 text-white"
                    onClick={nextPage}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-whiskey-600 hover:bg-whiskey-500 text-white"
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
