import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Whiskey, ReviewNote, ReviewLike } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewLikesProps {
  whiskey: Whiskey;
  review: ReviewNote;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ReviewLikes = ({ whiskey, review, className = '', size = 'md' }: ReviewLikesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Query to get likes
  const { 
    data: likes = [], 
    isLoading,
    error,
    refetch
  } = useQuery<ReviewLike[]>({
    queryKey: [`/api/whiskeys/${whiskey.id}/reviews/${review.id}/likes`],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!whiskey.id && !!review.id,
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        `/api/whiskeys/${whiskey.id}/reviews/${review.id}/like`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update like status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Check if the current user has liked this review
  const hasUserLiked = user ? likes.some(like => like.userId === user.id) : false;
  
  // Get the button and heart icon sizes based on the size prop
  const buttonSizes = {
    sm: "h-7 px-2 text-xs",
    md: "h-9 px-3 text-sm",
    lg: "h-10 px-4"
  };
  
  const heartSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  
  const badgeSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  // Handler for toggling like
  const handleToggleLike = () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to like reviews.',
        variant: 'destructive',
      });
      return;
    }
    
    toggleLikeMutation.mutate();
  };

  if (error) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isLoading ? (
        <>
          <Skeleton className={`${buttonSizes[size]} w-16`} />
          <Skeleton className={`${badgeSizes[size]} h-6 w-8 rounded-full`} />
        </>
      ) : (
        <>
          <Button
            variant={hasUserLiked ? "default" : "outline"}
            size="sm"
            className={buttonSizes[size]}
            onClick={handleToggleLike}
            disabled={toggleLikeMutation.isPending}
          >
            <Heart 
              className={`${heartSizes[size]} ${hasUserLiked ? 'fill-white' : ''} mr-1`} 
            />
            {hasUserLiked ? 'Liked' : 'Like'}
          </Button>
          
          {likes.length > 0 && (
            <Badge variant="secondary" className={badgeSizes[size]}>
              {likes.length} {likes.length === 1 ? 'like' : 'likes'}
            </Badge>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewLikes;