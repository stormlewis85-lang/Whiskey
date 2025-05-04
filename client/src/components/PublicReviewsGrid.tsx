import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Whiskey, ReviewNote, User } from '@shared/schema';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WhiskeyCategory } from '@/components/ui/whiskey-category';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, MessageSquare, Heart, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

interface PublicReview {
  whiskey: Whiskey;
  review: ReviewNote;
  user: User;
  likes?: number;
  comments?: number;
  userHasLiked?: boolean;
}

const PublicReviewCard = ({ 
  review,
  whiskey, 
  user,
  likes = 0,
  comments = 0,
  userHasLiked = false
}: PublicReview) => {
  // Format to show a snippet of the review
  const formatReviewSnippet = (text: string) => {
    // Remove section headers and formatting
    const cleanText = text.replace(/## (.*?) ##/g, '')
                         .replace(/[A-Z]+:/g, '')
                         .trim();
    
    // Get first 120 characters
    const snippet = cleanText.slice(0, 120);
    return snippet + (cleanText.length > 120 ? '...' : '');
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <WhiskeyCategory type={whiskey.type} />
              <Badge variant="outline" className="text-xs">
                {user.username}
              </Badge>
            </div>
            <CardTitle className="text-xl">{whiskey.name}</CardTitle>
            <CardDescription>
              {whiskey.distillery}
              {whiskey.age && ` • ${whiskey.age} years`}
              {whiskey.abv && ` • ${whiskey.abv}% ABV`}
            </CardDescription>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{review.rating.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">
          {formatReviewSnippet(review.text)}
        </p>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Heart className={`h-4 w-4 mr-1 ${userHasLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likes}</span>
          </div>
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>{comments}</span>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={`/shared/${review.shareId}`} className="flex items-center">
            <span className="mr-1">View</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const SkeletonReviewCard = () => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-5 w-10" />
        </div>
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
  )
};

interface PublicReviewsGridProps {
  limit?: number;
  className?: string;
}

const PublicReviewsGrid = ({ limit = 6, className = '' }: PublicReviewsGridProps) => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = limit;
  
  const { data, isLoading, error } = useQuery<PublicReview[]>({
    queryKey: ['/api/reviews/public', page, pageSize],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  if (error) {
    return (
      <div className={`${className} p-4 bg-red-50 rounded-lg border border-red-200 text-red-700`}>
        Error loading public reviews. Please try again later.
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-2xl font-semibold mb-6">Community Reviews</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Show skeleton cards while loading
          Array(6).fill(0).map((_, i) => <SkeletonReviewCard key={i} />)
        ) : data && data.length > 0 ? (
          // Show review cards
          data.map((item) => (
            <PublicReviewCard 
              key={`${item.whiskey.id}-${item.review.id}`}
              whiskey={item.whiskey}
              review={item.review}
              user={item.user}
              likes={item.likes || 0}
              comments={item.comments || 0}
              userHasLiked={item.userHasLiked}
            />
          ))
        ) : (
          // No reviews found
          <div className="col-span-full p-6 bg-gray-50 rounded-lg text-center">
            <p className="text-muted-foreground">No public reviews available.</p>
            {user && (
              <p className="mt-2 text-sm">
                Share your own reviews to be the first to contribute!
              </p>
            )}
          </div>
        )}
      </div>
      
      {data && data.length >= pageSize && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button 
              variant="outline" 
              onClick={() => setPage(p => p + 1)}
              disabled={data.length < pageSize}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicReviewsGrid;