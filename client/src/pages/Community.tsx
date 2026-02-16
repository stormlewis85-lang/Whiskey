import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import PublicReviewsGrid from '@/components/PublicReviewsGrid';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import {
  Users,
  Globe,
  UserPlus,
  Star,
  Share2,
  Wine,
  Heart,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Whiskey, ReviewNote, User } from '@shared/schema';
import ReviewLikes from '@/components/ReviewLikes';

interface PublicReview {
  whiskey: Whiskey;
  review: ReviewNote;
  user: User & { profileSlug?: string };
}

interface SuggestedUser {
  id: number;
  username: string;
  displayName: string | null;
  profileImage: string | null;
  bio: string | null;
  profileSlug: string | null;
  whiskeyCount: number;
  followersCount: number;
}

// Following Feed Review Card
const FollowingReviewCard = ({ whiskey, review, user }: PublicReview) => {
  const previewText = review.text?.length > 150
    ? `${review.text.substring(0, 150)}...`
    : review.text;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
  const displayName = user.displayName || user.username;

  return (
    <Card className="group h-full flex flex-col bg-card border-border/50 shadow-warm-sm hover:shadow-warm hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3 pt-4">
        <div className="flex justify-between items-start mb-3">
          <Link href={user.profileSlug ? `/u/${user.profileSlug}` : '#'}>
            <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                {user.profileImage ? (
                  <AvatarImage src={user.profileImage} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                    {getInitials(displayName)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(review.date)}</p>
              </div>
            </div>
          </Link>
          <Badge variant="outline" className="bg-accent/50 border-border/50 text-xs">
            {whiskey.type}
          </Badge>
        </div>
        <h3 className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
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
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="text-lg font-bold text-primary">{review.rating?.toFixed(1) || 'N/A'}</span>
          </div>
        </div>
        {previewText && (
          <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">{previewText}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t border-border/30 pt-3 gap-2">
        <ReviewLikes whiskey={whiskey} review={review} size="sm" />
        {review.shareId && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs border-border/50 hover:bg-accent/50 hover:border-primary/30"
          >
            <Link to={`/shared/${review.shareId}`}>
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              View
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// User Suggestion Card
const UserSuggestionCard = ({ user, onFollow }: { user: SuggestedUser; onFollow: () => void }) => {
  const displayName = user.displayName || user.username;
  const initials = displayName.substring(0, 2).toUpperCase();
  const [isFollowing, setIsFollowing] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/users/${user.id}/follow`);
      return res.json();
    },
    onSuccess: () => {
      setIsFollowing(true);
      queryClient.invalidateQueries({ queryKey: ['/api/users/suggested'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed/following'] });
      toast({ title: 'Followed!', description: `You are now following ${displayName}` });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to follow user', variant: 'destructive' });
    }
  });

  return (
    <Card className="bg-card border-border/50 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link href={user.profileSlug ? `/u/${user.profileSlug}` : '#'}>
            <Avatar className="h-12 w-12 border-2 border-primary/20 cursor-pointer hover:opacity-80 transition-opacity">
              {user.profileImage ? (
                <AvatarImage src={user.profileImage} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={user.profileSlug ? `/u/${user.profileSlug}` : '#'}>
              <h4 className="font-medium text-foreground truncate hover:text-primary transition-colors cursor-pointer">
                {displayName}
              </h4>
            </Link>
            {user.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{user.bio}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Wine className="h-3 w-3" />
                {user.whiskeyCount} whiskeys
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {user.followersCount} followers
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            disabled={followMutation.isPending || isFollowing}
            onClick={() => followMutation.mutate()}
            className="shrink-0"
          >
            {followMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isFollowing ? (
              'Following'
            ) : (
              <>
                <UserPlus className="h-3 w-3 mr-1" />
                Follow
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Following Feed Component
const FollowingFeed = () => {
  const { data: reviews = [], isLoading, error } = useQuery<PublicReview[]>({
    queryKey: ['/api/feed/following'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/feed/following?limit=20');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array(6).fill(0).map((_, i) => (
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
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-card border border-border/50 rounded-xl shadow-warm-sm p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Heart className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">No reviews yet</h3>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Follow some whiskey enthusiasts to see their latest reviews here!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {reviews.map((item) => (
        <FollowingReviewCard
          key={`${item.whiskey.id}-${item.review.id}`}
          whiskey={item.whiskey}
          review={item.review}
          user={item.user}
        />
      ))}
    </div>
  );
};

// Suggested Users Component
const SuggestedUsers = () => {
  const { data: users = [], isLoading } = useQuery<SuggestedUser[]>({
    queryKey: ['/api/users/suggested'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/users/suggested?limit=5');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        Suggested Users
      </h3>
      {users.map((user) => (
        <UserSuggestionCard key={user.id} user={user} onFollow={() => {}} />
      ))}
    </div>
  );
};

const Community = () => {
  const { user, isLoading: authLoading } = useAuth();

  return (
    <>
      <Helmet>
        <title>Community Reviews | Whiskey Collection</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        {/* Page Header */}
        <header className="relative py-12 md:py-16">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-label-caps text-primary mb-3">Enthusiasts</p>
            <h1 className="text-display-hero text-foreground">Community</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover what other enthusiasts are enjoying
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            {user && !authLoading ? (
              // Logged in: Show tabs for Discover and Following
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <Tabs defaultValue="discover" className="w-full">
                    <TabsList className="mb-6">
                      <TabsTrigger value="discover" className="gap-2">
                        <Globe className="h-4 w-4" />
                        Discover
                      </TabsTrigger>
                      <TabsTrigger value="following" className="gap-2">
                        <Heart className="h-4 w-4" />
                        Following
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="discover">
                      <PublicReviewsGrid limit={12} />
                    </TabsContent>

                    <TabsContent value="following">
                      <FollowingFeed />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Sidebar with suggested users */}
                <aside className="lg:w-80 shrink-0">
                  <SuggestedUsers />
                </aside>
              </div>
            ) : (
              // Not logged in: Just show public reviews
              <PublicReviewsGrid limit={12} className="mb-16" />
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Community;
