import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Whiskey, ReviewNote, User } from '@shared/schema';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Share2, Wine, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import ReviewLikes from './ReviewLikes';
import { cn } from '@/lib/utils';

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
    <Card className="group h-full flex flex-col bg-card border-border/50 shadow-warm-sm hover:shadow-warm hover:border-border transition-all duration-300">
      <CardHeader className="pb-3 pt-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border-2 border-border">
              <AvatarFallback className="bg-muted text-muted-foreground font-medium text-sm">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{user.displayName || user.username}</p>
              <p className="text-xs text-muted-foreground">{formatDate(review.date)}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-accent/50 border-border/50 text-xs">
            {whiskey.type}
          </Badge>
        </div>
        <h3 className="text-lg font-semibold text-foreground line-clamp-1 transition-colors">
          {whiskey.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {whiskey.distillery}
          {whiskey.age && ` • ${whiskey.age} years`}
          {whiskey.abv && ` • ${whiskey.abv}% ABV`}
        </p>
      </CardHeader>
      <CardContent className="flex-grow pt-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-lg font-bold text-foreground">{review.rating.toFixed(1)}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">{previewText}</p>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-border/30 pt-3 gap-2">
        <ReviewLikes whiskey={whiskey} review={review} size="sm" />

        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs border-border/50 hover:bg-accent/50 hover:border-border"
        >
          <Link to={`/shared/${review.shareId}`}>
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
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
      <div className={cn(
        "bg-card border border-destructive/30 rounded-xl shadow-warm-sm p-8 text-center",
        className
      )}>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Failed to load reviews</h3>
        <p className="mt-2 text-muted-foreground">
          There was an error loading community reviews. Please try again later.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array(limit).fill(0).map((_, i) => (
            <Card key={i} className="h-[320px] bg-card border-border/50">
              <CardHeader className="pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-4/5 mb-1 mt-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="pt-4">
                <Skeleton className="h-8 w-16 rounded-full mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/30 pt-3">
                <div className="flex justify-between w-full">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {reviews.map((review) => (
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
        <div className="bg-card border border-border/50 rounded-xl shadow-warm-sm p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
            <Wine className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">No reviews yet</h3>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Be the first to share your whiskey review with the community! Your tasting notes could help others discover their next favorite pour.
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicReviewsGrid;
