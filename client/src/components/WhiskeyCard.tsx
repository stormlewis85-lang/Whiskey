import { Whiskey } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/calculations";

interface WhiskeyCardProps {
  whiskey: Whiskey;
  onViewDetails: (whiskey: Whiskey) => void;
  onReview: (whiskey: Whiskey) => void;
}

const WhiskeyCard = ({ whiskey, onViewDetails, onReview }: WhiskeyCardProps) => {
  return (
    <Card className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <div className="aspect-w-4 aspect-h-3 bg-whiskey-100">
          <div className="h-48 w-full bg-whiskey-100 flex items-center justify-center overflow-hidden">
            {whiskey.image ? (
              <img 
                src={whiskey.image} 
                alt={`Bottle of ${whiskey.name}`} 
                className="object-cover h-full w-full"
              />
            ) : (
              <div className="text-whiskey-400 text-center p-4">
                <div className="border-2 border-whiskey-200 border-dashed rounded-md p-4 flex flex-col items-center justify-center h-full">
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
          </div>
        </div>
        {whiskey.type && (
          <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs font-semibold">
            {whiskey.type}
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate">{whiskey.name}</h3>
        <div className="flex justify-between items-center mt-1">
          <p className="text-gray-600 text-sm truncate">{whiskey.distillery || 'Unknown Distillery'}</p>
          <p className="text-whiskey-600 font-medium">
            {whiskey.price ? `$${whiskey.price}` : ''}
          </p>
        </div>
        
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
        
        <div className="flex mt-4 space-x-2">
          <Button
            onClick={() => onViewDetails(whiskey)}
            variant="outline"
            className="bg-whiskey-100 hover:bg-whiskey-200 text-whiskey-700 flex-grow"
          >
            Details
          </Button>
          <Button
            onClick={() => onReview(whiskey)}
            className="bg-whiskey-600 hover:bg-whiskey-500 text-white flex-grow"
          >
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhiskeyCard;
