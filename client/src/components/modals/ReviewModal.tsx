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

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
}

const ReviewModal = ({ isOpen, onClose, whiskey }: ReviewModalProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  
  const form = useForm<ReviewNote>({
    resolver: zodResolver(reviewNoteSchema),
    defaultValues: {
      rating: 0,
      date: new Date().toISOString().split('T')[0],
      text: "",
      flavor: "",
      id: nanoid(),
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: async (data: ReviewNote) => {
      const response = await apiRequest("POST", `/api/whiskeys/${whiskey.id}/reviews`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
      toast({
        title: "Review Added",
        description: "Your tasting notes have been saved.",
      });
      form.reset();
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

  const onSubmit = (data: ReviewNote) => {
    data.rating = rating;
    addReviewMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">Review Whiskey</DialogTitle>
        </DialogHeader>
        
        <div className="text-center mb-6">
          <h4 className="font-bold text-xl">{whiskey.name}</h4>
          <p className="text-gray-600">{whiskey.distillery}</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-4">
              <FormLabel>Rating</FormLabel>
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
                  <FormLabel>Tasting Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the aroma, taste, finish, and overall impression..."
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
                        <SelectItem value="none">Select Profile</SelectItem>
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
            
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-whiskey-600 hover:bg-whiskey-500 text-white"
                disabled={addReviewMutation.isPending}
              >
                {addReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
