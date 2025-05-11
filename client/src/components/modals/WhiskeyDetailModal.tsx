import { useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { 
  ImageIcon, Pencil as PencilIcon, Star, Upload, Edit, Trash2, 
  BookOpen, PenIcon, XIcon, AlertTriangle, Loader2, 
  DollarSign, BarChart2, Eye
} from "lucide-react";
import { useLocation } from 'wouter';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Whiskey, ReviewNote } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EditReviewModal from "./EditReviewModal";
import PriceTrackingModal from "./PriceTrackingModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  const [isPriceTrackingModalOpen, setIsPriceTrackingModalOpen] = useState(false);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Format dates
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
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
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiRequest("POST", `/api/whiskeys/${whiskey.id}/image`, formData);
      
      if (response.ok) {
        const result = await response.json();
        
        // Update the cache with the new image path
        queryClient.setQueryData(["/api/whiskeys"], (oldData: Whiskey[] | undefined) => {
          if (!oldData) return undefined;
          
          return oldData.map(item => 
            item.id === whiskey.id ? result.whiskey : item
          );
        });
        
        toast({
          title: "Image uploaded",
          description: "The image has been uploaded successfully.",
        });
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleEditReview = (review: ReviewNote) => {
    setSelectedReview(review);
    setIsEditReviewModalOpen(true);
  };
  
  // Deletion confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [isDeletingWhiskey, setIsDeletingWhiskey] = useState(false);
  
  // Delete review with proper confirmation dialog
  const handleDeleteReviewWithConfirm = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setIsDeleteDialogOpen(true);
  };
  
  // Execute the actual review deletion
  const executeDeleteReview = async () => {
    if (!reviewToDelete) return;
    
    try {
      const response = await apiRequest(
        "DELETE", 
        `/api/whiskeys/${whiskey.id}/reviews/${reviewToDelete}`
      );
      
      if (response.ok) {
        const updatedWhiskey = await response.json();
        
        // Update the cache
        queryClient.setQueryData(["/api/whiskeys"], (oldData: Whiskey[] | undefined) => {
          if (!oldData) return undefined;
          
          return oldData.map(item => 
            item.id === whiskey.id ? updatedWhiskey : item
          );
        });
        
        // Close the dialog and clear the state
        setIsDeleteDialogOpen(false);
        setReviewToDelete(null);
        
        toast({
          title: "Review deleted",
          description: "The review has been deleted successfully.",
        });
      } else {
        throw new Error("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };
  
  // Confirm deleting a whiskey
  const confirmDeleteWhiskey = () => {
    setIsDeletingWhiskey(true);
    setIsDeleteDialogOpen(true);
  };
  
  // Use mutation for whiskey deletion for better reliability
  const deleteWhiskeyMutation = useMutation({
    mutationFn: async () => {
      console.log("Deleting whiskey:", whiskey.id);
      const response = await apiRequest(
        "DELETE",
        `/api/whiskeys/${whiskey.id}`,
        undefined,
        {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      return response;
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Whiskey deleted",
        description: "The whiskey has been deleted successfully.",
      });
      
      // Properly invalidate the cache
      queryClient.invalidateQueries({ queryKey: ['/api/whiskeys'] });
      
      // Close the dialogs
      setIsDeleteDialogOpen(false);
      onClose();
    },
    onError: (error) => {
      console.error("Error deleting whiskey:", error);
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    }
  });
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900 pb-2">
              {whiskey.name}
              {whiskey.distillery && (
                <span className="text-gray-500 font-normal text-lg ml-2">by {whiskey.distillery}</span>
              )}
            </DialogTitle>
            <div className="flex items-center space-x-2 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={confirmDeleteWhiskey}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(whiskey)}>
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <div className="flex-grow"></div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon">
                  <XIcon className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2" style={{maxHeight: "calc(90vh - 80px)"}}>
            {/* Left column - Image & details */}
            <div>
              <div className="aspect-square overflow-hidden rounded-md bg-gray-100 mb-4 relative group">
                {whiskey.image ? (
                  <img 
                    src={whiskey.image}
                    alt={whiskey.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="secondary" 
                    className="bg-white hover:bg-gray-100"
                    onClick={() => imageUploadRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </Button>
                </div>
                <input 
                  type="file" 
                  ref={imageUploadRef} 
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Rating</div>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-amber-400 mr-1 fill-amber-400" />
                    <span className="font-medium">{(whiskey.rating || 0).toFixed(1)}</span>
                    <span className="text-gray-500 text-sm ml-1">/5</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {whiskey.type && (
                    <div>
                      <div className="text-sm text-gray-500">Type</div>
                      <div>{whiskey.type}</div>
                    </div>
                  )}
                  
                  {whiskey.region && (
                    <div>
                      <div className="text-sm text-gray-500">Region</div>
                      <div>{whiskey.region}</div>
                    </div>
                  )}
                  
                  {whiskey.age !== null && (
                    <div>
                      <div className="text-sm text-gray-500">Age</div>
                      <div>{whiskey.age} {whiskey.age === 1 ? 'year' : 'years'}</div>
                    </div>
                  )}
                  
                  {whiskey.abv !== null && (
                    <div>
                      <div className="text-sm text-gray-500">ABV</div>
                      <div>{whiskey.abv}%</div>
                    </div>
                  )}
                  
                  {whiskey.price !== null && (
                    <div>
                      <div className="text-sm text-gray-500">Price</div>
                      <div>${whiskey.price.toFixed(2)}</div>
                    </div>
                  )}
                  
                  {whiskey.dateAdded && (
                    <div>
                      <div className="text-sm text-gray-500">Added</div>
                      <div>{new Date(whiskey.dateAdded).toLocaleDateString()}</div>
                    </div>
                  )}
                  
                  {/* Bourbon specific fields */}
                  {whiskey.type === 'Bourbon' && (
                    <>
                      {whiskey.bottleType && (
                        <div>
                          <div className="text-sm text-gray-500">Bottle Type</div>
                          <div>{whiskey.bottleType}</div>
                        </div>
                      )}
                      
                      {whiskey.mashBill && (
                        <div>
                          <div className="text-sm text-gray-500">Mash Bill</div>
                          <div>{whiskey.mashBill}</div>
                        </div>
                      )}
                      
                      {whiskey.caskStrength && (
                        <div>
                          <div className="text-sm text-gray-500">Cask Strength</div>
                          <div>{whiskey.caskStrength}</div>
                        </div>
                      )}
                      
                      {whiskey.finished && (
                        <div>
                          <div className="text-sm text-gray-500">Finished</div>
                          <div>{whiskey.finished}</div>
                        </div>
                      )}
                      
                      {whiskey.finishType && (
                        <div>
                          <div className="text-sm text-gray-500">Finish Type</div>
                          <div>{whiskey.finishType}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Collection Management Tools */}
                <div className="mt-6">
                  <h3 className="font-medium text-lg mb-3">Collection Management</h3>
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setIsPriceTrackingModalOpen(true)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Track Price History
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={true} // For future inventory management
                    >
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Inventory Management
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column - Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-lg">Tasting Notes</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onReview(whiskey)}
                >
                  <PenIcon className="h-4 w-4 mr-1" />
                  Add Review
                </Button>
              </div>
              
              {sortedNotes && sortedNotes.length > 0 ? (
                <div className="space-y-4">
                  {sortedNotes.map((note, index) => (
                    <div key={note.id} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-medium">{formatDate(new Date(note.date))}</span>
                          {note.isPublic && (
                            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                              Public
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/reviews/${whiskey.id}/${note.id}`)}
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditReview(note)}
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteReviewWithConfirm(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`h-5 w-5 ${star <= (note.overallRating || 0) 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 font-medium">
                          {note.overallRating?.toFixed(1)} / 5
                        </span>
                      </div>
                      
                      <Accordion type="single" collapsible defaultValue={index === 0 ? "item-0" : undefined}>
                        <AccordionItem value={`item-${index}`}>
                          <AccordionTrigger className="text-sm">
                            View Details
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 py-2">
                              {note.summary && (
                                <div>
                                  <div className="text-sm font-medium text-gray-700">Summary</div>
                                  <p className="text-sm text-gray-600">{note.summary}</p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div>
                                  <div className="text-xs text-gray-500">Nose</div>
                                  <div className="flex items-center">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                          key={star}
                                          className={`h-3.5 w-3.5 ${star <= (note.noseScore || 0) 
                                            ? 'text-amber-400 fill-amber-400' 
                                            : 'text-gray-300'}`}
                                        />
                                      ))}
                                    </div>
                                    <span className="ml-1 text-xs font-medium">
                                      {note.noseScore || 0}
                                    </span>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-xs text-gray-500">Mouthfeel</div>
                                  <div className="flex items-center">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                          key={star}
                                          className={`h-3.5 w-3.5 ${star <= (note.mouthfeelScore || 0) 
                                            ? 'text-amber-400 fill-amber-400' 
                                            : 'text-gray-300'}`}
                                        />
                                      ))}
                                    </div>
                                    <span className="ml-1 text-xs font-medium">
                                      {note.mouthfeelScore || 0}
                                    </span>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-xs text-gray-500">Taste</div>
                                  <div className="flex items-center">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                          key={star}
                                          className={`h-3.5 w-3.5 ${star <= (note.tasteScore || 0) 
                                            ? 'text-amber-400 fill-amber-400' 
                                            : 'text-gray-300'}`}
                                        />
                                      ))}
                                    </div>
                                    <span className="ml-1 text-xs font-medium">
                                      {note.tasteScore || 0}
                                    </span>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-xs text-gray-500">Finish</div>
                                  <div className="flex items-center">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                          key={star}
                                          className={`h-3.5 w-3.5 ${star <= (note.finishScore || 0) 
                                            ? 'text-amber-400 fill-amber-400' 
                                            : 'text-gray-300'}`}
                                        />
                                      ))}
                                    </div>
                                    <span className="ml-1 text-xs font-medium">
                                      {note.finishScore || 0}
                                    </span>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-xs text-gray-500">Value</div>
                                  <div className="flex items-center">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                          key={star}
                                          className={`h-3.5 w-3.5 ${star <= (note.valueScore || 0) 
                                            ? 'text-amber-400 fill-amber-400' 
                                            : 'text-gray-300'}`}
                                        />
                                      ))}
                                    </div>
                                    <span className="ml-1 text-xs font-medium">
                                      {note.valueScore || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-6 text-center bg-gray-50">
                  <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <h4 className="text-gray-500 font-medium">No reviews yet</h4>
                  <p className="text-gray-400 text-sm mb-4">Start by adding your first tasting note</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onReview(whiskey)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Add First Review
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit review modal */}
      {selectedReview && (
        <EditReviewModal
          isOpen={isEditReviewModalOpen}
          onClose={() => setIsEditReviewModalOpen(false)}
          whiskey={whiskey}
          review={selectedReview}
        />
      )}
      
      {/* Price tracking modal */}
      <PriceTrackingModal
        isOpen={isPriceTrackingModalOpen}
        onClose={() => setIsPriceTrackingModalOpen(false)}
        whiskey={whiskey}
      />
      
      {/* Confirmation dialog for deleting whiskey or review */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {isDeletingWhiskey 
                ? `This will permanently delete "${whiskey.name}" from your collection. This action cannot be undone.`
                : `This will permanently delete this review. This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setReviewToDelete(null);
              setIsDeletingWhiskey(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeletingWhiskey && deleteWhiskeyMutation.isPending}
              onClick={() => {
                if (isDeletingWhiskey) {
                  deleteWhiskeyMutation.mutate();
                } else if (reviewToDelete) {
                  executeDeleteReview();
                }
                // We don't reset states here as the mutation handlers will do that
              }}
            >
              {isDeletingWhiskey && deleteWhiskeyMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WhiskeyDetailModal;