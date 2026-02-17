import React, { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Whiskey, ReviewNote } from '@shared/schema';
import { ShareImageCard, ShareImageCardFull, ImageSize } from '@/components/export/ShareImageCard';
import {
  Download,
  Image,
  Loader2,
  Square,
  RectangleVertical,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';

interface ShareAsImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
  review?: ReviewNote;
}

const sizeOptions: { value: ImageSize; label: string; icon: React.ReactNode }[] = [
  { value: 'square', label: 'Square', icon: <Square className="h-4 w-4" /> },
  { value: 'portrait', label: 'Portrait', icon: <RectangleVertical className="h-4 w-4" /> },
  { value: 'story', label: 'Story', icon: <Smartphone className="h-4 w-4" /> },
];

const ShareAsImageModal = ({ isOpen, onClose, whiskey, review }: ShareAsImageModalProps) => {
  const { toast } = useToast();
  const [size, setSize] = useState<ImageSize>('square');
  const [showBranding, setShowBranding] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const renderRef = useRef<HTMLDivElement>(null);

  const generateImage = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    // Create a hidden container for rendering at full size
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    // Render the full-size card
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(container);

    return new Promise((resolve) => {
      const captureRef = { current: null as HTMLDivElement | null };

      const CardWrapper = () => {
        const ref = useCallback((node: HTMLDivElement | null) => {
          if (node) {
            captureRef.current = node;
            // Wait for images to load
            const images = node.getElementsByTagName('img');
            const imagePromises = Array.from(images).map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((res) => {
                img.onload = res;
                img.onerror = res;
              });
            });

            Promise.all(imagePromises).then(async () => {
              // Small delay to ensure rendering is complete
              await new Promise((r) => setTimeout(r, 100));

              try {
                const canvas = await html2canvas(node, {
                  scale: 1,
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: null,
                  logging: false,
                });

                root.unmount();
                document.body.removeChild(container);
                resolve(canvas);
              } catch (error) {
                console.error('Error generating image:', error);
                root.unmount();
                document.body.removeChild(container);
                resolve(null);
              }
            });
          }
        }, []);

        return (
          <ShareImageCardFull
            ref={ref}
            whiskey={whiskey}
            review={review}
            size={size}
            showBranding={showBranding}
          />
        );
      };

      root.render(<CardWrapper />);
    });
  }, [whiskey, review, size, showBranding]);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateImage();
      if (!canvas) {
        throw new Error('Failed to generate image');
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${whiskey.name.replace(/[^a-zA-Z0-9]/g, '_')}_review.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: 'Image downloaded!',
          description: 'Your share image has been saved.',
        });
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateImage();
      if (!canvas) {
        throw new Error('Failed to generate image');
      }

      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
          toast({
            title: 'Copied to clipboard!',
            description: 'You can now paste the image anywhere.',
          });
        } catch (clipboardError) {
          // Fallback for browsers that don't support clipboard API
          console.error('Clipboard error:', clipboardError);
          toast({
            title: 'Clipboard not supported',
            description: 'Please use the download button instead.',
            variant: 'destructive',
          });
        }
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-muted-foreground" />
            Share as Image
          </DialogTitle>
          <DialogDescription>
            Create a beautiful shareable image of this {review ? 'review' : 'whiskey'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Size selector */}
          <div className="space-y-2">
            <Label>Image Size</Label>
            <Tabs value={size} onValueChange={(v) => setSize(v as ImageSize)}>
              <TabsList className="grid w-full grid-cols-3">
                {sizeOptions.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="gap-2"
                  >
                    {option.icon}
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground">
              {size === 'square' && 'Best for Instagram feed posts (1080x1080)'}
              {size === 'portrait' && 'Best for Instagram/Facebook posts (1080x1350)'}
              {size === 'story' && 'Best for Stories/Reels (1080x1920)'}
            </p>
          </div>

          {/* Branding toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>WhiskeyPedia Branding</Label>
              <p className="text-xs text-muted-foreground">
                Show the WhiskeyPedia logo on the image
              </p>
            </div>
            <Switch
              checked={showBranding}
              onCheckedChange={setShowBranding}
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex justify-center p-4 bg-muted/50 rounded-lg border">
              <ShareImageCard
                ref={renderRef}
                whiskey={whiskey}
                review={review}
                size={size}
                showBranding={showBranding}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopyToClipboard}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : isCopied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {isCopied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
            <Button
              className="flex-1"
              onClick={handleDownload}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareAsImageModal;
