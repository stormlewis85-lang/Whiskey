import { Whiskey } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/calculations"; // Now properly imported
import { PencilIcon } from "lucide-react";

interface WhiskeyCardProps {
  whiskey: Whiskey;
  onViewDetails: (whiskey: Whiskey) => void;
  onReview: (whiskey: Whiskey) => void;
  onEdit: (whiskey: Whiskey) => void;
}

const WhiskeyCard = ({ whiskey, onViewDetails, onReview, onEdit }: WhiskeyCardProps) => {
  return (
    <Card className="card whiskey-card overflow-hidden">
      <div className="flex flex-col md:flex-row h-full">
        {/* Left side: Image with 3:4 aspect ratio */}
        <div className="md:w-1/3 relative">
          <div className="aspect-[3/4] bg-whiskey-100 h-full">
            {whiskey.image ? (
              <img 
                src={whiskey.image} 
                alt={`Bottle of ${whiskey.name}`} 
                className="object-cover h-full w-full"
              />
            ) : (
              <div className="text-whiskey-400 text-center p-4 h-full flex items-center justify-center">
                <div className="border-2 border-whiskey-200 border-dashed rounded-md p-4 flex flex-col items-center justify-center h-[80%] w-[80%]">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-12 w-12 mb-2" 
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
                  <span className="text-xs">No Image</span>
                </div>
              </div>
            )}
            {whiskey.type && (
              <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs font-semibold">
                {whiskey.type}
              </div>
            )}
          </div>
        </div>
        
        {/* Right side: Whiskey details */}
        <CardContent className="p-4 md:w-2/3 flex flex-col">
          <h3 className="font-serif font-semibold text-lg truncate text-[#593d25]">{whiskey.name}</h3>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[#986A44] text-sm truncate">{whiskey.distillery || 'Unknown Distillery'}</p>
            <p className="text-[#794e2f] font-medium">
              {whiskey.price ? `$${whiskey.price}` : ''}
            </p>
          </div>
          
          {/* Bourbon badges */}
          {whiskey.type === "Bourbon" && (
            <div className="flex flex-wrap gap-1 mt-2">
              {whiskey.bottleType && whiskey.bottleType !== "none" && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs">
                  {whiskey.bottleType}
                </Badge>
              )}
              
              {whiskey.mashBill && whiskey.mashBill !== "none" && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200 text-xs">
                  {whiskey.mashBill}
                </Badge>
              )}
              
              {whiskey.caskStrength === "Yes" && (
                <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200 text-xs">
                  Cask Strength
                </Badge>
              )}
              
              {whiskey.finished === "Yes" && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs">
                  {whiskey.finishType ? `${whiskey.finishType} Finish` : 'Finished'}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg 
                key={star}
                className={`w-5 h-5 ${star <= (whiskey.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor" 
                viewBox="0 0 20 20" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
            ))}
            <span className="text-sm text-gray-500 ml-1">
              {Array.isArray(whiskey.notes) ? `(${whiskey.notes.length})` : '(0)'}
            </span>
          </div>
          
          {/* Push buttons to the bottom */}
          <div className="flex mt-auto pt-4 space-x-2">
            <Button
              onClick={() => onEdit(whiskey)}
              variant="ghost"
              size="icon"
              className="text-[#794e2f] hover:bg-[#f5efe0] h-9 w-9 p-0 rounded-full"
              title="Edit whiskey"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onViewDetails(whiskey)}
              variant="outline"
              className="border-[#d9c4a3] text-[#794e2f] hover:bg-[#f5efe0] flex-grow"
            >
              Details
            </Button>
            <Button
              onClick={() => onReview(whiskey)}
              className="barrel-button flex-grow"
            >
              Review
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default WhiskeyCard;
