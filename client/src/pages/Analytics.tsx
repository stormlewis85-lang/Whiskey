import { useQuery } from "@tanstack/react-query";
import { Whiskey } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import {
  BarChart3,
  AlertCircle,
  Home,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Target,
  Droplets,
  Wine,
  ShoppingBag,
  Bookmark,
} from "lucide-react";
import { Link } from "wouter";
import { useAnalyticsData, PalateProfile } from "@/hooks/use-analytics-data";
import { RadarChart } from "@/components/RadarChart";

const CHART_COLORS = [
  "hsl(36, 90%, 54%)",
  "hsl(30, 80%, 45%)",
  "hsl(25, 70%, 50%)",
  "hsl(40, 75%, 55%)",
  "hsl(20, 65%, 45%)",
  "hsl(35, 85%, 60%)",
  "hsl(45, 80%, 50%)",
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 shadow-warm-lg rounded-lg px-3 py-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm text-muted-foreground">
            <span style={{ color: entry.color }}>{entry.name || entry.dataKey}:</span>{" "}
            <span className="font-semibold text-foreground">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border/50 shadow-warm-lg rounded-lg px-3 py-2">
        <p className="text-sm font-medium text-foreground">{data.name}</p>
        <p className="text-xs text-muted-foreground">
          {payload[0].name}: {typeof data.x === 'number' && data.x > 20 ? `$${data.x.toFixed(0)}` : data.x}
        </p>
        <p className="text-xs text-muted-foreground">
          Rating: {data.y.toFixed(1)}
        </p>
      </div>
    );
  }
  return null;
};

function EmptyChart({ message, icon: Icon = AlertCircle }: { message: string; icon?: any }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-4">
      <Icon className="h-8 w-8 text-muted-foreground/40 mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="relative rounded-xl bg-card border border-border/40 shadow-warm-xs overflow-hidden">
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-muted/50 rounded-full blur-2xl" />
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}
          >
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
              {label}
            </p>
            <p className="font-sans text-2xl font-semibold tabular-nums text-foreground">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const AXIS_TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };
const AXIS_TICK_LG = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

export default function Analytics() {
  const { user } = useAuth();

  const {
    data: whiskeys,
    isLoading: whiskeyLoading,
    error: whiskeyError,
  } = useQuery<Whiskey[]>({
    queryKey: ["/api/whiskeys"],
    enabled: !!user,
  });

  const {
    data: palateProfile,
    isLoading: palateLoading,
  } = useQuery<PalateProfile>({
    queryKey: [`/api/users/${user?.id}/palate-profile`],
    enabled: !!user?.id,
  });

  const analytics = useAnalyticsData(whiskeys, palateProfile);
  const isLoading = whiskeyLoading || palateLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted-foreground/20" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-muted-foreground border-t-transparent animate-spin" />
          </div>
          <p className="mt-6 text-muted-foreground font-medium">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (whiskeyError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-card border border-destructive/30 rounded-xl shadow-warm-sm p-8 text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Error loading analytics
            </h3>
            <p className="mt-2 text-muted-foreground">
              There was an error loading your data. Please try again.
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
            <h3 className="text-xl font-semibold text-foreground">
              No data yet
            </h3>
            <p className="mt-2 text-muted-foreground">
              Add some whiskeys to your collection to see analytics.
            </p>
            <Link href="/">
              <Button className="mt-6">Go to Collection</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { valueBreakdown } = analytics;
  const scoringTendencies = palateProfile?.scoringTendencies;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <header className="relative py-8 md:py-12 lg:py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-label-caps text-primary mb-3">Deep Insights</p>
              <h1 className="text-display-hero text-foreground">Analytics</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Explore your collection, palate, and drinking trends
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Tabs defaultValue="collection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="palate">Palate</TabsTrigger>
            <TabsTrigger value="deep-dive">Deep Dive</TabsTrigger>
          </TabsList>

          {/* ========== TAB 1: COLLECTION ========== */}
          <TabsContent value="collection" className="space-y-6">
            {/* Value Stat Cards */}
            {valueBreakdown && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Paid"
                  value={`$${valueBreakdown.totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  icon={DollarSign}
                  color="text-emerald-500"
                  bgColor="bg-emerald-500/10"
                />
                <StatCard
                  label="Total MSRP"
                  value={`$${valueBreakdown.totalMsrp.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  icon={TrendingUp}
                  color="text-blue-500"
                  bgColor="bg-blue-500/10"
                />
                <StatCard
                  label={valueBreakdown.delta >= 0 ? "Savings" : "Over MSRP"}
                  value={`$${Math.abs(valueBreakdown.delta).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  icon={valueBreakdown.delta >= 0 ? TrendingDown : TrendingUp}
                  color={valueBreakdown.delta >= 0 ? "text-emerald-500" : "text-red-500"}
                  bgColor={valueBreakdown.delta >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
                />
                <StatCard
                  label="Avg / Bottle"
                  value={`$${valueBreakdown.avgPerBottle.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  icon={Package}
                  color="text-amber-500"
                  bgColor="bg-amber-500/10"
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Collection Growth Timeline */}
              <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-lg">
                    Collection Growth
                  </CardTitle>
                  <CardDescription>
                    Monthly additions and cumulative total
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="h-[300px]">
                    {analytics.growthTimeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={analytics.growthTimeline}
                          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border/50"
                          />
                          <XAxis
                            dataKey="month"
                            tick={AXIS_TICK}
                            interval={0}
                            angle={-35}
                            textAnchor="end"
                            height={45}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={AXIS_TICK_LG}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={AXIS_TICK_LG}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="added"
                            name="Added"
                            fill={CHART_COLORS[0]}
                            radius={[4, 4, 0, 0]}
                          />
                          <Line
                            yAxisId="right"
                            dataKey="cumulative"
                            name="Total"
                            stroke={CHART_COLORS[2]}
                            strokeWidth={2}
                            dot={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart message="No date information available for your bottles" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Status Breakdown */}
              <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-lg">
                    Bottle Status
                  </CardTitle>
                  <CardDescription>
                    Sealed, open, finished, and gifted
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="h-[280px]">
                    {analytics.statusBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.statusBreakdown}
                            cx="50%"
                            cy="45%"
                            outerRadius={70}
                            dataKey="value"
                            nameKey="name"
                          >
                            {analytics.statusBreakdown.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            iconSize={10}
                            wrapperStyle={{
                              fontSize: "11px",
                              paddingTop: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart message="No bottle status data available" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price vs Rating Scatter */}
            <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-lg">
                  Price vs Rating
                </CardTitle>
                <CardDescription>
                  Does spending more get you better whiskey?
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <div className="h-[300px]">
                  {analytics.priceRatingScatter.length >= 3 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border/50"
                        />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name="Price"
                          tick={AXIS_TICK_LG}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="Rating"
                          tick={AXIS_TICK_LG}
                          domain={[0, 5]}
                        />
                        <ZAxis range={[40, 40]} />
                        <Tooltip content={<ScatterTooltip />} />
                        <Scatter
                          data={analytics.priceRatingScatter}
                          fill={CHART_COLORS[0]}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="Need at least 3 bottles with price and rating data" icon={DollarSign} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Distillery Loyalty Table */}
            <Card className="bg-card border-border/50 shadow-warm-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-lg">
                  Distillery Loyalty
                </CardTitle>
                <CardDescription>
                  Your top distilleries by bottle count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {analytics.distilleryLoyalty.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                            Distillery
                          </th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                            Bottles
                          </th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">
                            Avg Rating
                          </th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">
                            Total Spent
                          </th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground hidden lg:table-cell">
                            Avg Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.distilleryLoyalty.map((row) => (
                          <tr
                            key={row.distillery}
                            className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                          >
                            <td className="py-3 px-4 font-medium text-foreground">
                              {row.distillery}
                            </td>
                            <td className="py-3 px-4 text-foreground tabular-nums">
                              {row.count}
                            </td>
                            <td className="py-3 px-4 text-foreground tabular-nums hidden sm:table-cell">
                              {row.avgRating > 0
                                ? row.avgRating.toFixed(1)
                                : "—"}
                            </td>
                            <td className="py-3 px-4 text-foreground tabular-nums hidden md:table-cell">
                              {row.totalSpend > 0
                                ? `$${row.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                : "—"}
                            </td>
                            <td className="py-3 px-4 text-foreground tabular-nums hidden lg:table-cell">
                              {row.avgPrice > 0
                                ? `$${row.avgPrice.toFixed(0)}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <EmptyChart message="Add distillery info to your bottles to see loyalty data" />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== TAB 2: PALATE ========== */}
          <TabsContent value="palate" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Flavor Radar */}
              <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-lg">
                    Flavor Profile
                  </CardTitle>
                  <CardDescription>
                    Average flavor ratings across your reviews
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <div className="h-[250px] flex items-center justify-center">
                    {analytics.flavorRadar ? (
                      <RadarChart
                        flavorProfile={analytics.flavorRadar}
                        size={230}
                      />
                    ) : (
                      <EmptyChart
                        message="Review at least 3 bottles with flavor profiles"
                        icon={Droplets}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Scoring Tendency */}
              <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-lg">
                    Scoring Tendencies
                  </CardTitle>
                  <CardDescription>
                    How you score across the 6 review components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {scoringTendencies && scoringTendencies.averageOverall !== null ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            scoringTendencies.tendency === "generous"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : scoringTendencies.tendency === "critical"
                                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                                : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {scoringTendencies.tendency.charAt(0).toUpperCase() +
                            scoringTendencies.tendency.slice(1)}{" "}
                          Reviewer
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Overall avg:{" "}
                          <span className="font-semibold text-foreground">
                            {scoringTendencies.averageOverall.toFixed(1)}
                          </span>
                        </span>
                      </div>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={[
                              { name: "Visual", value: scoringTendencies.averageOverall },
                              { name: "Nose", value: scoringTendencies.averageNose },
                              { name: "Mouthfeel", value: scoringTendencies.averageMouthfeel },
                              { name: "Taste", value: scoringTendencies.averageTaste },
                              { name: "Finish", value: scoringTendencies.averageFinish },
                              { name: "Value", value: scoringTendencies.averageValue },
                            ].filter((d) => d.value !== null)}
                            margin={{ top: 5, right: 20, left: 70, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-border/50"
                            />
                            <XAxis
                              type="number"
                              domain={[0, 5]}
                              tick={AXIS_TICK_LG}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              tick={AXIS_TICK_LG}
                              width={65}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar
                              dataKey="value"
                              fill={CHART_COLORS[0]}
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <EmptyChart
                      message="Write some reviews to see your scoring tendencies"
                      icon={Target}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Flavors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["nose", "taste", "finish"] as const).map((category) => {
                const flavors = palateProfile?.topFlavors?.[category]?.slice(0, 8) || [];
                return (
                  <Card
                    key={category}
                    className="bg-card border-border/50 shadow-warm-sm overflow-hidden"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-foreground text-lg">
                        Top {category.charAt(0).toUpperCase() + category.slice(1)} Flavors
                      </CardTitle>
                      <CardDescription>
                        Most frequently noted {category} flavors
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                      <div className="h-[300px]">
                        {flavors.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              layout="vertical"
                              data={flavors.map((f) => ({
                                name: f.flavor,
                                count: f.count,
                              }))}
                              margin={{
                                top: 5,
                                right: 20,
                                left: 80,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-border/50"
                              />
                              <XAxis type="number" tick={AXIS_TICK_LG} />
                              <YAxis
                                type="category"
                                dataKey="name"
                                tick={AXIS_TICK}
                                width={75}
                              />
                              <Tooltip content={<ChartTooltip />} />
                              <Bar
                                dataKey="count"
                                fill={
                                  category === "nose"
                                    ? CHART_COLORS[0]
                                    : category === "taste"
                                      ? CHART_COLORS[2]
                                      : CHART_COLORS[4]
                                }
                                radius={[0, 4, 4, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyChart
                            message={`No ${category} flavor data yet — add flavor tags to your reviews`}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ========== TAB 3: DEEP DIVE ========== */}
          <TabsContent value="deep-dive" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Age vs Rating */}
              <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-lg">
                    Age vs Rating
                  </CardTitle>
                  <CardDescription>
                    Does older whiskey taste better?
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="h-[300px]">
                    {analytics.ageRating.length >= 3 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border/50"
                          />
                          <XAxis
                            type="number"
                            dataKey="x"
                            name="Age"
                            tick={AXIS_TICK_LG}
                            tickFormatter={(v) => `${v}yr`}
                          />
                          <YAxis
                            type="number"
                            dataKey="y"
                            name="Rating"
                            tick={AXIS_TICK_LG}
                            domain={[0, 5]}
                          />
                          <ZAxis range={[40, 40]} />
                          <Tooltip content={<ScatterTooltip />} />
                          <Scatter
                            data={analytics.ageRating}
                            fill={CHART_COLORS[1]}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart message="Add age statements to see correlations" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ABV Sweet Spot */}
              <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-lg">
                    ABV Sweet Spot
                  </CardTitle>
                  <CardDescription>
                    Average rating by proof range
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="h-[280px]">
                    {analytics.abvSweetSpot.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.abvSweetSpot}
                          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border/50"
                          />
                          <XAxis dataKey="name" tick={AXIS_TICK} />
                          <YAxis
                            tick={AXIS_TICK_LG}
                            domain={[0, 5]}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar
                            dataKey="avgRating"
                            name="Avg Rating"
                            fill={CHART_COLORS[3]}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart message="Add proof/ABV data to your bottles" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mash Bill */}
              <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-lg">
                    Mash Bill Performance
                  </CardTitle>
                  <CardDescription>Avg rating by mash bill type</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="h-[250px]">
                    {analytics.mashBillPerformance.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.mashBillPerformance}
                          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border/50"
                          />
                          <XAxis
                            dataKey="name"
                            tick={AXIS_TICK}
                            interval={0}
                            angle={-35}
                            textAnchor="end"
                            height={55}
                          />
                          <YAxis tick={AXIS_TICK_LG} domain={[0, 5]} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar
                            dataKey="avgRating"
                            name="Avg Rating"
                            fill={CHART_COLORS[0]}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart message="Not enough data — add mash bill info to your bottles" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bottle Type */}
              <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-lg">
                    Bottle Type Analysis
                  </CardTitle>
                  <CardDescription>
                    Single barrel vs small batch vs...
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="h-[250px]">
                    {analytics.bottleTypeAnalysis.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.bottleTypeAnalysis}
                          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border/50"
                          />
                          <XAxis
                            dataKey="name"
                            tick={AXIS_TICK}
                            interval={0}
                            angle={-35}
                            textAnchor="end"
                            height={55}
                          />
                          <YAxis tick={AXIS_TICK_LG} domain={[0, 5]} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar
                            dataKey="avgRating"
                            name="Avg Rating"
                            fill={CHART_COLORS[2]}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart message="Not enough data — add bottle type info to your bottles" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cask Finish */}
              <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-lg">
                    Cask Finish Impact
                  </CardTitle>
                  <CardDescription>
                    How finish affects your ratings
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="h-[250px]">
                    {analytics.caskFinishImpact.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.caskFinishImpact}
                          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border/50"
                          />
                          <XAxis
                            dataKey="name"
                            tick={AXIS_TICK}
                            interval={0}
                            angle={-35}
                            textAnchor="end"
                            height={55}
                          />
                          <YAxis tick={AXIS_TICK_LG} domain={[0, 5]} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar
                            dataKey="avgRating"
                            name="Avg Rating"
                            fill={CHART_COLORS[4]}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart message="Add cask finish info to see the impact" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom row: Wishlist stat + Purchase locations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="grid grid-cols-2 gap-4 lg:col-span-1">
                <StatCard
                  label="Owned"
                  value={analytics.ownedCount.toString()}
                  icon={Wine}
                  color="text-amber-500"
                  bgColor="bg-amber-500/10"
                />
                <StatCard
                  label="Wishlist"
                  value={analytics.wishlistCount.toString()}
                  icon={Bookmark}
                  color="text-blue-500"
                  bgColor="bg-blue-500/10"
                />
              </div>

              <Card className="bg-card border-border/50 shadow-warm-sm lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-lg">
                    Purchase Locations
                  </CardTitle>
                  <CardDescription>
                    Where you buy your bottles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    {analytics.purchaseLocations.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                              Location
                            </th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                              Bottles
                            </th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">
                              Avg Price
                            </th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">
                              Total Spent
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.purchaseLocations.map((row) => (
                            <tr
                              key={row.location}
                              className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                            >
                              <td className="py-3 px-4 font-medium text-foreground">
                                {row.location}
                              </td>
                              <td className="py-3 px-4 text-foreground tabular-nums">
                                {row.count}
                              </td>
                              <td className="py-3 px-4 text-foreground tabular-nums hidden sm:table-cell">
                                {row.avgPrice > 0
                                  ? `$${row.avgPrice.toFixed(0)}`
                                  : "—"}
                              </td>
                              <td className="py-3 px-4 text-foreground tabular-nums hidden md:table-cell">
                                {row.totalSpend > 0
                                  ? `$${row.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <EmptyChart
                        message="Add purchase locations to your bottles"
                        icon={ShoppingBag}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
