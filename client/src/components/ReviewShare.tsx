import React from 'react';
import { Whiskey, ReviewNote } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ReviewShareProps {
  whiskey: Whiskey;
  review: ReviewNote;
  className?: string;
}

const ReviewShare = ({ whiskey, review, className = '' }: ReviewShareProps) => {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/shared/${review.shareId}`;

  const toggleShareMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        `/api/whiskeys/${whiskey.id}/reviews/${review.id}/share`,
        { isPublic: !review.isPublic }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whiskeys'] });
      toast({
        title: review.isPublic ? 'Review made private' : 'Review shared publicly',
        description: review.isPublic 
          ? 'Your review is now private and cannot be seen by others.' 
          : 'Your review is now public and can be seen by others.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update sharing status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = () => {
    if (navigator.clipboard && review.shareId) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copied',
        description: 'Share link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: 'Unable to copy',
        description: 'Please manually copy the link',
        variant: 'destructive',
      });
    }
  };

  if (!review.shareId && !review.isPublic) {
    return null;
  }

  return (
    <div className={`bg-blue-50 p-4 rounded-lg border border-blue-200 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Share2 className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-800">Review Sharing</h3>
        </div>
        <Badge variant={review.isPublic ? "success" : "secondary"}>
          {review.isPublic ? "Public" : "Private"}
        </Badge>
      </div>
      
      {review.isPublic && review.shareId && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-2">Share this link to your review:</p>
          <div className="flex items-center">
            <input 
              type="text" 
              value={shareUrl}
              readOnly
              className="flex-1 p-2 text-xs rounded-l-md border border-gray-300 bg-gray-50"
            />
            <Button
              size="sm"
              variant="outline"
              className="rounded-l-none h-[34px]"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button
          size="sm"
          variant={review.isPublic ? "destructive" : "outline"}
          onClick={() => toggleShareMutation.mutate()}
          disabled={toggleShareMutation.isPending}
        >
          {toggleShareMutation.isPending
            ? "Updating..."
            : review.isPublic
              ? "Make Private"
              : "Make Public"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewShare;