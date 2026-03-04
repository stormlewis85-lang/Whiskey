import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import {
  Trophy,
  Flame,
  Star,
  TrendingUp,
  Target,
  Zap,
  Crown,
  ArrowRight,
  Medal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProgressData {
  userId: number;
  xp: number;
  level: number;
  title: string;
  xpRequired: number;
  nextLevelXp: number | null;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  totalReviews: number;
  totalChallengesCompleted: number;
  totalFlavorIds: number;
}

interface LeaderboardEntry extends UserProgressData {
  username: string;
  displayName: string | null;
  profileImage: string | null;
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card className="bg-card/50 border-border/30">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", color || "bg-primary/10")}>
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProgressPage() {
  const { data: progress, isLoading } = useQuery<UserProgressData>({
    queryKey: ['/api/progress'],
    queryFn: () => apiRequest('GET', '/api/progress').then(r => r.json()),
  });

  const { data: leaderboard, isLoading: loadingLeaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard'],
    queryFn: () => apiRequest('GET', '/api/leaderboard?limit=10').then(r => r.json()),
  });

  const xpToNext = progress?.nextLevelXp
    ? progress.nextLevelXp - progress.xp
    : null;
  const levelProgress = progress?.nextLevelXp
    ? ((progress.xp - progress.xpRequired) / (progress.nextLevelXp - progress.xpRequired)) * 100
    : 100;

  return (
    <>
      <Helmet><title>Progress | WhiskeyPedia</title></Helmet>
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-7 w-7 text-amber-400" />
          <div>
            <h1 className="text-xl font-bold">Your Progress</h1>
            <p className="text-sm text-muted-foreground">Track your palate development journey</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>
        ) : progress ? (
          <div className="space-y-6">
            {/* Level Card */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Crown className="h-7 w-7 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-400/70 uppercase tracking-wider">Level {progress.level}</p>
                    <h2 className="text-xl font-bold text-amber-100">{progress.title}</h2>
                    <p className="text-sm text-muted-foreground">{progress.xp.toLocaleString()} XP total</p>
                  </div>
                </div>
                {xpToNext !== null ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Level {progress.level}</span>
                      <span>{xpToNext} XP to Level {progress.level + 1}</span>
                    </div>
                    <Progress value={levelProgress} className="h-2" />
                  </div>
                ) : (
                  <p className="text-xs text-amber-400/60 text-center">Max level achieved!</p>
                )}
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Flame className="h-5 w-5 text-orange-400" />}
                label="Current Streak"
                value={`${progress.currentStreak} day${progress.currentStreak !== 1 ? 's' : ''}`}
                color="bg-orange-500/10"
              />
              <StatCard
                icon={<Flame className="h-5 w-5 text-red-400" />}
                label="Longest Streak"
                value={`${progress.longestStreak} day${progress.longestStreak !== 1 ? 's' : ''}`}
                color="bg-red-500/10"
              />
              <StatCard
                icon={<Star className="h-5 w-5 text-blue-400" />}
                label="Reviews"
                value={progress.totalReviews}
                color="bg-blue-500/10"
              />
              <StatCard
                icon={<Trophy className="h-5 w-5 text-emerald-400" />}
                label="Challenges Done"
                value={progress.totalChallengesCompleted}
                color="bg-emerald-500/10"
              />
            </div>

            {/* Quick Links */}
            <div className="flex gap-3">
              <Link href="/challenges" className="flex-1">
                <Button variant="outline" className="w-full gap-2 border-border/50 hover:bg-accent/50">
                  <Target className="h-4 w-4" />
                  Challenges
                </Button>
              </Link>
              <Link href="/exercises" className="flex-1">
                <Button variant="outline" className="w-full gap-2 border-border/50 hover:bg-accent/50">
                  <Zap className="h-4 w-4" />
                  Exercises
                </Button>
              </Link>
            </div>

            {/* Leaderboard */}
            <Card className="bg-card/50 border-border/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Medal className="h-5 w-5 text-amber-400" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loadingLeaderboard ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 mb-2 rounded-lg" />
                  ))
                ) : !leaderboard?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No public users on the leaderboard yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, i) => (
                      <div
                        key={entry.userId}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg",
                          i < 3 ? "bg-amber-500/5" : "bg-card/30",
                          entry.userId === progress.userId && "ring-1 ring-primary/30"
                        )}
                      >
                        <span className={cn(
                          "w-6 text-center font-bold text-sm",
                          i === 0 ? "text-amber-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                        )}>
                          {i + 1}
                        </span>
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={entry.profileImage || undefined} />
                          <AvatarFallback className="text-xs bg-muted">
                            {(entry.displayName || entry.username).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {entry.displayName || entry.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Level {entry.level} · {entry.title}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                          {entry.xp.toLocaleString()} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </>
  );
}
