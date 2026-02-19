import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Whiskey, ReviewNote } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface EditReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
  review: ReviewNote;
}

const EditReviewModal = ({ isOpen, onClose, whiskey, review }: EditReviewModalProps) => {
  const { toast } = useToast();
  const [reviewText, setReviewText] = useState(review.text || "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const updateReviewMutation = useMutation({
    mutationFn: async (data: ReviewNote) => {
      const response = await apiRequest(
        "PUT",
        `/api/whiskeys/${whiskey.id}/reviews/${review.id}`,
        data
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Review updated",
        description: "Your tasting notes have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whiskeys'] });
      
      // Find the updated review
      if (data && Array.isArray(data.notes)) {
        const updatedReview = data.notes.find((note: ReviewNote) =>
          note.id === review.id ||
          (typeof note.id === 'string' && note.id === review.id?.toString()) ||
          (typeof review.id === 'string' && note.id?.toString() === review.id)
        );
        if (updatedReview) {
          // Close modal
          onClose();

          // Make sure the review ID is properly converted for URL purposes
          const reviewIdForUrl = updatedReview.id.toString();
          
          // Navigate to review page
          window.location.href = `/whiskey/${whiskey.id}/review/${reviewIdForUrl}`;
          return;
        }
      }
      
      // Fallback if review not found in response
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update review: ${error}`,
        variant: "destructive",
      });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/whiskeys/${whiskey.id}/reviews/${review.id}`
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Review deleted",
        description: "Your tasting notes have been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whiskeys'] });
      setIsDeleteDialogOpen(false);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete review: ${error}`,
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleSave = () => {
    if (!reviewText.trim()) {
      toast({
        title: "Error",
        description: "Review text cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    const updatedReview: ReviewNote = {
      ...review,
      text: reviewText
    };
    
    updateReviewMutation.mutate(updatedReview);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteReviewMutation.mutate();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px]" description="Edit your tasting review">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{whiskey.name}</h3>
                <p className="text-sm text-gray-500">Review from {formatDate(review.date)}</p>
              </div>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${star <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
                <span className="ml-1">{review.rating}/5</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tasting Notes</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Your tasting notes..."
                className="min-h-[120px]"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteReviewMutation.isPending}
              >
                {deleteReviewMutation.isPending ? "Deleting..." : "Delete Review"}
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-whiskey-600 hover:bg-whiskey-500 text-white"
                  disabled={updateReviewMutation.isPending}
                >
                  {updateReviewMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your review for "{whiskey.name}" from {formatDate(review.date)}.
              The whiskey will remain in your collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditReviewModal;