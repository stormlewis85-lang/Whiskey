import React, { useState, useEffect } from 'react';
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
  
  // Find the specific review from the whiskey object
  const review = whiskey?.notes?.find(note => note.id === reviewId);
  
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