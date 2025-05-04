import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Whiskey, ReviewNote, User } from '@shared/schema';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageSquare, Share2 } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import ReviewLikes from './ReviewLikes';

interface PublicReview {
  whiskey: Whiskey;
  review: ReviewNote;
  user: User;
  likes?: number;
  comments?: number;
  userHasLiked?: boolean;
}

const ReviewCard = ({
  whiskey,
  review,
  user,
  likes = 0,
  comments = 0,
  userHasLiked = false
}: PublicReview) => {
  // Calculate preview text (first 150 characters)
  const previewText = review.text.length > 150 
    ? `${review.text.substring(0, 150)}...` 
    : review.text;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get initials for avatar
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">{formatDate(review.date)}</p>
            </div>
          </div>
          <Badge variant="outline">{whiskey.type}</Badge>
        </div>
        <h3 className="text-lg font-semibold line-clamp-1">{whiskey.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {whiskey.distillery}
          {whiskey.age && ` • ${whiskey.age} years`}
          {whiskey.abv && ` • ${whiskey.abv}% ABV`}
        </p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex justify-between items-start mb-3">
          <div className="text-2xl font-bold text-amber-600">{review.rating.toFixed(1)}</div>
        </div>
        <p className="text-sm line-clamp-4">{previewText}</p>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 gap-2">
        <ReviewLikes whiskey={whiskey} review={review} size="sm" />
        
        <Button 
          asChild
          variant="outline" 
          size="sm"
          className="h-7 px-2 text-xs"
        >
          <Link to={`/shared/${review.shareId}`}>
            <Share2 className="h-3 w-3 mr-1" /> 
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

interface PublicReviewsGridProps {
  limit?: number;
  className?: string;
}

const PublicReviewsGrid = ({ limit = 6, className = '' }: PublicReviewsGridProps) => {
  const { data: reviews = [], isLoading, error } = useQuery<PublicReview[]>({
    queryKey: [`/api/reviews/public?limit=${limit}`],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  if (error) {
    return (
      <div className={`p-6 bg-red-50 text-red-700 rounded-md ${className}`}>
        Failed to load public reviews. Please try again later.
      </div>
    );
  }

  return (
    <div className={className}>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(limit).fill(0).map((_, i) => (
            <Card key={i} className="h-96">
              <CardHeader className="pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-6 w-4/5 mb-1 mt-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="h-8 w-10" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex justify-between w-full">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <ReviewCard
              key={`${review.whiskey.id}-${review.review.id}`}
              whiskey={review.whiskey}
              review={review.review}
              user={review.user}
              likes={review.likes}
              comments={review.comments}
              userHasLiked={review.userHasLiked}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No public reviews yet</h3>
          <p className="text-muted-foreground mb-6">
            Be the first to share your whiskey review with the community!
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicReviewsGrid;