import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useRoute } from 'wouter';
import {
  GitCompareArrows,
  Wine,
  Star,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface ComparisonResult {
  user1Stats: { totalBottles: number; avgRating: number; topTypes: string[] };
  user2Stats: { totalBottles: number; avgRating: number; topTypes: string[] };
  shared: Array<{ name: string; type: string | null; distillery: string | null }>;
  uniqueToUser1: Array<{ name: string; type: string | null; distillery: string | null }>;
  uniqueToUser2: Array<{ name: string; type: string | null; distillery: string | null }>;
  overlapPercentage: number;
}

const StatBlock = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="text-center">
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
    {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const BottleList = ({
  bottles,
  title,
  emptyMessage,
  color,
}: {
  bottles: Array<{ name: string; type: string | null; distillery: string | null }>;
  title: string;
  emptyMessage: string;
  color: string;
}) => (
  <div>
    <h3 className={cn('text-sm font-medium mb-3 flex items-center gap-2', color)}>
      <Wine className="h-4 w-4" />
      {title} ({bottles.length})
    </h3>
    {bottles.length === 0 ? (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    ) : (
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {bottles.map((b, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/30">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {b.distillery}{b.type && ` \u00b7 ${b.type}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default function CollectionCompare() {
  const { user } = useAuth();
  const [, params] = useRoute('/compare/:userId');
  const targetUserId = params?.userId;

  const { data: comparison, isLoading, error } = useQuery<ComparisonResult>({
    queryKey: [`/api/collections/compare/${targetUserId}`],
    enabled: !!user && !!targetUserId,
  });

  return (
    <>
      <Helmet>
        <title>Compare Collections | MyWhiskeyPedia</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        <header className="relative py-8 md:py-12">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
              <Link href="/community">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <p className="text-label-caps text-primary mb-3">Social</p>
            <h1 className="text-display-hero text-foreground flex items-center gap-3">
              <GitCompareArrows className="h-8 w-8" />
              Collection Comparison
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isLoading ? (
            <div className="space-y-6">
              <Card className="bg-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex justify-around">
                    <Skeleton className="h-16 w-20" />
                    <Skeleton className="h-16 w-20" />
                    <Skeleton className="h-16 w-20" />
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="bg-card border-border/50">
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-32 mb-4" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : error ? (
            <Card className="bg-card border-border/50">
              <CardContent className="p-10 text-center">
                <p className="text-destructive">Could not load comparison. The user may have a private profile.</p>
              </CardContent>
            </Card>
          ) : comparison ? (
            <div className="space-y-6">
              {/* Overlap Summary */}
              <Card className="bg-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center mb-4">
                    <span className="text-3xl font-bold text-primary">{comparison.overlapPercentage}%</span>
                    <span className="text-sm text-muted-foreground">Collection Overlap</span>
                  </div>
                  <Progress value={comparison.overlapPercentage} className="h-2 mb-6" />

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <StatBlock
                      label="Your Bottles"
                      value={comparison.user1Stats.totalBottles}
                      sub={comparison.user1Stats.avgRating > 0 ? `Avg ${comparison.user1Stats.avgRating}` : undefined}
                    />
                    <StatBlock
                      label="In Common"
                      value={comparison.shared.length}
                    />
                    <StatBlock
                      label="Their Bottles"
                      value={comparison.user2Stats.totalBottles}
                      sub={comparison.user2Stats.avgRating > 0 ? `Avg ${comparison.user2Stats.avgRating}` : undefined}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Type Preferences Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Your Top Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {comparison.user1Stats.topTypes.map((t) => (
                        <Badge key={t} variant="secondary">{t}</Badge>
                      ))}
                      {comparison.user1Stats.topTypes.length === 0 && (
                        <span className="text-sm text-muted-foreground">No data</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Their Top Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {comparison.user2Stats.topTypes.map((t) => (
                        <Badge key={t} variant="secondary">{t}</Badge>
                      ))}
                      {comparison.user2Stats.topTypes.length === 0 && (
                        <span className="text-sm text-muted-foreground">No data</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottle Lists */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border/50">
                  <CardContent className="p-4">
                    <BottleList
                      bottles={comparison.shared}
                      title="Shared Bottles"
                      emptyMessage="No bottles in common"
                      color="text-primary"
                    />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border/50">
                  <CardContent className="p-4">
                    <BottleList
                      bottles={comparison.uniqueToUser1}
                      title="Only in Your Collection"
                      emptyMessage="All your bottles are shared"
                      color="text-blue-400"
                    />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border/50">
                  <CardContent className="p-4">
                    <BottleList
                      bottles={comparison.uniqueToUser2}
                      title="Only in Their Collection"
                      emptyMessage="All their bottles are shared"
                      color="text-violet-400"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
}
