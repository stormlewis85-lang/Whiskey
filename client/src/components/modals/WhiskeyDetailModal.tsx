import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Whiskey } from "@shared/schema";
import { formatDate } from "@/lib/utils/calculations";

interface WhiskeyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
  onReview: (whiskey: Whiskey) => void;
}

const WhiskeyDetailModal = ({ isOpen, onClose, whiskey, onReview }: WhiskeyDetailModalProps) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <div className="relative">
          <div className="h-48 w-full bg-whiskey-100">
            {whiskey.image ? (
              <img 
                src={whiskey.image} 
                alt={`Bottle of ${whiskey.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-whiskey-100 text-whiskey-600">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                  />
                </svg>
              </div>
            )}
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
              <h3 className="font-medium text-gray-900 mb-4">Details</h3>
              
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
                    <div className="mb-2 font-medium text-whiskey-800">Bourbon Details</div>
                    
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
              <h3 className="font-medium text-gray-900 mb-4">Rating & Tasting Notes</h3>
              
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
