import { useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ImageIcon, Pencil, Star, Upload, Edit, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Whiskey, ReviewNote } from "@shared/schema";
import { formatDate } from "@/lib/utils/calculations"; // Import properly defined
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EditReviewModal from "./EditReviewModal";

interface WhiskeyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
  onReview: (whiskey: Whiskey) => void;
  onEdit: (whiskey: Whiskey) => void;
}

const WhiskeyDetailModal = ({ isOpen, onClose, whiskey, onReview, onEdit }: WhiskeyDetailModalProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewNote | null>(null);
  const [isEditReviewModalOpen, setIsEditReviewModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get formatted date strings
  const dateAdded = whiskey.dateAdded 
    ? formatDate(new Date(whiskey.dateAdded)) 
    : 'N/A';
    
  const lastReviewed = whiskey.lastReviewed 
    ? formatDate(new Date(whiskey.lastReviewed)) 
    : 'Never';
  
  // Sort notes by date descending
  const sortedNotes = useMemo(() => {
    if (!whiskey.notes || !Array.isArray(whiskey.notes)) return [];
    
    return [...whiskey.notes].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [whiskey.notes]);
  
  // Direct file upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input change event triggered");
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      console.log("Starting file upload for:", file.name);
      
      const formData = new FormData();
      formData.append('image', file);
      
      // Direct fetch for more control
      const response = await fetch(`/api/whiskeys/${whiskey.id}/image`, {
        method: 'POST',
        body: formData,
      });
      
      console.log("Upload response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      // Success handling
      queryClient.invalidateQueries({ queryKey: ['/api/whiskeys'] });
      toast({
        title: "Image uploaded",
        description: "The bottle image has been uploaded successfully.",
      });
      
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Review deletion
  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return apiRequest(`/api/whiskeys/${whiskey.id}/reviews/${reviewId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whiskeys'] });
      toast({
        title: "Review deleted",
        description: "The review has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "There was an error deleting the review. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDeleteReview = (reviewId: string) => {
    if (window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      deleteMutation.mutate(reviewId);
    }
  };
  
  const handleEditReview = (review: ReviewNote) => {
    setSelectedReview(review);
    setIsEditReviewModalOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="hidden">
            <DialogTitle>Whiskey Details</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <div className="h-48 w-full bg-whiskey-100">
              {whiskey.image ? (
                <div className="relative h-full w-full">
                  <img 
                    src={whiskey.image} 
                    alt={`Bottle of ${whiskey.name}`}
                    className="h-full w-full object-cover"
                  />
                  <label 
                    htmlFor="bottle-image-upload"
                    className="absolute bottom-3 right-3 bg-whiskey-600 text-white p-2 rounded-full shadow-md hover:bg-whiskey-500 focus:outline-none z-10 cursor-pointer"
                  >
                    {isUploading ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </label>
                </div>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center bg-amber-50 text-amber-700">
                  <label 
                    htmlFor="bottle-image-upload"
                    className="cursor-pointer p-4 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors"
                  >
                    {isUploading ? (
                      <div className="animate-spin h-8 w-8 border-2 border-amber-700 border-opacity-20 border-t-amber-700 rounded-full"></div>
                    ) : (
                      <Upload className="h-8 w-8" />
                    )}
                  </label>
                  <span className="mt-2 text-sm font-medium">Add bottle image</span>
                </div>
              )}
              <input 
                id="bottle-image-upload"
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900">{whiskey.name}</h2>
              {whiskey.distillery && (
                <p className="text-gray-600 mt-1">{whiskey.distillery}</p>
              )}
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="mt-1">{whiskey.type || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Region</h3>
                  <p className="mt-1">{whiskey.region || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Age</h3>
                  <p className="mt-1">{whiskey.age ? `${whiskey.age} years` : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">ABV</h3>
                  <p className="mt-1">{whiskey.abv ? `${whiskey.abv}%` : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price</h3>
                  <p className="mt-1">{whiskey.price ? `$${whiskey.price.toFixed(2)}` : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Rating</h3>
                  <p className="mt-1">{whiskey.rating ? `${whiskey.rating.toFixed(1)} / 5.0` : 'Not rated'}</p>
                </div>
              </div>

              {/* Bourbon-specific fields */}
              {whiskey.type === 'Bourbon' && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Bottle Type</h3>
                      <p className="mt-1">{whiskey.bottleType || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Mash Bill</h3>
                      <p className="mt-1">{whiskey.mashBill || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Cask Strength</h3>
                      <p className="mt-1">{whiskey.caskStrength ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Finish Type</h3>
                      <p className="mt-1">{whiskey.finishType || 'N/A'}</p>
                    </div>
                  </div>
                </>
              )}
              
              {/* Notes section */}
              {sortedNotes.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <h3 className="text-lg font-semibold text-gray-900">Tasting Notes</h3>
                  <div className="mt-2 space-y-3">
                    {sortedNotes.map((note) => (
                      <div key={note.id} className="bg-amber-50 p-3 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-gray-500">{formatDate(new Date(note.date))}</span>
                            <div className="flex items-center mt-1">
                              <span className="font-medium">{note.rating.toFixed(1)}</span>
                              <span className="text-xs text-gray-500 ml-1">/ 5.0</span>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              onClick={() => handleEditReview(note)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteReview(note.id!)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm mt-2">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <p>Added on: {dateAdded}</p>
                </div>
                <div>
                  <p>Last reviewed: {lastReviewed}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button
                  onClick={() => onEdit(whiskey)}
                  variant="outline"
                  className="inline-flex items-center border-amber-300 text-amber-700"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Whiskey
                </Button>
                <Button
                  onClick={() => onReview(whiskey)}
                  className="inline-flex items-center bg-amber-600 hover:bg-amber-500 text-white"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Add Review
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Review Modal */}
      {selectedReview && (
        <EditReviewModal
          isOpen={isEditReviewModalOpen}
          onClose={() => {
            setIsEditReviewModalOpen(false);
            setSelectedReview(null);
          }}
          whiskey={whiskey}
          review={selectedReview}
        />
      )}
    </>
  );
};

export default WhiskeyDetailModal;