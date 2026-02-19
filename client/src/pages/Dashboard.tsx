import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Whiskey, ReviewNote } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Label } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Loader2, Home, Wine, Star, TrendingUp, DollarSign, BarChart3, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { calculateAverageRating } from "@/lib/utils/calculations";
import { formatWhiskeyName } from "@/lib/utils/formatName";

// Warm amber/gold color palette for charts
const CHART_COLORS = [
  'hsl(36, 90%, 54%)',   // Primary amber
  'hsl(30, 80%, 45%)',   // Rich amber
  'hsl(25, 70%, 50%)',   // Copper
  'hsl(40, 75%, 55%)',   // Gold
  'hsl(20, 65%, 45%)',   // Brown amber
  'hsl(35, 85%, 60%)',   // Light amber
  'hsl(45, 80%, 50%)',   // Warm yellow
];

// Tooltip styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 shadow-warm-lg rounded-lg px-3 py-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-foreground font-semibold">
          {payload[0].value} {payload[0].value === 1 ? 'whiskey' : 'whiskeys'}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch whiskey data
  const { data: whiskeys, isLoading, error } = useQuery<Whiskey[]>({
    queryKey: ["/api/whiskeys"],
    enabled: !!user,
  });

  // Function to parse reviews and extract data
  const getReviewsData = (whiskeys: Whiskey[] | undefined) => {
    if (!whiskeys) return { reviewsByMonth: [], scoreDistribution: [] };

    // Ensure notes exists and is an array before mapping
    const reviews = whiskeys.flatMap(whiskey => {
      if (!whiskey.notes || !Array.isArray(whiskey.notes)) return [];
      return whiskey.notes.map((note: ReviewNote) => ({
        ...note,
        whiskey: whiskey.name,
        date: new Date(note.date)
      }));
    });

    // Reviews by month
    const reviewsByMonth: { name: string, count: number }[] = [];
    const monthCounts = new Map<string, number>();

    reviews.forEach(review => {
      if (!review.date) return;
      const monthYear = new Date(review.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthCounts.set(monthYear, (monthCounts.get(monthYear) || 0) + 1);
    });

    // Sort by date
    const sortedMonths = Array.from(monthCounts.entries())
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
      });

    sortedMonths.forEach(([month, count]) => {
      reviewsByMonth.push({ name: month, count });
    });

    // Score distribution
    const scoreDistribution: { name: string, value: number }[] = [];
    const scoreCounts = new Map<number, number>();

    reviews.forEach(review => {
      if (typeof review.rating !== 'number') return;
      const roundedScore = Math.round(review.rating * 2) / 2;
      scoreCounts.set(roundedScore, (scoreCounts.get(roundedScore) || 0) + 1);
    });

    for (let score = 1; score <= 5; score += 0.5) {
      scoreDistribution.push({
        name: score.toString(),
        value: scoreCounts.get(score) || 0
      });
    }

    return { reviewsByMonth, scoreDistribution };
  };

  // Collection analysis data
  const getCollectionData = (whiskeys: Whiskey[] | undefined) => {
    if (!whiskeys) return { typeDistribution: [], regionDistribution: [], priceDistribution: [] };

    // Type distribution
    const typeMap = new Map<string, number>();
    whiskeys.forEach(whiskey => {
      const type = whiskey.type || 'Unknown';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    const typeDistribution = Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Region distribution
    const regionMap = new Map<string, number>();
    whiskeys.forEach(whiskey => {
      const region = whiskey.region || 'Unknown';
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
    });

    const regionDistribution = Array.from(regionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Price distribution
    const priceRanges = [
      { min: 0, max: 30, label: "$0-30" },
      { min: 30, max: 50, label: "$30-50" },
      { min: 50, max: 75, label: "$50-75" },
      { min: 75, max: 100, label: "$75-100" },
      { min: 100, max: 150, label: "$100-150" },
      { min: 150, max: 200, label: "$150-200" },
      { min: 200, max: Infinity, label: "$200+" }
    ];

    const priceRangeCounts = new Map<string, number>();
    priceRanges.forEach(range => priceRangeCounts.set(range.label, 0));

    whiskeys.forEach(whiskey => {
      if (typeof whiskey.price !== 'number') return;

      const range = priceRanges.find(range =>
        whiskey.price !== null &&
        whiskey.price >= range.min &&
        whiskey.price < range.max
      );

      if (range) {
        priceRangeCounts.set(range.label, (priceRangeCounts.get(range.label) || 0) + 1);
      }
    });

    const priceDistribution = Array.from(priceRangeCounts.entries())
      .map(([name, value]) => ({ name, value }));

    return { typeDistribution, regionDistribution, priceDistribution };
  };

  // Top rated whiskeys
  const getTopRatedWhiskeys = (whiskeys: Whiskey[] | undefined, limit = 5) => {
    if (!whiskeys) return [];

    return [...whiskeys]
      .filter(w => w.rating !== null && w.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit)
      .map(whiskey => ({
        name: whiskey.name,
        rating: whiskey.rating || 0,
        distillery: whiskey.distillery || 'Unknown',
        type: whiskey.type || 'Unknown'
      }));
  };

  const { reviewsByMonth, scoreDistribution } = getReviewsData(whiskeys);
  const { typeDistribution, regionDistribution, priceDistribution } = getCollectionData(whiskeys);
  const topRatedWhiskeys = getTopRatedWhiskeys(whiskeys);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted-foreground/20" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-muted-foreground border-t-transparent animate-spin" />
          </div>
          <p className="mt-6 text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-card border border-destructive/30 rounded-xl shadow-warm-sm p-8 text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Error loading dashboard</h3>
            <p className="mt-2 text-muted-foreground">
              There was an error loading your collection data. Please try again.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!whiskeys || whiskeys.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-card border border-border/50 rounded-xl shadow-warm-sm p-10 text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <BarChart3 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No data yet</h3>
            <p className="mt-2 text-muted-foreground">
              Add some whiskeys to your collection to see analytics and insights.
            </p>
            <Link href="/">
              <Button className="mt-6">
                Go to Collection
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <header className="relative py-8 md:py-12 lg:py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-label-caps text-primary mb-3">Analytics</p>
              <h1 className="text-display-hero text-foreground">Dashboard</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                {whiskeys.length} {whiskeys.length === 1 ? 'whiskey' : 'whiskeys'} in your collection
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Back to Collection
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Whiskeys",
              value: whiskeys.length.toString(),
              icon: Wine,
              color: "text-muted-foreground",
              bgColor: "bg-muted",
            },
            {
              label: "Reviews Written",
              value: whiskeys.reduce((total, w) => {
                const notesCount = Array.isArray(w.notes) ? w.notes.length : 0;
                return total + notesCount;
              }, 0).toString(),
              icon: Star,
              color: "text-amber-500",
              bgColor: "bg-amber-500/10",
            },
            {
              label: "Average Rating",
              value: calculateAverageRating(whiskeys),
              icon: TrendingUp,
              color: "text-emerald-500",
              bgColor: "bg-emerald-500/10",
            },
            {
              label: "Collection Value",
              value: `$${whiskeys.reduce((total, w) => total + (w.price || 0), 0).toLocaleString()}`,
              icon: DollarSign,
              color: "text-blue-500",
              bgColor: "bg-blue-500/10",
            },
          ].map((stat) => (
            <Card key={stat.label} className="relative rounded-xl bg-card border border-border/40 shadow-warm-xs overflow-hidden">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-muted/50 rounded-full blur-2xl" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">{stat.label}</p>
                    <p className="font-sans text-2xl font-semibold tabular-nums text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Collection by Type</CardTitle>
              <CardDescription>Distribution of whiskey types</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="45%"
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {typeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconSize={10}
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Collection by Region</CardTitle>
              <CardDescription>Distribution of whiskey regions</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionDistribution}
                      cx="50%"
                      cy="45%"
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {regionDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconSize={10}
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Price Distribution</CardTitle>
              <CardDescription>Whiskeys by price range</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priceDistribution}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="hsl(36, 90%, 54%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Reviews Over Time</CardTitle>
              <CardDescription>Number of reviews by month</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reviewsByMonth}
                    margin={{ top: 10, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="hsl(30, 80%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Rating Distribution</CardTitle>
              <CardDescription>Number of whiskeys by rating</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scoreDistribution}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="hsl(40, 75%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Rated Whiskeys */}
        <Card className="bg-card border-border/50 shadow-warm-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-lg">Top Rated Whiskeys</CardTitle>
            <CardDescription>Your highest rated whiskeys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Rank</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">Distillery</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">Type</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {topRatedWhiskeys.map((whiskey, index) => (
                    <tr key={index} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                          index === 1 ? 'bg-slate-300/20 text-slate-600 dark:text-slate-400' :
                          index === 2 ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{formatWhiskeyName(whiskey.name)}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{whiskey.distillery}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{whiskey.type}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="font-bold text-foreground">{whiskey.rating.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {topRatedWhiskeys.length === 0 && (
                    <tr>
                      <td className="py-8 px-4 text-center text-muted-foreground" colSpan={5}>
                        No rated whiskeys yet. Start reviewing your collection!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
