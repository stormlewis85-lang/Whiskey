import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Whiskey, ReviewNote } from '@shared/schema';
import { ReviewDetailPage } from '@/components/ReviewDetailPage';
import { Header } from '@/components/Header';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReviewPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string, reviewId: string }>();
  const whiskeyId = parseInt(params.id);
  const reviewId = params.reviewId;
  
  const { data: whiskey, isLoading: isWhiskeyLoading, isError: isWhiskeyError } = useQuery<Whiskey>({
    queryKey: ['/api/whiskeys', whiskeyId],
    enabled: !isNaN(whiskeyId),
  });
  
  // For debugging - VERY DETAILED LOGGING
  console.log("==== REVIEW DEBUGGING ====");
  console.log("ReviewPage - reviewId from URL:", reviewId);
  console.log("ReviewPage - reviewId from URL type:", typeof reviewId);
  console.log("ReviewPage - full whiskey object:", whiskey);
  
  if (whiskey && whiskey.notes) {
    if (Array.isArray(whiskey.notes)) {
      console.log("ReviewPage - Whiskey has notes array of length:", whiskey.notes.length);
      whiskey.notes.forEach((note: ReviewNote, index) => {
        console.log(`Note #${index}:`, {
          id: note.id,
          idType: typeof note.id,
          stringCompare: String(note.id) === String(reviewId),
          directCompare: note.id === reviewId
        });
      });
    } else {
      console.log("ReviewPage - Whiskey.notes is not an array:", typeof whiskey.notes);
    }
  } else {
    console.log("ReviewPage - No notes found on whiskey object");
  }
  
  // Try multiple matching strategies
  const reviewByDirect = whiskey && Array.isArray(whiskey.notes) 
    ? whiskey.notes.find((note: ReviewNote) => note.id === reviewId)
    : undefined;
    
  const reviewByString = whiskey && Array.isArray(whiskey.notes) 
    ? whiskey.notes.find((note: ReviewNote) => String(note.id) === String(reviewId))
    : undefined;
    
  const reviewByIncludes = whiskey && Array.isArray(whiskey.notes) 
    ? whiskey.notes.find((note: ReviewNote) => note.id && reviewId && note.id.includes(reviewId))
    : undefined;
    
  console.log("Review found by direct comparison:", !!reviewByDirect);
  console.log("Review found by string comparison:", !!reviewByString);
  console.log("Review found by includes:", !!reviewByIncludes);
  
  // Use the first successful strategy
  const review = reviewByDirect || reviewByString || reviewByIncludes;
  console.log("Final review object:", review);
  console.log("==== END DEBUGGING ====");
  
  // Go back to the previous page
  const handleBack = () => {
    setLocation('/');
  };
  
  if (isWhiskeyLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </div>
    );
  }
  
  if (isWhiskeyError || !whiskey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Whiskey Not Found</h2>
            <p className="text-gray-600 mb-6">The whiskey you're looking for doesn't exist or has been removed.</p>
            <Button onClick={handleBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Review Not Found</h2>
            <p className="text-gray-600 mb-6">The review you're looking for doesn't exist or has been removed.</p>
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