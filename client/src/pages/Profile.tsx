import React from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  User,
  Wine,
  Star,
  Users,
  UserPlus,
  UserMinus,
  Calendar,
  Loader2,
  Heart,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Whiskey, ReviewNote } from '@shared/schema';

interface PublicProfile {
  user: {
    id: number;
    username: string;
    displayName: string | null;
    profileImage: string | null;
    bio: string | null;
    profileSlug: string | null;
    createdAt: Date;
  };
  stats: {
    whiskeyCount: number;
    reviewCount: number;
    followersCount: number;
    followingCount: number;
  };
}

interface PublicWhiskey extends Whiskey {
  notes: ReviewNote[];
}

const Profile = () => {
  const params = useParams();
  const slug = params.slug as string;
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch public profile
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<PublicProfile>({
    queryKey: ['profile', slug],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/profile/${slug}`);
      return res.json();
    },
    enabled: !!slug
  });

  // Fetch user's public whiskeys
  const { data: whiskeys = [], isLoading: whiskeysLoading } = useQuery<PublicWhiskey[]>({
    queryKey: ['publicWhiskeys', profile?.user?.id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/users/${profile?.user?.id}/whiskeys`);
      return res.json();
    },
    enabled: !!profile?.user?.id
  });

  // Fetch follow status if authenticated
  const { data: followStatus } = useQuery<{ isFollowing: boolean }>({
    queryKey: ['followStatus', profile?.user?.id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/users/${profile?.user?.id}/following-status`);
      return res.json();
    },
    enabled: !!profile?.user?.id && !!currentUser && currentUser.id !== profile?.user?.id
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('POST', `/api/users/${userId}/follow`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus', profile?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', slug] });
      toast({ title: 'Followed!', description: `You are now following ${profile?.user?.displayName || profile?.user?.username}` });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to follow user', variant: 'destructive' });
    }
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('DELETE', `/api/users/${userId}/follow`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus', profile?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', slug] });
      toast({ title: 'Unfollowed', description: `You unfollowed ${profile?.user?.displayName || profile?.user?.username}` });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to unfollow user', variant: 'destructive' });
    }
  });

  const handleFollowToggle = () => {
    if (!profile?.user?.id) return;

    if (followStatus?.isFollowing) {
      unfollowMutation.mutate(profile.user.id);
    } else {
      followMutation.mutate(profile.user.id);
    }
  };

  const isOwnProfile = currentUser?.id === profile?.user?.id;
  const isFollowing = followStatus?.isFollowing || false;
  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  if (profileLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <>
        <Helmet>
          <title>Profile Not Found | WhiskeyPedia</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-16 text-center">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
            <p className="text-muted-foreground">
              This profile doesn't exist or is private.
            </p>
          </div>
        </div>
      </>
    );
  }

  const displayName = profile.user.displayName || profile.user.username;
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = new Date(profile.user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <Helmet>
        <title>{displayName}'s Collection | WhiskeyPedia</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        {/* Profile Header */}
        <header className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white border-b border-amber-800/30">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24 border-4 border-amber-500/30 shadow-xl">
                {profile.user.profileImage ? (
                  <AvatarImage src={profile.user.profileImage} alt={displayName} />
                ) : (
                  <AvatarFallback className="bg-amber-800 text-amber-100 text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-amber-50">{displayName}</h1>
                <p className="text-amber-200/70 text-sm mt-1 flex items-center justify-center sm:justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  Member since {memberSince}
                </p>
                {profile.user.bio && (
                  <p className="text-amber-100/90 mt-3 max-w-xl">{profile.user.bio}</p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-50">{profile.stats.whiskeyCount}</div>
                    <div className="text-xs text-amber-200/60">Whiskeys</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-50">{profile.stats.reviewCount}</div>
                    <div className="text-xs text-amber-200/60">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-50">{profile.stats.followersCount}</div>
                    <div className="text-xs text-amber-200/60">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-50">{profile.stats.followingCount}</div>
                    <div className="text-xs text-amber-200/60">Following</div>
                  </div>
                </div>
              </div>

              {/* Follow Button */}
              {!isOwnProfile && currentUser && (
                <Button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className={cn(
                    "gap-2",
                    isFollowing
                      ? "bg-transparent border-amber-500/30 text-amber-100 hover:bg-amber-800/50"
                      : "bg-amber-600 hover:bg-amber-700"
                  )}
                >
                  {isFollowLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="collection" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="collection" className="gap-2">
                  <Wine className="h-4 w-4" />
                  Collection ({whiskeys.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="collection">
                {whiskeysLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : whiskeys.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Wine className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground">No public whiskeys yet</h3>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        {isOwnProfile
                          ? "Make some whiskeys public to share your collection!"
                          : "This user hasn't shared any whiskeys publicly yet."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {whiskeys.map((whiskey) => (
                      <PublicWhiskeyCard key={whiskey.id} whiskey={whiskey} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

// Simple public whiskey card component
const PublicWhiskeyCard = ({ whiskey }: { whiskey: PublicWhiskey }) => {
  const rating = whiskey.rating || 0;
  const reviewCount = whiskey.notes?.length || 0;
  const isWishlist = whiskey.isWishlist === true;

  return (
    <Card className={cn(
      "overflow-hidden bg-card border-border/50 shadow-sm hover:shadow-md transition-all duration-300",
      isWishlist && "border-l-4 border-l-pink-500/50"
    )}>
      <div className="flex h-full">
        {/* Left side: Image */}
        <div className="w-1/3 relative bg-accent/30">
          <div className="aspect-[3/4]">
            {whiskey.image ? (
              <img
                src={whiskey.image}
                alt={`Bottle of ${whiskey.name}`}
                className="object-cover h-full w-full"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center p-2">
                <Wine className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
            {isWishlist && (
              <Badge
                variant="outline"
                className="absolute top-2 right-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 text-xs"
              >
                <Heart className="h-3 w-3 mr-1 fill-current" />
                Wishlist
              </Badge>
            )}
          </div>
        </div>

        {/* Right side: Details */}
        <CardContent className="p-4 w-2/3 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold text-base text-foreground line-clamp-2">
              {whiskey.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {whiskey.distillery || 'Unknown Distillery'}
            </p>

            {whiskey.type && (
              <Badge
                variant="secondary"
                className="mt-2 text-xs"
              >
                {whiskey.type}
              </Badge>
            )}

            {/* Rating */}
            <div className="flex items-center mt-3 gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-3.5 h-3.5",
                    star <= rating
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
              {reviewCount > 0 && (
                <span className="text-xs text-muted-foreground ml-1.5">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default Profile;
