import { useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  ImageIcon, Pencil as PencilIcon, Star, Upload, Edit, Trash2, 
  BookOpen, PenIcon, XIcon, AlertTriangle, Loader2, 
  DollarSign, TrendingUp, BarChart2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Whiskey, ReviewNote } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EditReviewModal from "./EditReviewModal";
import PriceTrackingModal from "./PriceTrackingModal";
import MarketValueModal from "./MarketValueModal";
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
  const [isMarketValueModalOpen, setIsMarketValueModalOpen] = useState(false);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
  
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirmRemoval()) return;
    
    try {
      const response = await apiRequest(
        "DELETE", 
        `/api/whiskeys/${whiskey.id}/reviews/${reviewId}`
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
        
        toast({
          title: "Review deleted",
          description: "The review has been deleted successfully.",
        });
      } else {
        throw new Error("Failed to delete review");
      }
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  const confirmRemoval = (type = 'review') => {
    return window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`);
  };
  
  // Delete the entire whiskey
  const deleteWhiskey = async () => {
    if (!confirmRemoval('whiskey')) return;
    
    try {
      const response = await apiRequest(
        "DELETE", 
        `/api/whiskeys/${whiskey.id}`
      );
      
      if (response.ok) {
        // Update the cache by removing the deleted whiskey
        queryClient.setQueryData(["/api/whiskeys"], (oldData: Whiskey[] | undefined) => {
          if (!oldData) return undefined;
          return oldData.filter(item => item.id !== whiskey.id);
        });
        
        // Show success message
        toast({
          title: "Whiskey deleted",
          description: "The whiskey has been deleted successfully.",
        });
        
        // Close the modal
        onClose();
      } else {
        throw new Error("Failed to delete whiskey");
      }
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-semibold pb-2 relative flex items-center">
              <div className="flex-1 pr-10">
                {whiskey.name}
                {whiskey.distillery && (
                  <span className="text-gray-500 font-normal ml-2">by {whiskey.distillery}</span>
                )}
              </div>
              <div className="absolute right-0 top-0">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={deleteWhiskey}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => onEdit(whiskey)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline" size="icon">
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </DialogTitle>
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
                      onClick={() => setIsMarketValueModalOpen(true)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Estimate Market Value
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
              
              {sortedNotes.length > 0 ? (
                <div className="space-y-4">
                  {sortedNotes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400 mr-1" />
                            <span className="font-medium">{note.rating.toFixed(1)}</span>
                            <span className="text-gray-500 text-sm ml-1">/5</span>
                          </div>
                          {note.date && (
                            <div className="text-xs text-gray-500">
                              {new Date(note.date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => handleEditReview(note)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" 
                            onClick={() => handleDeleteReview(note.id!)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {note.flavor && (
                        <div className="mb-2">
                          <Badge variant="outline">{note.flavor}</Badge>
                        </div>
                      )}
                      
                      {note.text && (
                        <p className="text-sm whitespace-pre-line">{note.text}</p>
                      )}
                      
                      {/* If this is a detailed review, show the sections */}
                      {(note.visualColor || note.noseAromas || note.mouthfeelAlcohol || 
                        note.tasteFlavors || note.finishLength || note.valueAvailability) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="details">
                              <AccordionTrigger className="text-sm font-medium py-1">
                                View Detailed Notes
                              </AccordionTrigger>
                              <AccordionContent className="max-h-[300px] overflow-y-auto pr-2">
                                <div className="space-y-3 text-sm">
                                  {/* Visual details */}
                                  {(note.visualColor || note.visualViscosity || note.visualClarity) && (
                                    <div>
                                      <h4 className="font-medium text-sm">Visual:</h4>
                                      <ul className="list-disc list-inside text-xs">
                                        {note.visualColor && <li>Color: {note.visualColor}</li>}
                                        {note.visualViscosity && <li>Viscosity: {note.visualViscosity}</li>}
                                        {note.visualClarity && <li>Clarity: {note.visualClarity}</li>}
                                      </ul>
                                      {note.visualNotes && (
                                        <p className="text-xs mt-1 italic">{note.visualNotes}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Nose details */}
                                  {(note.noseAromas && note.noseAromas.length > 0) && (
                                    <div>
                                      <h4 className="font-medium text-sm">Nose:</h4>
                                      <p className="text-xs">
                                        {note.noseAromas.join(', ')}
                                      </p>
                                      {note.noseScore && (
                                        <p className="text-xs">Score: {note.noseScore}/5</p>
                                      )}
                                      {note.noseNotes && (
                                        <p className="text-xs mt-1 italic">{note.noseNotes}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Mouthfeel details */}
                                  {(note.mouthfeelAlcohol || note.mouthfeelViscosity || note.mouthfeelPleasantness) && (
                                    <div>
                                      <h4 className="font-medium text-sm">Mouthfeel:</h4>
                                      <ul className="list-disc list-inside text-xs">
                                        {note.mouthfeelAlcohol && <li>Alcohol: {note.mouthfeelAlcohol}</li>}
                                        {note.mouthfeelViscosity && <li>Viscosity: {note.mouthfeelViscosity}</li>}
                                        {note.mouthfeelPleasantness && <li>Pleasantness: {note.mouthfeelPleasantness}</li>}
                                      </ul>
                                      {note.mouthfeelScore && (
                                        <p className="text-xs">Score: {note.mouthfeelScore}/5</p>
                                      )}
                                      {note.mouthfeelNotes && (
                                        <p className="text-xs mt-1 italic">{note.mouthfeelNotes}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Taste details */}
                                  {(note.tasteFlavors && note.tasteFlavors.length > 0) && (
                                    <div>
                                      <h4 className="font-medium text-sm">Taste:</h4>
                                      <p className="text-xs">
                                        {note.tasteFlavors.join(', ')}
                                      </p>
                                      {note.tasteCorrelation !== undefined && (
                                        <p className="text-xs">Correlates with nose: {note.tasteCorrelation ? 'Yes' : 'No'}</p>
                                      )}
                                      {note.tasteScore && (
                                        <p className="text-xs">Score: {note.tasteScore}/5</p>
                                      )}
                                      {note.tasteNotes && (
                                        <p className="text-xs mt-1 italic">{note.tasteNotes}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Finish details */}
                                  {(note.finishFlavors || note.finishLength || note.finishPleasantness) && (
                                    <div>
                                      <h4 className="font-medium text-sm">Finish:</h4>
                                      {note.finishFlavors && note.finishFlavors.length > 0 && (
                                        <p className="text-xs">
                                          Flavors: {note.finishFlavors.join(', ')}
                                        </p>
                                      )}
                                      <ul className="list-disc list-inside text-xs">
                                        {note.finishLength && <li>Length: {note.finishLength}</li>}
                                        {note.finishPleasantness && <li>Pleasantness: {note.finishPleasantness}</li>}
                                      </ul>
                                      {note.finishCorrelation !== undefined && (
                                        <p className="text-xs">Correlates with taste: {note.finishCorrelation ? 'Yes' : 'No'}</p>
                                      )}
                                      {note.finishScore && (
                                        <p className="text-xs">Score: {note.finishScore}/5</p>
                                      )}
                                      {note.finishNotes && (
                                        <p className="text-xs mt-1 italic">{note.finishNotes}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Value details */}
                                  {(note.valueAvailability || note.valueBuyAgain || note.valueOccasion) && (
                                    <div>
                                      <h4 className="font-medium text-sm">Value:</h4>
                                      <ul className="list-disc list-inside text-xs">
                                        {note.valueAvailability && <li>Availability: {note.valueAvailability}</li>}
                                        {note.valueBuyAgain && <li>Buy Again: {note.valueBuyAgain}</li>}
                                        {note.valueOccasion && <li>Occasion: {note.valueOccasion}</li>}
                                      </ul>
                                      {note.valueScore && (
                                        <p className="text-xs">Score: {note.valueScore}/5</p>
                                      )}
                                      {note.valueNotes && (
                                        <p className="text-xs mt-1 italic">{note.valueNotes}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-md">
                  <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No tasting notes yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => onReview(whiskey)}
                  >
                    <PenIcon className="h-4 w-4 mr-1" />
                    Add Your First Review
                  </Button>
                </div>
              )}
              
              <div className="mt-6 flex justify-between">
                <Button
                  onClick={() => onEdit(whiskey)}
                  variant="outline"
                  className="inline-flex items-center border-amber-300 text-amber-700"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
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