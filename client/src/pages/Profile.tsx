import { lazy, Suspense, useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Header } from '@/components/Header';
import { MobilePageHeader } from '@/components/MobilePageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiRequest } from '@/lib/queryClient';
import {
  Wine,
  Star,
  UserPlus,
  UserMinus,
  Calendar,
  Loader2,
  Heart,
  Lock,
  GitCompareArrows,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Whiskey, ReviewNote, getLevelForXP } from '@shared/schema';
import { EmptyState } from '@/components/EmptyState';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { MobileCollectionGrid } from '@/components/profile/MobileCollectionGrid';
import { ProfileMenu } from '@/components/profile/ProfileMenu';
import ProfileSettingsModal from '@/components/modals/ProfileSettingsModal';

const WhiskeyDetailModal = lazy(() => import('@/components/modals/WhiskeyDetailModal'));

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

interface UserProgressData {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
  totalChallengesCompleted: number;
  totalFlavorIds: number;
}

const Profile = () => {
  const params = useParams();
  const slug = params.slug as string;
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState("Collection");
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [selectedWhiskey, setSelectedWhiskey] = useState<PublicWhiskey | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  // Only mark own profile once profile data has loaded
  const isOwnProfile = !!profile?.user?.id && currentUser?.id === profile.user.id;
  const { data: progressData } = useQuery<UserProgressData>({
    queryKey: ['progress'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/progress');
      return res.json();
    },
    enabled: !!isOwnProfile
  });

  // Fetch follow status if authenticated
  const { data: followStatus } = useQuery<{ isFollowing: boolean }>({
    queryKey: ['followStatus', profile?.user?.id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/users/${profile?.user?.id}/following-status`);
      return res.json();
    },
    enabled: !!profile?.user?.id && !!currentUser && !isOwnProfile
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

  const isFollowing = followStatus?.isFollowing || false;
  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  // Derive badge from XP level, fallback to "Newcomer" if no progress data
  const levelInfo = progressData ? getLevelForXP(progressData.xp) : null;
  const badgeTitle = levelInfo?.title ?? undefined;

  // Collect all reviews across all whiskeys
  const allReviews = whiskeys.flatMap((w) =>
    (w.notes || []).map((note) => ({ ...note, whiskeyName: w.name, whiskeyImage: w.image }))
  );

  // Wishlist items for Wishlist tab
  const wishlistItems = whiskeys
    .filter((w) => w.isWishlist)
    .map((w) => ({ id: String(w.id), name: w.name, imageUrl: w.image || undefined }));

  // Handle bottle tap-to-detail
  const handleBottleClick = (id: string) => {
    const whiskey = whiskeys.find((w) => String(w.id) === id);
    if (whiskey) {
      setSelectedWhiskey(whiskey);
      setIsDetailModalOpen(true);
    }
  };

  if (profileLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <>
        <Helmet>
          <title>Profile Not Found | MyWhiskeyPedia</title>
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

  // Mobile profile layout
  if (isMobile) {
    const collectionItems = whiskeys.map((w) => ({
      id: String(w.id),
      name: w.name,
      imageUrl: w.image || undefined,
    }));

    return (
      <>
        <Helmet>
          <title>{displayName}'s Collection | MyWhiskeyPedia</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <MobilePageHeader title="Profile" />
          <ProfileHeader
            name={displayName}
            initials={initials}
            handle={profile.user.profileSlug ? `@${profile.user.profileSlug}` : `@${profile.user.username}`}
            badge={badgeTitle}
            profileImage={profile.user.profileImage}
            bio={profile.user.bio}
            isOwnProfile={isOwnProfile}
            onSettingsClick={() => setIsProfileSettingsOpen(true)}
          />

          {/* Follow / Compare buttons for other users */}
          {!isOwnProfile && currentUser && (
            <div className="flex gap-2 mx-5 mb-4">
              <Button
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                variant={isFollowing ? "outline" : "default"}
                className={cn(
                  "flex-1 gap-2",
                  isFollowing ? "border-primary/30 text-foreground" : ""
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
              <Button
                asChild
                variant="outline"
                className="flex-1 gap-2 border-border/50"
              >
                <Link href={`/compare/${profile.user.id}`}>
                  <GitCompareArrows className="h-4 w-4" />
                  Compare
                </Link>
              </Button>
            </div>
          )}

          <ProfileStats
            stats={[
              { value: profile.stats.whiskeyCount, label: "Bottles" },
              { value: profile.stats.reviewCount, label: "Reviews" },
              { value: profile.stats.followingCount, label: "Following" },
              { value: profile.stats.followersCount, label: "Followers" },
            ]}
          />
          <ProfileTabs
            tabs={["Collection", "Reviews", "Wishlist"]}
            activeTab={mobileTab}
            onTabChange={setMobileTab}
          />

          {/* Collection tab */}
          {mobileTab === "Collection" && (
            whiskeysLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : collectionItems.length === 0 ? (
              <EmptyState
                icon={Wine}
                title="No Bottles Yet"
                description="Start building your collection by adding your first bottle."
              />
            ) : (
              <MobileCollectionGrid
                items={collectionItems}
                onItemClick={handleBottleClick}
              />
            )
          )}

          {/* Reviews tab — wired to actual review data */}
          {mobileTab === "Reviews" && (
            whiskeysLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : allReviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No Reviews Yet"
                description="Review bottles in your collection to share your tasting notes."
              />
            ) : (
              <div className="px-5 py-4 pb-[100px] space-y-3">
                {allReviews.map((review) => (
                  <MobileReviewCard key={review.id} review={review} />
                ))}
              </div>
            )
          )}

          {/* Wishlist tab */}
          {mobileTab === "Wishlist" && (
            wishlistItems.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Wishlist Empty"
                description="Save bottles you want to try by adding them to your wishlist."
              />
            ) : (
              <MobileCollectionGrid
                items={wishlistItems}
                onItemClick={handleBottleClick}
              />
            )
          )}

          {isOwnProfile && (
            <ProfileMenu onOpenSettings={() => setIsProfileSettingsOpen(true)} />
          )}
        </div>

        <ProfileSettingsModal
          isOpen={isProfileSettingsOpen}
          onClose={() => setIsProfileSettingsOpen(false)}
        />

        {/* Bottle detail modal — lazy-loaded to avoid blocking initial render */}
        {selectedWhiskey && (
          <Suspense fallback={null}>
            <WhiskeyDetailModal
              isOpen={isDetailModalOpen}
              onClose={() => {
                setIsDetailModalOpen(false);
                setSelectedWhiskey(null);
              }}
              whiskey={selectedWhiskey}
              onReview={() => {}}
              onEdit={() => {}}
            />
          </Suspense>
        )}
      </>
    );
  }

  // Desktop layout
  return (
    <>
      <Helmet>
        <title>{displayName}'s Collection | MyWhiskeyPedia</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        {/* Profile Header */}
        <header className="relative py-12 md:py-16">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-border shadow-warm-lg">
                {profile.user.profileImage ? (
                  <AvatarImage src={profile.user.profileImage} alt={displayName} />
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">{displayName}</h1>
                <p className="text-muted-foreground text-sm mt-1 flex items-center justify-center sm:justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  Member since {memberSince}
                </p>
                {profile.user.bio && (
                  <p className="text-foreground/80 mt-3 max-w-xl">{profile.user.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
                  <div className="text-center">
                    <div className="font-sans text-xl font-semibold tabular-nums text-foreground">{profile.stats.whiskeyCount}</div>
                    <div className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Whiskeys</div>
                  </div>
                  <div className="text-center">
                    <div className="font-sans text-xl font-semibold tabular-nums text-foreground">{profile.stats.reviewCount}</div>
                    <div className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="font-sans text-xl font-semibold tabular-nums text-foreground">{profile.stats.followersCount}</div>
                    <div className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-sans text-xl font-semibold tabular-nums text-foreground">{profile.stats.followingCount}</div>
                    <div className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Following</div>
                  </div>
                </div>
              </div>

              {!isOwnProfile && currentUser && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    variant={isFollowing ? "outline" : "default"}
                    className={cn(
                      "gap-2 shadow-warm-sm",
                      isFollowing ? "border-primary/30 text-foreground hover:bg-accent/50" : ""
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
                  <Button
                    asChild
                    variant="outline"
                    size="default"
                    className="gap-2 border-border/50 hover:bg-accent/50"
                  >
                    <Link href={`/compare/${profile.user.id}`}>
                      <GitCompareArrows className="h-4 w-4" />
                      Compare
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

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
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

// Review card for the mobile Reviews tab
const MobileReviewCard = ({ review }: { review: ReviewNote & { whiskeyName: string; whiskeyImage: string | null } }) => {
  const rating = review.rating || 0;
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-3">
        {review.whiskeyImage ? (
          <img src={review.whiskeyImage} alt={review.whiskeyName} className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-accent/30 flex items-center justify-center">
            <Wine className="w-5 h-5 text-muted-foreground/50" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">{review.whiskeyName}</div>
          <div className="text-xs text-muted-foreground">{review.date}</div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                "w-3 h-3",
                s <= rating ? "text-primary fill-primary" : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
      {review.text && (
        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{review.text}</p>
      )}
    </div>
  );
};

// Desktop public whiskey card
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
        <CardContent className="p-4 w-2/3 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold text-base text-foreground line-clamp-2">
              {whiskey.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {whiskey.distillery || 'Unknown Distillery'}
            </p>
            {whiskey.type && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {whiskey.type}
              </Badge>
            )}
            <div className="flex items-center mt-3 gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-3.5 h-3.5",
                    star <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
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
