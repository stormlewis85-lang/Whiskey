import { useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Wine, Pencil as PencilIcon, Star, Upload, Edit, Trash2,
  BookOpen, PenIcon, XIcon, AlertTriangle, Loader2,
  DollarSign, BarChart2, Eye, Calendar, MapPin, Droplets, Clock,
  Heart, Package, PackageOpen, Gift, CheckCircle2, Plus, Minus, ArrowRight,
  Image, Mic
} from "lucide-react";
import { useLocation } from 'wouter';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Whiskey, ReviewNote, bottleStatusValues, BottleStatus } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EditReviewModal from "./EditReviewModal";
import PriceTrackingModal from "./PriceTrackingModal";
import ShareAsImageModal from "./ShareAsImageModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface WhiskeyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
  onReview: (whiskey: Whiskey) => void;
  onEdit: (whiskey: Whiskey) => void;
  onTasteWithRick?: (whiskey: Whiskey) => void;
}

const WhiskeyDetailModal = ({ isOpen, onClose, whiskey, onReview, onEdit, onTasteWithRick }: WhiskeyDetailModalProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewNote | null>(null);
  const [isEditReviewModalOpen, setIsEditReviewModalOpen] = useState(false);
  const [isPriceTrackingModalOpen, setIsPriceTrackingModalOpen] = useState(false);
  const [isShareImageModalOpen, setIsShareImageModalOpen] = useState(false);
  const [reviewForShare, setReviewForShare] = useState<ReviewNote | undefined>(undefined);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Format dates
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get formatted date strings
  const dateAdded = whiskey.dateAdded
    ? formatDate(new Date(whiskey.dateAdded))
    : 'N/A';

  const lastReviewed = whiskey.lastReviewed
    ? formatDate(new Date(whiskey.lastReviewed))
    : 'Never';

  // Sort notes by date descending
  const sortedNotes = useMemo(() => {
    if (!whiskey.notes || !Array.isArray(whiskey.notes)) return [];

    return [...whiskey.notes].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [whiskey.notes]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiRequest("POST", `/api/whiskeys/${whiskey.id}/image`, formData);

      if (response.ok) {
        const result = await response.json();

        // Update the cache with the new image path
        queryClient.setQueryData(["/api/whiskeys"], (oldData: Whiskey[] | undefined) => {
          if (!oldData) return undefined;

          return oldData.map(item =>
            item.id === whiskey.id ? result.whiskey : item
          );
        });

        toast({
          title: "Image uploaded",
          description: "The image has been uploaded successfully.",
        });
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditReview = (review: ReviewNote) => {
    setSelectedReview(review);
    setIsEditReviewModalOpen(true);
  };

  // Deletion confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [isDeletingWhiskey, setIsDeletingWhiskey] = useState(false);

  // Delete review with proper confirmation dialog
  const handleDeleteReviewWithConfirm = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setIsDeleteDialogOpen(true);
  };

  // Execute the actual review deletion
  const executeDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      const response = await apiRequest(
        "DELETE",
        `/api/whiskeys/${whiskey.id}/reviews/${reviewToDelete}`
      );

      if (response.ok) {
        const updatedWhiskey = await response.json();

        // Update the cache
        queryClient.setQueryData(["/api/whiskeys"], (oldData: Whiskey[] | undefined) => {
          if (!oldData) return undefined;

          return oldData.map(item =>
            item.id === whiskey.id ? updatedWhiskey : item
          );
        });

        // Close the dialog and clear the state
        setIsDeleteDialogOpen(false);
        setReviewToDelete(null);

        toast({
          title: "Review deleted",
          description: "The review has been deleted successfully.",
        });
      } else {
        throw new Error("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  // Confirm deleting a whiskey
  const confirmDeleteWhiskey = () => {
    setIsDeletingWhiskey(true);
    setIsDeleteDialogOpen(true);
  };

  // Use mutation for whiskey deletion for better reliability
  const deleteWhiskeyMutation = useMutation({
    mutationFn: async () => {
      console.log("Deleting whiskey:", whiskey.id);
      const response = await apiRequest(
        "DELETE",
        `/api/whiskeys/${whiskey.id}`,
        undefined,
        {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Whiskey deleted",
        description: "The whiskey has been deleted successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/whiskeys'] });

      setIsDeleteDialogOpen(false);
      onClose();
    },
    onError: (error) => {
      console.error("Error deleting whiskey:", error);
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    }
  });

  // Mutation for updating whiskey (status, quantity, wishlist)
  const updateWhiskeyMutation = useMutation({
    mutationFn: async (updates: Partial<Whiskey>) => {
      const response = await apiRequest(
        "PATCH",
        `/api/whiskeys/${whiskey.id}`,
        updates
      );
      return response.json();
    },
    onSuccess: (updatedWhiskey) => {
      queryClient.setQueryData(["/api/whiskeys"], (oldData: Whiskey[] | undefined) => {
        if (!oldData) return undefined;
        return oldData.map(item =>
          item.id === whiskey.id ? updatedWhiskey : item
        );
      });
      toast({
        title: "Updated",
        description: "Whiskey details have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Helper function to update status
  const handleStatusChange = (newStatus: string) => {
    updateWhiskeyMutation.mutate({ status: newStatus as BottleStatus });
  };

  // Helper function to update quantity
  const handleQuantityChange = (delta: number) => {
    const currentQty = whiskey.quantity || 1;
    const newQty = Math.max(0, currentQty + delta);
    updateWhiskeyMutation.mutate({ quantity: newQty });
  };

  // Helper function to move from wishlist to collection
  const handleMoveToCollection = () => {
    updateWhiskeyMutation.mutate({
      isWishlist: false,
      status: 'sealed' as BottleStatus,
      quantity: 1
    });
  };

  // Helper function to move to wishlist
  const handleMoveToWishlist = () => {
    updateWhiskeyMutation.mutate({
      isWishlist: true,
      quantity: 0
    });
  };

  // Get status config for display
  const getStatusConfig = (status: string | null | undefined) => {
    switch (status) {
      case 'sealed':
        return { icon: Package, label: 'Sealed', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'open':
        return { icon: PackageOpen, label: 'Open', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'finished':
        return { icon: CheckCircle2, label: 'Finished', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
      case 'gifted':
        return { icon: Gift, label: 'Gifted', className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' };
      default:
        return { icon: Package, label: 'Unknown', className: 'bg-muted text-muted-foreground' };
    }
  };

  const statusConfig = getStatusConfig(whiskey.status);
  const isWishlist = whiskey.isWishlist === true;
  const quantity = whiskey.quantity || 1;

  // Star rating component
  const StarRating = ({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "transition-colors",
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
            star <= score
              ? "text-amber-400 fill-amber-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-card border-border/50">
          <DialogHeader className="pb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl md:text-2xl font-bold text-foreground pr-8">
                  {whiskey.name}
                </DialogTitle>
                {whiskey.distillery && (
                  <p className="text-muted-foreground mt-1">by {whiskey.distillery}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pb-2">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={confirmDeleteWhiskey}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(whiskey)}>
                <PencilIcon className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReviewForShare(sortedNotes[0]); // Use latest review if available
                  setIsShareImageModalOpen(true);
                }}
              >
                <Image className="h-4 w-4 mr-1.5" />
                Share
              </Button>
              {onTasteWithRick && !isWishlist && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => onTasteWithRick(whiskey)}
                >
                  <Mic className="h-4 w-4 mr-1.5" />
                  Taste with Rick
                </Button>
              )}
            </div>
          </DialogHeader>

          <Separator className="my-2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-4" style={{ maxHeight: "calc(90vh - 140px)" }}>
            {/* Left column - Image & details */}
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-xl bg-accent/30 relative group border border-border/30">
                {whiskey.image ? (
                  <img
                    src={whiskey.image}
                    alt={whiskey.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Wine className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    className="bg-background/90 hover:bg-background"
                    onClick={() => imageUploadRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </Button>
                </div>
                <input
                  type="file"
                  ref={imageUploadRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Rating display */}
              <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border border-border/30">
                <span className="font-medium text-foreground">Rating</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-5 w-5",
                          star <= (whiskey.rating || 0)
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-foreground">{(whiskey.rating || 0).toFixed(1)}</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {whiskey.type && (
                  <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">Type</div>
                    <div className="font-medium text-foreground">{whiskey.type}</div>
                  </div>
                )}

                {whiskey.region && (
                  <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">Region</div>
                    <div className="font-medium text-foreground">{whiskey.region}</div>
                  </div>
                )}

                {whiskey.age !== null && (
                  <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">Age</div>
                    <div className="font-medium text-foreground">{whiskey.age} {whiskey.age === 1 ? 'year' : 'years'}</div>
                  </div>
                )}

                {whiskey.abv !== null && (
                  <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">ABV</div>
                    <div className="font-medium text-foreground">{whiskey.abv}%</div>
                  </div>
                )}

                {whiskey.price !== null && (
                  <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">Price</div>
                    <div className="font-medium text-primary">${whiskey.price.toFixed(2)}</div>
                  </div>
                )}

                {whiskey.dateAdded && (
                  <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">Added</div>
                    <div className="font-medium text-foreground">{new Date(whiskey.dateAdded).toLocaleDateString()}</div>
                  </div>
                )}

                {/* Bourbon specific fields */}
                {whiskey.type === 'Bourbon' && (
                  <>
                    {whiskey.bottleType && (
                      <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
                        <div className="text-xs text-muted-foreground mb-1">Bottle Type</div>
                        <div className="font-medium text-foreground">{whiskey.bottleType}</div>
                      </div>
                    )}

                    {whiskey.mashBill && (
                      <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
                        <div className="text-xs text-muted-foreground mb-1">Mash Bill</div>
                        <div className="font-medium text-foreground">{whiskey.mashBill}</div>
                      </div>
                    )}

                    {whiskey.caskStrength && (
                      <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
                        <div className="text-xs text-muted-foreground mb-1">Cask Strength</div>
                        <div className="font-medium text-foreground">{whiskey.caskStrength}</div>
                      </div>
                    )}

                    {whiskey.finished && (
                      <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
                        <div className="text-xs text-muted-foreground mb-1">Finished</div>
                        <div className="font-medium text-foreground">{whiskey.finished}</div>
                      </div>
                    )}

                    {whiskey.finishType && (
                      <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
                        <div className="text-xs text-muted-foreground mb-1">Finish Type</div>
                        <div className="font-medium text-foreground">{whiskey.finishType}</div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Collection Management Tools */}
              <div className="pt-2">
                <h3 className="font-medium text-foreground mb-3">Collection Management</h3>

                {/* Wishlist/Collection status indicator */}
                {isWishlist ? (
                  <div className="mb-3 p-3 rounded-lg border border-pink-500/30 bg-pink-500/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                        <span className="font-medium text-pink-600 dark:text-pink-400">On Wishlist</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        onClick={handleMoveToCollection}
                        disabled={updateWhiskeyMutation.isPending}
                      >
                        <ArrowRight className="h-4 w-4 mr-1.5" />
                        Move to Collection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mb-3">
                    {/* Status selector */}
                    <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border border-border/30">
                      <span className="text-sm font-medium text-foreground">Status</span>
                      <Select
                        value={whiskey.status || 'sealed'}
                        onValueChange={handleStatusChange}
                        disabled={updateWhiskeyMutation.isPending}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sealed">
                            <span className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-blue-500" />
                              Sealed
                            </span>
                          </SelectItem>
                          <SelectItem value="open">
                            <span className="flex items-center gap-2">
                              <PackageOpen className="h-3.5 w-3.5 text-emerald-500" />
                              Open
                            </span>
                          </SelectItem>
                          <SelectItem value="finished">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                              Finished
                            </span>
                          </SelectItem>
                          <SelectItem value="gifted">
                            <span className="flex items-center gap-2">
                              <Gift className="h-3.5 w-3.5 text-pink-500" />
                              Gifted
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border border-border/30">
                      <span className="text-sm font-medium text-foreground">Quantity</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 0 || updateWhiskeyMutation.isPending}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-foreground">{quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(1)}
                          disabled={updateWhiskeyMutation.isPending}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Purchase info display */}
                    {(whiskey.purchaseDate || whiskey.purchaseLocation) && (
                      <div className="p-3 bg-accent/20 rounded-lg border border-border/20 space-y-1">
                        {whiskey.purchaseDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Purchased:</span>
                            <span className="text-foreground">{new Date(whiskey.purchaseDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {whiskey.purchaseLocation && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">From:</span>
                            <span className="text-foreground">{whiskey.purchaseLocation}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Move to wishlist button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground hover:text-pink-500"
                      onClick={handleMoveToWishlist}
                      disabled={updateWhiskeyMutation.isPending}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Move to Wishlist
                    </Button>
                  </div>
                )}

                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-border/50 hover:bg-accent/50"
                    onClick={() => setIsPriceTrackingModalOpen(true)}
                  >
                    <DollarSign className="h-4 w-4 mr-2 text-primary" />
                    Track Price History
                  </Button>
                </div>
              </div>
            </div>

            {/* Right column - Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-lg text-foreground">Tasting Notes</h3>
                <Button
                  size="sm"
                  onClick={() => onReview(whiskey)}
                >
                  <PenIcon className="h-4 w-4 mr-1.5" />
                  Add Review
                </Button>
              </div>

              {sortedNotes && sortedNotes.length > 0 ? (
                <div className="space-y-3">
                  {sortedNotes.map((note, index) => (
                    <div key={note.id} className="border border-border/50 rounded-lg p-4 bg-card shadow-warm-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm">{formatDate(new Date(note.date))}</span>
                          {note.isPublic && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                              Public
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => navigate(`/reviews/${whiskey.id}/${note.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditReview(note)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteReviewWithConfirm(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <StarRating score={note.overallRating || 0} size="md" />
                        <span className="font-bold text-primary">
                          {note.overallRating?.toFixed(1)} / 5
                        </span>
                      </div>

                      <Accordion type="single" collapsible defaultValue={index === 0 ? "item-0" : undefined}>
                        <AccordionItem value={`item-${index}`} className="border-none">
                          <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-2">
                            View Details
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-2">
                              {note.summary && (
                                <div className="p-3 bg-accent/30 rounded-lg">
                                  <div className="text-xs font-medium text-muted-foreground mb-1">Summary</div>
                                  <p className="text-sm text-foreground">{note.summary}</p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { label: "Nose", score: note.noseScore },
                                  { label: "Mouthfeel", score: note.mouthfeelScore },
                                  { label: "Taste", score: note.tasteScore },
                                  { label: "Finish", score: note.finishScore },
                                  { label: "Value", score: note.valueScore },
                                ].map(({ label, score }) => (
                                  <div key={label} className="flex items-center justify-between p-2 bg-accent/20 rounded-lg">
                                    <span className="text-xs text-muted-foreground">{label}</span>
                                    <div className="flex items-center gap-1">
                                      <StarRating score={score || 0} size="sm" />
                                      <span className="text-xs font-medium text-foreground ml-1">{score || 0}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border/50 rounded-xl p-8 text-center bg-accent/20">
                  <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <h4 className="text-foreground font-medium mb-1">No reviews yet</h4>
                  <p className="text-muted-foreground text-sm mb-4">Start by adding your first tasting note</p>
                  <Button
                    size="sm"
                    onClick={() => onReview(whiskey)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    Add First Review
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit review modal */}
      {selectedReview && (
        <EditReviewModal
          isOpen={isEditReviewModalOpen}
          onClose={() => setIsEditReviewModalOpen(false)}
          whiskey={whiskey}
          review={selectedReview}
        />
      )}

      {/* Price tracking modal */}
      <PriceTrackingModal
        isOpen={isPriceTrackingModalOpen}
        onClose={() => setIsPriceTrackingModalOpen(false)}
        whiskey={whiskey}
      />

      {/* Share as image modal */}
      <ShareAsImageModal
        isOpen={isShareImageModalOpen}
        onClose={() => {
          setIsShareImageModalOpen(false);
          setReviewForShare(undefined);
        }}
        whiskey={whiskey}
        review={reviewForShare}
      />

      {/* Confirmation dialog for deleting whiskey or review */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {isDeletingWhiskey
                ? `This will permanently delete "${whiskey.name}" from your collection. This action cannot be undone.`
                : `This will permanently delete this review. This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border/50"
              onClick={() => {
                setReviewToDelete(null);
                setIsDeletingWhiskey(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingWhiskey && deleteWhiskeyMutation.isPending}
              onClick={() => {
                if (isDeletingWhiskey) {
                  deleteWhiskeyMutation.mutate();
                } else if (reviewToDelete) {
                  executeDeleteReview();
                }
              }}
            >
              {isDeletingWhiskey && deleteWhiskeyMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WhiskeyDetailModal;
