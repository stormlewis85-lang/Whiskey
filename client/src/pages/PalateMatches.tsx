import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import {
  Users,
  Fingerprint,
  ArrowRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { GlencairnIcon } from "@/components/GlencairnIcon";
import { cn } from '@/lib/utils';

interface PalateProfile {
  userId: number;
  reviewCount: number;
  topFlavors: {
    nose: { flavor: string; count: number }[];
    taste: { flavor: string; count: number }[];
    finish: { flavor: string; count: number }[];
    all: { flavor: string; count: number }[];
  };
  scoringTendencies: {
    averageOverall: number | null;
    averageNose: number | null;
    averageMouthfeel: number | null;
    averageTaste: number | null;
    averageFinish: number | null;
    averageValue: number | null;
    tendency: 'generous' | 'critical' | 'balanced';
  };
  preferredTypes: { type: string; count: number }[];
  preferredDistilleries: { distillery: string; count: number }[];
}

interface PalateMatch {
  user: {
    id: number;
    username: string;
    displayName: string | null;
    profileImage: string | null;
    bio: string | null;
    profileSlug: string | null;
  };
  similarity: number;
  sharedFlavors: string[];
}

const PalateProfileCard = ({ profile }: { profile: PalateProfile }) => {
  const tendency = profile.scoringTendencies.tendency;
  const tendencyColors = {
    generous: 'text-green-400 bg-green-400/10',
    critical: 'text-red-400 bg-red-400/10',
    balanced: 'text-primary bg-primary/10',
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" />
          Your Palate Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Reviews analyzed</span>
          <span className="font-semibold">{profile.reviewCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Scoring tendency</span>
          <Badge variant="outline" className={cn('capitalize', tendencyColors[tendency])}>
            {tendency}
          </Badge>
        </div>

        {profile.scoringTendencies.averageOverall !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Avg. rating</span>
            <span className="font-semibold">{profile.scoringTendencies.averageOverall.toFixed(1)}</span>
          </div>
        )}

        {profile.topFlavors.all.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Top flavors</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.topFlavors.all.slice(0, 8).map((f) => (
                <Badge key={f.flavor} variant="secondary" className="text-xs">
                  {f.flavor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {profile.preferredTypes.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Preferred types</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.preferredTypes.map((t) => (
                <Badge key={t.type} variant="outline" className="text-xs">
                  {t.type} ({t.count})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MatchCard = ({ match }: { match: PalateMatch }) => {
  const displayName = match.user.displayName || match.user.username;
  const initials = displayName.substring(0, 2).toUpperCase();
  const similarityColor = match.similarity >= 90 ? 'text-green-400' :
    match.similarity >= 75 ? 'text-primary' : 'text-muted-foreground';

  return (
    <Card className="bg-card border-border/50 hover:border-border transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link href={match.user.profileSlug ? `/u/${match.user.profileSlug}` : '#'}>
            <Avatar className="h-12 w-12 border-2 border-border cursor-pointer hover:opacity-80 transition-opacity">
              {match.user.profileImage ? (
                <AvatarImage src={match.user.profileImage} />
              ) : (
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <Link href={match.user.profileSlug ? `/u/${match.user.profileSlug}` : '#'}>
                <h4 className="font-medium text-foreground truncate hover:text-foreground/80 transition-colors cursor-pointer">
                  {displayName}
                </h4>
              </Link>
              <div className={cn('text-lg font-bold', similarityColor)}>
                {match.similarity}%
              </div>
            </div>

            {match.user.bio && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{match.user.bio}</p>
            )}

            {match.sharedFlavors.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {match.sharedFlavors.slice(0, 5).map((flavor) => (
                  <Badge key={flavor} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {flavor}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                <Link href={match.user.profileSlug ? `/u/${match.user.profileSlug}` : '#'}>
                  View Profile
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function PalateMatches() {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery<PalateProfile>({
    queryKey: ['/api/palate/profile'],
    enabled: !!user,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<PalateMatch[]>({
    queryKey: ['/api/palate/matches'],
    enabled: !!user,
  });

  return (
    <>
      <Helmet>
        <title>Palate Matches | MyWhiskeyPedia</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        <header className="relative py-8 md:py-12">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-label-caps text-primary mb-3">Social</p>
            <h1 className="text-display-hero text-foreground">Palate Matches</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Find enthusiasts who share your taste preferences
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar: Your Palate Profile */}
            <aside className="lg:w-80 shrink-0">
              {profileLoading ? (
                <Card className="bg-card border-border/50">
                  <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ) : profile ? (
                <PalateProfileCard profile={profile} />
              ) : (
                <Card className="bg-card border-border/50">
                  <CardContent className="p-6 text-center">
                    <GlencairnIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Review some whiskeys to build your palate profile
                    </p>
                  </CardContent>
                </Card>
              )}
            </aside>

            {/* Main: Matches */}
            <div className="flex-1">
              {matchesLoading ? (
                <div className="space-y-3">
                  {Array(4).fill(0).map((_, i) => (
                    <Card key={i} className="bg-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : matches.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4" />
                    Ranked by palate similarity
                  </h3>
                  {matches.map((match) => (
                    <MatchCard key={match.user.id} match={match} />
                  ))}
                </div>
              ) : (
                <Card className="bg-card border-border/50">
                  <CardContent className="p-10 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">No matches yet</h3>
                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                      Keep reviewing whiskeys to improve your palate profile. As more users join, you'll discover palate twins!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
