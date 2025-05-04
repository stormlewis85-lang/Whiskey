import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Whiskey, ReviewNote } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ReviewShareProps {
  whiskey: Whiskey;
  review: ReviewNote;
  className?: string;
}

const ReviewShare = ({ whiskey, review, className = '' }: ReviewShareProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  
  // Check if the review is already public
  const isPublic = review.isPublic || false;
  
  // Generate share URL mutation
  const generateShareUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        `/api/whiskeys/${whiskey.id}/reviews/${review.id}/share`,
        { isPublic: true }
      );
      return response.json();
    },
    onSuccess: (data) => {
      // Construct the full share URL
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/shared/${data.shareId}`;
      setShareUrl(url);
      
      toast({
        title: 'Review Shared',
        description: 'Your review is now publicly accessible via the generated link.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to share review: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handler for copying URL to clipboard
  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(
        () => {
          setCopied(true);
          toast({
            title: 'Link copied',
            description: 'The share link has been copied to your clipboard.',
          });
          
          // Reset copied state after 3 seconds
          setTimeout(() => setCopied(false), 3000);
        },
        () => {
          toast({
            title: 'Copy failed',
            description: 'Failed to copy link to clipboard.',
            variant: 'destructive',
          });
        }
      );
    }
  };

  // Handler for opening share dialog
  const handleOpenDialog = () => {
    setDialogOpen(true);
    
    // If the review is already public and has a shareId, generate the URL
    if (isPublic && review.shareId) {
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/shared/${review.shareId}`);
    } else {
      // Otherwise, generate a new shareId
      generateShareUrlMutation.mutate();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={className}>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleOpenDialog}
          >
            <Share2 className="h-4 w-4" />
            Share Review
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Whiskey Review</DialogTitle>
            <DialogDescription>
              Share this review of {whiskey.name} with others. They can view your review without needing an account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {generateShareUrlMutation.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <label className="text-sm font-medium mb-2 block">Share link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    type="button"
                    variant="outline" 
                    onClick={copyToClipboard}
                    className="flex-shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewShare;