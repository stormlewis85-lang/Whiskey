import { useMemo, useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ImageIcon, Pencil, Star, Upload } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Whiskey } from "@shared/schema";
import { formatDate } from "@/lib/utils/calculations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WhiskeyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
  onReview: (whiskey: Whiskey) => void;
}

const WhiskeyDetailModal = ({ isOpen, onClose, whiskey, onReview }: WhiskeyDetailModalProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  
  // Image upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest(`/api/whiskeys/${whiskey.id}/image`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whiskeys'] });
      toast({
        title: "Image uploaded",
        description: "The bottle image has been uploaded successfully.",
      });
      setIsUploading(false);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading the image. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  });
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    // Create form data and upload
    const formData = new FormData();
    formData.append("image", file);
    setIsUploading(true);
    uploadMutation.mutate(formData);
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <div className="relative">
          <div className="h-48 w-full bg-whiskey-100">
            {whiskey.image ? (
              <div className="relative h-full w-full">
                <img 
                  src={whiskey.image} 
                  alt={`Bottle of ${whiskey.name}`}
                  className="h-full w-full object-cover"
                />
                <button 
                  onClick={triggerFileInput}
                  className="absolute bottom-3 right-3 bg-whiskey-600 text-white p-2 rounded-full shadow-md hover:bg-whiskey-500 focus:outline-none z-10"
                  disabled={isUploading}
                  type="button"
                >
                  {isUploading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center bg-whiskey-100 text-whiskey-600">
                <button
                  onClick={triggerFileInput}
                  className="flex flex-col items-center justify-center p-4 hover:bg-whiskey-200 rounded-lg transition-colors focus:outline-none"
                  disabled={isUploading}
                  type="button"
                >
                  {isUploading ? (
                    <div className="animate-spin h-8 w-8 border-4 border-whiskey-600 border-opacity-20 border-t-whiskey-600 rounded-full mb-2"></div>
                  ) : (
                    <ImageIcon className="h-16 w-16 mb-2" />
                  )}
                  <span className="text-sm font-medium">
                    {isUploading ? "Uploading..." : "Click to add bottle photo"}
                  </span>
                </button>
              </div>
            )}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.gif,.webp"
              className="hidden"
            />
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-4">
            {whiskey.type && (
              <span className="inline-block bg-whiskey-600 rounded-full px-3 py-1 text-xs font-semibold">
                {whiskey.type}
              </span>
            )}
            <h2 className="text-2xl font-bold mt-1">{whiskey.name}</h2>
            <p className="text-gray-300">{whiskey.distillery || 'Unknown Distillery'}</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[200px]">
              <h3 className="font-medium text-[#F5F5F0] mb-4">Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium">{whiskey.age ? `${whiskey.age} years` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">{whiskey.price ? `$${whiskey.price}` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ABV:</span>
                  <span className="font-medium">{whiskey.abv ? `${whiskey.abv}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Region:</span>
                  <span className="font-medium">{whiskey.region || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date Added:</span>
                  <span className="font-medium">{dateAdded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Reviewed:</span>
                  <span className="font-medium">{lastReviewed}</span>
                </div>

                {/* Bourbon specific details */}
                {whiskey.type === "Bourbon" && (
                  <>
                    <Separator className="my-3" />
                    <div className="mb-2 font-medium text-[#F5F5F0]">Bourbon Details</div>
                    
                    {whiskey.bottleType && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bottle Type:</span>
                        <span className="font-medium">{whiskey.bottleType}</span>
                      </div>
                    )}
                    
                    {whiskey.mashBill && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mash Bill:</span>
                        <span className="font-medium">{whiskey.mashBill}</span>
                      </div>
                    )}
                    
                    {whiskey.caskStrength && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cask Strength:</span>
                        <span className="font-medium">{whiskey.caskStrength}</span>
                      </div>
                    )}
                    
                    {whiskey.finished && whiskey.finished === "Yes" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Finished:</span>
                          <span className="font-medium">Yes</span>
                        </div>
                        
                        {whiskey.finishType && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Finish Type:</span>
                            <span className="font-medium">{whiskey.finishType}</span>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <h3 className="font-medium text-[#F5F5F0] mb-4">Rating & Tasting Notes</h3>
              
              <div className="flex mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-6 h-6 ${star <= (whiskey.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
                <span className="ml-1 text-gray-600">
                  {whiskey.rating ? `${whiskey.rating}/5` : 'Not Rated'}
                </span>
              </div>
              
              {sortedNotes && sortedNotes.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {sortedNotes.map((note, index) => (
                    <div key={note.id || index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= (note.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                          {note.flavor && (
                            <span className="ml-2 text-xs bg-whiskey-100 text-whiskey-700 px-2 py-0.5 rounded">
                              {note.flavor}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{note.date}</span>
                      </div>
                      <p className="text-sm mt-2">{note.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-gray-500 italic">
                  No tasting notes yet.
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => onReview(whiskey)}
              className="inline-flex items-center bg-whiskey-600 hover:bg-whiskey-500 text-white"
            >
              <Star className="h-4 w-4 mr-2" />
              Add Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhiskeyDetailModal;
