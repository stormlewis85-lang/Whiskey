import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Whiskey, ReviewNote } from '@shared/schema';
import { ReviewDetailPage } from '@/components/ReviewDetailPage';
import { Header } from '@/components/Header';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

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
    queryKey: [`/api/whiskeys/${whiskeyId}/reviews/${reviewId}`],
    enabled: !isNaN(whiskeyId) && !!reviewId,
    retry: 1,
  });

  // Go back to the previous page
  const handleBack = () => {
    setLocation('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted-foreground/20" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-muted-foreground border-t-transparent animate-spin" />
          </div>
          <p className="mt-6 text-muted-foreground font-medium">Loading review...</p>
        </div>
      </div>
    );
  }

  if (isError || !reviewData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card className="bg-card border-destructive/30 shadow-warm-sm">
              <CardHeader className="text-center pb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-foreground">Review Not Found</CardTitle>
                <CardDescription className="text-muted-foreground">
                  The review you're looking for doesn't exist or has been removed.
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-center pt-4">
                <Button onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const { whiskey, review } = reviewData;

  // Extra validation to prevent downstream errors
  if (!whiskey || !review) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card className="bg-card border-warning/30 shadow-warm-sm">
              <CardHeader className="text-center pb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-warning" />
                </div>
                <CardTitle className="text-foreground">Invalid Review Data</CardTitle>
                <CardDescription className="text-muted-foreground">
                  The data received from the server was incomplete or invalid.
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-center pt-4">
                <Button onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <Button onClick={handleBack} variant="outline" className="border-border/50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collection
          </Button>
        </div>

        <ReviewDetailPage whiskey={whiskey} review={review} />
      </div>
    </div>
  );
}
