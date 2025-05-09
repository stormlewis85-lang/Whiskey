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
  
  // For VERY DETAILED debugging, log everything related to our data
  console.log("=== REVIEW PAGE TRACING BEGINS ===");
  console.log("URL Parameters:", { id: params.id, reviewId: params.reviewId });
  console.log("Parsed IDs:", { whiskeyId, reviewId, whiskeyIdType: typeof whiskeyId, reviewIdType: typeof reviewId });
  
  // Use the dedicated endpoint to get both whiskey and review at once
  const { 
    data: reviewData,
    isLoading, 
    isError,
    error
  } = useQuery<ReviewData>({
    queryKey: [`/api/whiskeys/${whiskeyId}/reviews/${reviewId}`],
    enabled: !isNaN(whiskeyId) && !!reviewId,
    retry: 1,
  });
  
  // Log our query and results
  console.log("Query info:", {
    endpoint: `/api/whiskeys/${whiskeyId}/reviews/${reviewId}`,
    queryKey: [`/api/whiskeys/${whiskeyId}/reviews/${reviewId}`],
    isEnabled: !isNaN(whiskeyId) && !!reviewId,
    isLoading,
    isError
  });
  
  // Make an explicit fetch call just for debugging purposes
  React.useEffect(() => {
    if (!isNaN(whiskeyId) && reviewId) {
      const debugFetch = async () => {
        try {
          const response = await fetch(`/api/whiskeys/${whiskeyId}/reviews/${reviewId}`, {
            credentials: 'include'
          });
          console.log("DEBUG Fetch Status:", response.status);
          if (response.ok) {
            const data = await response.json();
            console.log("DEBUG Fetch Response:", data);
          } else {
            const errorText = await response.text();
            console.error("DEBUG Fetch Error:", errorText);
          }
        } catch (err) {
          console.error("DEBUG Fetch Exception:", err);
        }
      };
      debugFetch();
    }
  }, [whiskeyId, reviewId]);
  
  console.log("Review data from query:", reviewData);
  console.log("Error if any:", error);
  console.log("=== REVIEW PAGE TRACING ENDS ===");
  
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
            <div className="mb-4 text-left p-4 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
              <p>Whiskey ID: {whiskeyId}</p>
              <p>Review ID: {reviewId}</p>
              <p>Error: {error instanceof Error ? error.message : "Unknown error"}</p>
              <p>Query Key: {JSON.stringify([`/api/whiskeys/${whiskeyId}/reviews/${reviewId}`])}</p>
            </div>
            <Button onClick={handleBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }
  
  const { whiskey, review } = reviewData;
  
  // Extra validation to prevent downstream errors
  if (!whiskey || !review) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid Review Data</h2>
            <p className="text-gray-600 mb-6">
              The data received from the server was incomplete or invalid.
            </p>
            <div className="mb-4 text-left p-4 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
              <p>Whiskey ID: {whiskeyId}</p>
              <p>Review ID: {reviewId}</p>
              <p>Whiskey data received: {whiskey ? 'Yes' : 'No'}</p>
              <p>Review data received: {review ? 'Yes' : 'No'}</p>
              <p>Raw data: {JSON.stringify(reviewData)}</p>
            </div>
            <Button onClick={handleBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }
  
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