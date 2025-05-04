import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { getQueryFn } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WhiskeyCategory } from '@/components/ui/whiskey-category';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import ReviewLikes from '@/components/ReviewLikes';
import ReviewComments from '@/components/ReviewComments';
import { useAuth } from '@/hooks/use-auth';

interface SharedReviewData {
  whiskey: {
    id: number;
    name: string;
    distillery: string;
    type: string;
    age: number | null;
    price: number | null;
    abv: number | null;
    region: string | null;
    bottleType?: string | null;
    mashBill?: string | null;
    caskStrength?: boolean | null;
    imageUrl?: string | null;
  };
  review: {
    id: string;
    rating: number;
    date: string;
    text: string;
    flavor: string;
    visual?: string;
    nose?: string;
    mouthfeel?: string;
    taste?: string;
    finish?: string;
    value?: string;
  };
  user: {
    id: number;
    username: string;
  };
}

const SharedReview = () => {
  const { shareId } = useParams();
  const { data, isLoading, error } = useQuery<SharedReviewData>({
    queryKey: [`/api/shared/${shareId}`],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Review Not Found</CardTitle>
            <CardDescription className="text-red-600">
              This review may have been removed or made private by the author.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link to="/">Go to Homepage</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const { whiskey, review, user } = data;

  // Extract overall rating
  const overallRating = review.rating;

  // Function to format review text for display
  const formatReviewText = (text: string) => {
    // Replace section headers with styled headers
    const formattedText = text
      .replace(/## (.*?) ##/g, '<h3 class="text-lg font-bold mt-4 mb-2 text-amber-800">$1</h3>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    
    return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  const { user: currentUser } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <WhiskeyCategory type={whiskey.type} />
                <span className="text-sm text-muted-foreground">Shared by {user.username}</span>
              </div>
              <CardTitle className="text-2xl">{whiskey.name}</CardTitle>
              <CardDescription>
                {whiskey.distillery}
                {whiskey.age && ` • ${whiskey.age} years`}
                {whiskey.abv && ` • ${whiskey.abv}% ABV`}
                {whiskey.region && ` • ${whiskey.region}`}
              </CardDescription>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{overallRating.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-4 space-y-4">
            {whiskey.imageUrl && (
              <img
                src={whiskey.imageUrl}
                alt={whiskey.name}
                className="w-full max-h-64 object-contain rounded-md"
              />
            )}
            <div className="mt-6 prose prose-amber max-w-none text-sm">
              {formatReviewText(review.text)}
            </div>
          </div>
          
          {/* Review Actions */}
          <div className="mt-8 pt-4 border-t flex items-center justify-between">
            <ReviewLikes whiskey={whiskey} review={review} />
            
            <div className="text-sm text-muted-foreground">
              Reviewed on {new Date(review.date).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button asChild variant="outline">
            <Link to="/">Back to Collection</Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Comments Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <ReviewComments whiskey={whiskey} review={review} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedReview;