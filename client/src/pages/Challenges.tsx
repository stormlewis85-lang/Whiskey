import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import {
  Trophy,
  Target,
  Flame,
  Compass,
  Eye,
  Users,
  Star,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface Challenge {
  id: number;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  goalCount: number;
  goalDetails: any;
  xpReward: number;
  durationDays: number | null;
  isRecurring: boolean;
}

interface UserChallenge {
  id: number;
  userId: number;
  challengeId: number;
  progress: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  challenge: Challenge;
}

const typeIcons: Record<string, React.ReactNode> = {
  review_streak: <Flame className="h-5 w-5 text-orange-400" />,
  flavor_hunt: <Target className="h-5 w-5 text-emerald-400" />,
  explore_type: <Compass className="h-5 w-5 text-blue-400" />,
  blind_identify: <Eye className="h-5 w-5 text-purple-400" />,
  community_challenge: <Users className="h-5 w-5 text-pink-400" />,
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  expert: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function ChallengeCard({ challenge, onJoin, isJoining }: {
  challenge: Challenge;
  onJoin: (id: number) => void;
  isJoining: boolean;
}) {
  return (
    <Card className="bg-card/50 border-border/30 hover:border-border/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {typeIcons[challenge.type] || <Star className="h-5 w-5 text-amber-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{challenge.title}</h3>
              <Badge variant="outline" className={cn('text-[10px] shrink-0', difficultyColors[challenge.difficulty])}>
                {challenge.difficulty}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{challenge.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  {challenge.xpReward} XP
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" />
                  {challenge.goalCount} goal
                </span>
                {challenge.durationDays && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {challenge.durationDays}d
                  </span>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => onJoin(challenge.id)}
                disabled={isJoining}
                className="h-7 text-xs bg-primary/80 hover:bg-primary"
              >
                {isJoining ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Join'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveChallengeCard({ uc }: { uc: UserChallenge }) {
  const progressPct = Math.min((uc.progress / uc.challenge.goalCount) * 100, 100);
  const isCompleted = uc.status === 'completed';

  return (
    <Card className={cn(
      "bg-card/50 border-border/30",
      isCompleted && "border-emerald-500/30 bg-emerald-500/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {isCompleted
              ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              : typeIcons[uc.challenge.type] || <Star className="h-5 w-5 text-amber-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{uc.challenge.title}</h3>
              {isCompleted && (
                <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Completed
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{uc.challenge.description}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {uc.progress} / {uc.challenge.goalCount}
                </span>
                <span className="text-muted-foreground">{Math.round(progressPct)}%</span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                {uc.challenge.xpReward} XP
              </span>
              {uc.completedAt && (
                <span>Completed {new Date(uc.completedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Challenges() {
  const { toast } = useToast();

  const { data: challenges, isLoading: loadingChallenges } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges'],
    queryFn: () => apiRequest('GET', '/api/challenges').then(r => r.json()),
  });

  const { data: activeChallenges, isLoading: loadingActive } = useQuery<UserChallenge[]>({
    queryKey: ['/api/user-challenges', 'active'],
    queryFn: () => apiRequest('GET', '/api/user-challenges?status=active').then(r => r.json()),
  });

  const { data: completedChallenges, isLoading: loadingCompleted } = useQuery<UserChallenge[]>({
    queryKey: ['/api/user-challenges', 'completed'],
    queryFn: () => apiRequest('GET', '/api/user-challenges?status=completed').then(r => r.json()),
  });

  const joinMutation = useMutation({
    mutationFn: (challengeId: number) =>
      apiRequest('POST', '/api/user-challenges', { challengeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-challenges'] });
      toast({ title: 'Challenge joined!', description: 'Good luck!' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to join challenge', variant: 'destructive' });
    },
  });

  // Filter out challenges already active
  const activeIds = new Set((activeChallenges || []).map(uc => uc.challengeId));
  const availableChallenges = (challenges || []).filter(c => !activeIds.has(c.id));

  return (
    <>
      <Helmet><title>Challenges | WhiskeyPedia</title></Helmet>
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-7 w-7 text-amber-400" />
          <div>
            <h1 className="text-xl font-bold">Challenges</h1>
            <p className="text-sm text-muted-foreground">Train your palate and earn XP</p>
          </div>
          <Link href="/progress" className="ml-auto">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border/50">
              My Progress <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active {activeChallenges?.length ? `(${activeChallenges.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="available">Browse</TabsTrigger>
            <TabsTrigger value="completed">
              Done {completedChallenges?.length ? `(${completedChallenges.length})` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {loadingActive ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))
            ) : !activeChallenges?.length ? (
              <Card className="bg-card/30 border-border/20">
                <CardContent className="p-8 text-center">
                  <Target className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No active challenges. Browse and join one!</p>
                </CardContent>
              </Card>
            ) : (
              activeChallenges.map(uc => (
                <ActiveChallengeCard key={uc.id} uc={uc} />
              ))
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-3">
            {loadingChallenges ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))
            ) : !availableChallenges.length ? (
              <Card className="bg-card/30 border-border/20">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">You've joined all available challenges!</p>
                </CardContent>
              </Card>
            ) : (
              availableChallenges.map(c => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  onJoin={joinMutation.mutate}
                  isJoining={joinMutation.isPending}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {loadingCompleted ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))
            ) : !completedChallenges?.length ? (
              <Card className="bg-card/30 border-border/20">
                <CardContent className="p-8 text-center">
                  <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Complete challenges to see them here.</p>
                </CardContent>
              </Card>
            ) : (
              completedChallenges.map(uc => (
                <ActiveChallengeCard key={uc.id} uc={uc} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
