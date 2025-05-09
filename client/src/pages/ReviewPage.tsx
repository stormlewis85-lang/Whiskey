import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Whiskey, ReviewNote } from '@shared/schema';
import { ReviewDetailPage } from '@/components/ReviewDetailPage';
import { Header } from '@/components/Header';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReviewData {
  whiskey: Whiskey;
  review: ReviewNote;
}

export default function ReviewPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string, reviewId: string }>();
  const whiskeyId = parseInt(params.id);
  const reviewId = params.reviewId;
  
  // Use the dedicated endpoint to get both whiskey and review at once
  const { 
    data: reviewData,
    isLoading, 
    isError,
    error
  } = useQuery<ReviewData>({
    queryKey: ['/api/whiskeys', whiskeyId, 'reviews', reviewId],
    enabled: !isNaN(whiskeyId) && !!reviewId
  });
  
  // For debugging only
  console.log("ReviewPage - Loading review data:", {
    whiskeyId,
    reviewId,
    isLoading,
    isError,
    error,
    reviewData
  });
  
  // Go back to the previous page
  const handleBack = () => {
    setLocation('/');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </div>
    );
  }
  
  if (isError || !reviewData) {
    console.error("Error loading review data:", error);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Review Not Found</h2>
            <p className="text-gray-600 mb-6">
              The review you're looking for doesn't exist or has been removed.
            </p>
            <div className="mb-4 text-left p-4 bg-gray-50 rounded text-sm font-mono">
              <p>Whiskey ID: {whiskeyId}</p>
              <p>Review ID: {reviewId}</p>
              <p>Error: {error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
            <Button onClick={handleBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }
  
  const { whiskey, review } = reviewData;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-8">
        <div className="mb-4">
          <Button onClick={handleBack} variant="outline">
            &larr; Back to Collection
          </Button>
        </div>
        
        <ReviewDetailPage whiskey={whiskey} review={review} />
      </div>
    </div>
  );
}