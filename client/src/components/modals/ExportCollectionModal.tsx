import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Whiskey, User } from '@shared/schema';
import { generateCollectionPDF } from '@/lib/utils/pdfExport';
import {
  FileText,
  Download,
  Loader2,
  BarChart3,
  MessageSquare,
  Heart,
  FolderTree
} from 'lucide-react';

interface ExportCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskeys: Whiskey[];
}

type GroupByOption = 'none' | 'type' | 'distillery' | 'region';

const groupByOptions: { value: GroupByOption; label: string }[] = [
  { value: 'type', label: 'By Type (Bourbon, Scotch, etc.)' },
  { value: 'distillery', label: 'By Distillery' },
  { value: 'region', label: 'By Region' },
  { value: 'none', label: 'No Grouping (List All)' },
];

const ExportCollectionModal = ({ isOpen, onClose, whiskeys }: ExportCollectionModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeReviews, setIncludeReviews] = useState(true);
  const [includeWishlist, setIncludeWishlist] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupByOption>('type');

  const collectionCount = whiskeys.filter(w => !w.isWishlist).length;
  const wishlistCount = whiskeys.filter(w => w.isWishlist).length;

  const handleExport = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to export.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateCollectionPDF(whiskeys, user as User, {
        title: 'Whiskey Collection Report',
        includeStats,
        includeReviews,
        includeWishlist,
        groupBy,
      });

      toast({
        title: 'PDF Downloaded!',
        description: 'Your collection report has been saved.',
      });
      onClose();
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Export Collection as PDF
          </DialogTitle>
          <DialogDescription>
            Generate a printable PDF report of your whiskey collection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Collection summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Collection:</span>
              <span className="font-medium">{collectionCount} bottles</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Wishlist:</span>
              <span className="font-medium">{wishlistCount} items</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-muted-foreground" />
                Group By
              </Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groupByOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label>Include Statistics</Label>
                  <p className="text-xs text-muted-foreground">
                    Collection overview with totals and charts
                  </p>
                </div>
              </div>
              <Switch
                checked={includeStats}
                onCheckedChange={setIncludeStats}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label>Include Review Excerpts</Label>
                  <p className="text-xs text-muted-foreground">
                    Show tasting notes for each whiskey
                  </p>
                </div>
              </div>
              <Switch
                checked={includeReviews}
                onCheckedChange={setIncludeReviews}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-pink-500" />
                <div className="space-y-0.5">
                  <Label>Include Wishlist</Label>
                  <p className="text-xs text-muted-foreground">
                    Add wishlist items to the report
                  </p>
                </div>
              </div>
              <Switch
                checked={includeWishlist}
                onCheckedChange={setIncludeWishlist}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isGenerating || whiskeys.length === 0}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportCollectionModal;
