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
  Loader2,
  Activity,
  Fingerprint,
  ArrowLeftRight,
  ArrowRight
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
    <Card className="group h-full flex flex-col bg-card border-border/50 shadow-warm-sm hover:shadow-warm hover:border-border transition-all duration-300">
      <CardHeader className="pb-3 pt-4">
        <div className="flex justify-between items-start mb-3 min-w-0">
          <Link href={user.profileSlug ? `/u/${user.profileSlug}` : '#'}>
            <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity min-w-0">
              <Avatar className="h-9 w-9 border-2 border-border">
                {user.profileImage ? (
                  <AvatarImage src={user.profileImage} />
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground font-medium text-sm">
                    {getInitials(displayName)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground hover:text-foreground transition-colors truncate max-w-[120px]">
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
        <h3 className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-foreground transition-colors">
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
            <span className="text-lg font-bold text-foreground">{review.rating?.toFixed(1) || 'N/A'}</span>
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
            className="h-8 px-3 text-xs border-border/50 hover:bg-accent/50 hover:border-border"
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
    <Card className="bg-card border-border/50 hover:border-border transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link href={user.profileSlug ? `/u/${user.profileSlug}` : '#'}>
            <Avatar className="h-12 w-12 border-2 border-border cursor-pointer hover:opacity-80 transition-opacity">
              {user.profileImage ? (
                <AvatarImage src={user.profileImage} />
              ) : (
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={user.profileSlug ? `/u/${user.profileSlug}` : '#'}>
              <h4 className="font-medium text-foreground truncate hover:text-foreground transition-colors cursor-pointer">
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
          <Heart className="h-8 w-8 text-muted-foreground" />
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

// Activity Feed Item
interface ActivityItem {
  id: number;
  type: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: number;
    displayName: string;
    profileImage: string | null;
    profileSlug: string | null;
  };
  targetUser?: {
    id: number;
    displayName: string;
    profileImage: string | null;
    profileSlug: string | null;
  };
  whiskey?: {
    id: number;
    name: string;
    distillery: string | null;
    type: string | null;
    image: string | null;
  };
}

const activityText = (item: ActivityItem): string => {
  switch (item.type) {
    case 'follow':
      return `started following ${item.targetUser?.displayName || 'someone'}`;
    case 'add_bottle':
      return `added ${item.whiskey?.name || 'a bottle'} to their collection`;
    case 'review':
      return `reviewed ${item.whiskey?.name || 'a whiskey'}`;
    case 'like':
      return `liked a review on ${item.whiskey?.name || 'a whiskey'}`;
    case 'trade_list':
      return `listed ${item.whiskey?.name || 'a bottle'} for trade`;
    case 'trade_complete':
      return `completed a trade for ${item.whiskey?.name || 'a bottle'}`;
    default:
      return 'did something';
  }
};

const activityIcon = (type: string) => {
  switch (type) {
    case 'follow': return <UserPlus className="h-3.5 w-3.5 text-blue-400" />;
    case 'add_bottle': return <Wine className="h-3.5 w-3.5 text-green-400" />;
    case 'review': return <Star className="h-3.5 w-3.5 text-primary" />;
    case 'like': return <Heart className="h-3.5 w-3.5 text-red-400" />;
    case 'trade_list': return <ArrowLeftRight className="h-3.5 w-3.5 text-violet-400" />;
    case 'trade_complete': return <ArrowLeftRight className="h-3.5 w-3.5 text-green-400" />;
    default: return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
  }
};

const ActivityFeed = () => {
  const { data: items = [], isLoading } = useQuery<ActivityItem[]>({
    queryKey: ['/api/activity/feed'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/activity/feed?limit=30');
      return res.json();
    },
  });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-10 text-center">
        <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground">No activity yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Follow users or add bottles to see activity here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50 hover:border-border transition-colors">
          <Link href={item.user.profileSlug ? `/u/${item.user.profileSlug}` : '#'}>
            <Avatar className="h-8 w-8 border border-border cursor-pointer hover:opacity-80">
              {item.user.profileImage ? (
                <AvatarImage src={item.user.profileImage} />
              ) : (
                <AvatarFallback className="bg-muted text-xs">
                  {(item.user.displayName || '?').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <Link href={item.user.profileSlug ? `/u/${item.user.profileSlug}` : '#'}>
                <span className="font-medium text-foreground hover:underline cursor-pointer">
                  {item.user.displayName}
                </span>
              </Link>
              {' '}
              <span className="text-muted-foreground">{activityText(item)}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              {activityIcon(item.type)}
              <span className="text-xs text-muted-foreground">{formatTime(item.createdAt)}</span>
              {item.metadata && typeof item.metadata === 'object' && 'rating' in item.metadata && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {String(item.metadata.rating)} / 5
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Social Features Quick Links
const SocialFeatureLinks = () => (
  <div className="space-y-2 mt-6">
    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
      <Users className="h-4 w-4" />
      Social Features
    </h3>
    <Link href="/palate-matches">
      <Card className="bg-card border-border/50 hover:border-border transition-all cursor-pointer">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Fingerprint className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Palate Matches</p>
            <p className="text-xs text-muted-foreground">Find your flavor twin</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
    <Link href="/trades">
      <Card className="bg-card border-border/50 hover:border-border transition-all cursor-pointer">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-md bg-violet-400/10">
            <ArrowLeftRight className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Trade Board</p>
            <p className="text-xs text-muted-foreground">Browse & list bottles for trade</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  </div>
);

const Community = () => {
  const { user, isLoading: authLoading } = useAuth();

  return (
    <>
      <Helmet>
        <title>Community Reviews | MyWhiskeyPedia</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        {/* Page Header */}
        <header className="relative py-8 md:py-12 lg:py-16">
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
                  <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="mb-6">
                      <TabsTrigger value="activity" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Activity
                      </TabsTrigger>
                      <TabsTrigger value="discover" className="gap-2">
                        <Globe className="h-4 w-4" />
                        Discover
                      </TabsTrigger>
                      <TabsTrigger value="following" className="gap-2">
                        <Heart className="h-4 w-4" />
                        Following
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="activity">
                      <ActivityFeed />
                    </TabsContent>

                    <TabsContent value="discover">
                      <PublicReviewsGrid limit={12} />
                    </TabsContent>

                    <TabsContent value="following">
                      <FollowingFeed />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Sidebar with suggested users and social links */}
                <aside className="lg:w-80 shrink-0">
                  <SuggestedUsers />
                  <SocialFeatureLinks />
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
