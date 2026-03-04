import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'wouter';
import {
  ArrowLeftRight,
  Search,
  Plus,
  Wine,
  MapPin,
  Tag,
  Loader2,
  Trash2,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradeListingWithDetails {
  id: number;
  userId: number;
  whiskeyId: number;
  status: string;
  seeking: string | null;
  notes: string | null;
  createdAt: string;
  whiskey: {
    id: number;
    name: string;
    distillery: string | null;
    type: string | null;
    age: number | null;
    abv: number | null;
    image: string | null;
  };
  user: {
    id: number;
    username: string;
    displayName: string | null;
    profileImage: string | null;
    profileSlug: string | null;
  };
}

interface UserWhiskey {
  id: number;
  name: string;
  distillery: string | null;
  type: string | null;
  image: string | null;
  status: string;
}

const TradeCard = ({
  listing,
  isOwner,
  onDelete,
}: {
  listing: TradeListingWithDetails;
  isOwner: boolean;
  onDelete?: (id: number) => void;
}) => {
  const displayName = listing.user.displayName || listing.user.username;
  const initials = displayName.substring(0, 2).toUpperCase();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="bg-card border-border/50 hover:border-border transition-all">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <Link href={listing.user.profileSlug ? `/u/${listing.user.profileSlug}` : '#'}>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
              <Avatar className="h-8 w-8 border border-border">
                {listing.user.profileImage ? (
                  <AvatarImage src={listing.user.profileImage} />
                ) : (
                  <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
                )}
              </Avatar>
              <span className="text-sm font-medium">{displayName}</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatDate(listing.createdAt)}</span>
            <Badge
              variant="outline"
              className={cn(
                'text-xs capitalize',
                listing.status === 'available' && 'text-green-400 border-green-400/30',
                listing.status === 'pending' && 'text-yellow-400 border-yellow-400/30',
                listing.status === 'completed' && 'text-muted-foreground'
              )}
            >
              {listing.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex gap-3">
          {listing.whiskey.image ? (
            <img
              src={listing.whiskey.image}
              alt={listing.whiskey.name}
              className="w-16 h-20 object-cover rounded-md border border-border/50"
            />
          ) : (
            <div className="w-16 h-20 bg-muted rounded-md flex items-center justify-center border border-border/50">
              <Wine className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-1">{listing.whiskey.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {listing.whiskey.distillery}
              {listing.whiskey.type && ` \u00b7 ${listing.whiskey.type}`}
              {listing.whiskey.age && ` \u00b7 ${listing.whiskey.age}yr`}
            </p>

            {listing.seeking && (
              <div className="mt-2 flex items-start gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground line-clamp-2">
                  <span className="text-foreground font-medium">Seeking:</span> {listing.seeking}
                </p>
              </div>
            )}

            {listing.notes && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{listing.notes}</p>
            )}
          </div>
        </div>
      </CardContent>

      {isOwner && onDelete && (
        <CardFooter className="border-t border-border/30 pt-3 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive/80 h-7 text-xs"
            onClick={() => onDelete(listing.id)}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove listing
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

const CreateListingDialog = ({ onCreated }: { onCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [selectedWhiskeyId, setSelectedWhiskeyId] = useState<string>('');
  const [seeking, setSeeking] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const { data: whiskeys = [] } = useQuery<UserWhiskey[]>({
    queryKey: ['/api/whiskeys'],
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/trade-listings', {
        whiskeyId: parseInt(selectedWhiskeyId),
        seeking: seeking || undefined,
        notes: notes || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Listed!', description: 'Your bottle is now listed for trade' });
      setOpen(false);
      setSelectedWhiskeyId('');
      setSeeking('');
      setNotes('');
      onCreated();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create listing', variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          List a Bottle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>List Bottle for Trade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Select Bottle</Label>
            <Select value={selectedWhiskeyId} onValueChange={setSelectedWhiskeyId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a bottle..." />
              </SelectTrigger>
              <SelectContent>
                {whiskeys.map((w: UserWhiskey) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name} {w.type && `(${w.type})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>What are you seeking?</Label>
            <Input
              className="mt-1"
              placeholder="e.g., Blanton's, any barrel proof bourbon..."
              value={seeking}
              onChange={(e) => setSeeking(e.target.value)}
            />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              className="mt-1"
              placeholder="Condition, fill level, willing to ship..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            className="w-full"
            disabled={!selectedWhiskeyId || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowLeftRight className="h-4 w-4 mr-2" />
            )}
            List for Trade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function TradeListings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: allListings = [], isLoading: allLoading } = useQuery<TradeListingWithDetails[]>({
    queryKey: ['/api/trade-listings'],
  });

  const { data: myListings = [], isLoading: myLoading } = useQuery<TradeListingWithDetails[]>({
    queryKey: ['/api/trade-listings/mine'],
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/trade-listings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trade-listings/mine'] });
      toast({ title: 'Removed', description: 'Trade listing deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete listing', variant: 'destructive' });
    },
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/trade-listings'] });
    queryClient.invalidateQueries({ queryKey: ['/api/trade-listings/mine'] });
  };

  const renderListings = (listings: TradeListingWithDetails[], isOwnerView: boolean, loading: boolean) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Skeleton className="w-16 h-20 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (listings.length === 0) {
      return (
        <Card className="bg-card border-border/50">
          <CardContent className="p-10 text-center">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground">
              {isOwnerView ? 'No active listings' : 'No trade listings yet'}
            </h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              {isOwnerView
                ? 'List a bottle from your collection to start trading!'
                : 'Be the first to list a bottle for trade.'}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {listings.map((listing) => (
          <TradeCard
            key={listing.id}
            listing={listing}
            isOwner={isOwnerView}
            onDelete={isOwnerView ? (id) => deleteMutation.mutate(id) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Trade Listings | MyWhiskeyPedia</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        <header className="relative py-8 md:py-12">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-caps text-primary mb-3">Social</p>
                <h1 className="text-display-hero text-foreground">Trade Board</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Browse and list bottles available for trade
                </p>
              </div>
              {user && <CreateListingDialog onCreated={refreshAll} />}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {user ? (
            <Tabs defaultValue="browse" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="browse" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Browse
                </TabsTrigger>
                <TabsTrigger value="mine" className="gap-2">
                  <Wine className="h-4 w-4" />
                  My Listings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="browse">
                {renderListings(allListings, false, allLoading)}
              </TabsContent>

              <TabsContent value="mine">
                {renderListings(myListings, true, myLoading)}
              </TabsContent>
            </Tabs>
          ) : (
            renderListings(allListings, false, allLoading)
          )}
        </main>
      </div>
    </>
  );
}
