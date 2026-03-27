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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { MobilePageHeader } from "@/components/MobilePageHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BarChart3,
  AlertCircle,
  ArrowLeft,
  Star,
  Droplets,
  Wine,
  ShoppingBag,
  Bookmark,
  Target,
} from "lucide-react";
import { Link } from "wouter";
import { useAnalyticsData, PalateProfile } from "@/hooks/use-analytics-data";
import { RadarChart } from "@/components/RadarChart";

// ── Chart styling ──

const CHART_COLORS = [
  "hsl(36, 90%, 54%)",   // gold
  "hsl(30, 80%, 45%)",   // amber
  "hsl(25, 70%, 50%)",   // copper
  "hsl(40, 75%, 55%)",   // honey
  "hsl(20, 65%, 45%)",   // tawny
  "hsl(35, 85%, 60%)",   // wheat
  "hsl(45, 80%, 50%)",   // straw
];

const AXIS_STYLE = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };
const AXIS_STYLE_LG = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/40 shadow-lg rounded-lg px-3 py-2">
      <p className="text-xs font-medium text-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span style={{ color: entry.color }}>{entry.name || entry.dataKey}:</span>{" "}
          <span className="font-semibold text-foreground">
            {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

const ScatterTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-card border border-border/40 shadow-lg rounded-lg px-3 py-2">
      <p className="text-xs font-medium text-foreground">{data.name}</p>
      <p className="text-xs text-muted-foreground">
        {payload[0].name}: {typeof data.x === "number" && data.x > 20 ? `$${data.x.toFixed(0)}` : data.x}
      </p>
      <p className="text-xs text-muted-foreground">Rating: {data.y.toFixed(1)}</p>
    </div>
  );
};

// ── Shared components ──

function EmptyState({ message, icon: Icon = AlertCircle }: { message: string; icon?: any }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-6">
      <Icon className="h-6 w-6 text-muted-foreground/25 mb-3" />
      <p className="text-xs text-muted-foreground/50">{message}</p>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="text-center py-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-medium mb-1">{label}</p>
      <p className="font-display text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground/40 mt-0.5">{sub}</p>}
    </div>
  );
}

function Section({ title, description, children, className }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="font-display text-lg text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground/50 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ChartCard({ title, description, height = 300, children }: {
  title: string;
  description?: string;
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden">
      <div className="px-5 pt-5 pb-2">
        <h3 className="font-display text-base text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground/40 mt-0.5">{description}</p>}
      </div>
      <div className="px-2 sm:px-4 pb-4" style={{ height }}>
        {children}
      </div>
    </div>
  );
}

function DataTable({ columns, rows }: {
  columns: { key: string; label: string; hide?: string }[];
  rows: Record<string, any>[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/30">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-2.5 px-4 text-left text-[10px] uppercase tracking-[0.15em] font-medium text-muted-foreground/50 ${col.hide || ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/15 hover:bg-accent/20 transition-colors">
              {columns.map((col, j) => (
                <td
                  key={col.key}
                  className={`py-2.5 px-4 text-sm ${j === 0 ? "font-medium text-foreground" : "text-foreground/70 tabular-nums"} ${col.hide || ""}`}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Decorative divider ──

function Divider({ label }: { label?: string }) {
  if (!label) return <div className="h-px bg-border/20 my-8" />;
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="h-px flex-1 bg-border/20" />
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/30 font-medium shrink-0">{label}</span>
      <div className="h-px flex-1 bg-border/20" />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function Analytics() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { data: whiskeys, isLoading: whiskeyLoading, error: whiskeyError } = useQuery<Whiskey[]>({
    queryKey: ["/api/whiskeys"],
    enabled: !!user,
  });

  const { data: palateProfile, isLoading: palateLoading } = useQuery<PalateProfile>({
    queryKey: [`/api/users/${user?.id}/palate-profile`],
    enabled: !!user?.id,
  });

  const analytics = useAnalyticsData(whiskeys, palateProfile);
  const isLoading = whiskeyLoading || palateLoading;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {isMobile ? <MobilePageHeader /> : <Header />}
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <BarChart3 className="h-8 w-8 text-primary animate-pulse mb-4" />
          <p className="text-sm text-muted-foreground/50">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (whiskeyError) {
    return (
      <div className="min-h-screen bg-background">
        {isMobile ? <MobilePageHeader /> : <Header />}
        <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive/60 mb-4" />
          <h3 className="font-display text-lg text-foreground mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground/50 mb-6">Unable to load your analytics data.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // ── Empty ──
  if (!whiskeys || whiskeys.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {isMobile ? <MobilePageHeader /> : <Header />}
        <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground/25 mb-4" />
          <h3 className="font-display text-lg text-foreground mb-1">No data yet</h3>
          <p className="text-sm text-muted-foreground/50 mb-6">Add whiskeys to your collection to unlock analytics.</p>
          <Link href="/"><Button>Go to Collection</Button></Link>
        </div>
      </div>
    );
  }

  const { valueBreakdown } = analytics;
  const scoringTendencies = palateProfile?.scoringTendencies;

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? <MobilePageHeader /> : <Header />}

      {/* ━━ Masthead ━━ */}
      <header className="pt-8 pb-6 md:pt-12 md:pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-primary/50 font-medium mb-2">Deep Insights</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">Analytics</h1>
              <p className="text-sm text-muted-foreground/50 mt-2">Your collection, palate, and trends</p>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-muted-foreground/40 hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ━━ Content ━━ */}
      <main className="max-w-5xl mx-auto px-6 pb-12">
        <Tabs defaultValue="collection" className="space-y-0">
          <TabsList className="grid w-full grid-cols-3 max-w-sm mb-8 bg-muted/30">
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="palate">Palate</TabsTrigger>
            <TabsTrigger value="deep-dive">Deep Dive</TabsTrigger>
          </TabsList>

          {/* ══════════ TAB 1: COLLECTION ══════════ */}
          <TabsContent value="collection" className="space-y-0">

            {/* Value Metrics — hero strip */}
            {valueBreakdown && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl overflow-hidden border border-border/30 bg-border/30 mb-8">
                <Metric label="Total Paid" value={`$${valueBreakdown.totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                <Metric label="Total MSRP" value={`$${valueBreakdown.totalMsrp.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                <Metric
                  label={valueBreakdown.delta >= 0 ? "Savings" : "Over MSRP"}
                  value={`$${Math.abs(valueBreakdown.delta).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  sub={valueBreakdown.delta >= 0 ? "under retail" : "above retail"}
                />
                <Metric label="Avg / Bottle" value={`$${valueBreakdown.avgPerBottle.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ChartCard title="Collection Growth" description="Monthly additions and cumulative total">
                {analytics.growthTimeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analytics.growthTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="month" tick={AXIS_STYLE} interval={0} angle={-35} textAnchor="end" height={45} />
                      <YAxis yAxisId="left" tick={AXIS_STYLE_LG} />
                      <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE_LG} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Bar yAxisId="left" dataKey="added" name="Added" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
                      <Line yAxisId="right" dataKey="cumulative" name="Total" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No date information available for your bottles" />
                )}
              </ChartCard>

              <ChartCard title="Bottle Status" description="Sealed, open, finished, and gifted" height={280}>
                {analytics.statusBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics.statusBreakdown} cx="50%" cy="45%" outerRadius={70} innerRadius={35} dataKey="value" nameKey="name" strokeWidth={0}>
                        {analytics.statusBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No bottle status data available" />
                )}
              </ChartCard>
            </div>

            <ChartCard title="Price vs Rating" description="Does spending more get you better whiskey?">
              {analytics.priceRatingScatter.length >= 3 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis type="number" dataKey="x" name="Price" tick={AXIS_STYLE_LG} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="number" dataKey="y" name="Rating" tick={AXIS_STYLE_LG} domain={[0, 5]} />
                    <ZAxis range={[50, 50]} />
                    <Tooltip content={<ScatterTooltip />} />
                    <Scatter data={analytics.priceRatingScatter} fill={CHART_COLORS[0]} />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Need at least 3 bottles with price and rating data" />
              )}
            </ChartCard>

            <Divider label="Loyalty" />

            <Section title="Distillery Loyalty" description="Your top distilleries by bottle count">
              <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden">
                {analytics.distilleryLoyalty.length > 0 ? (
                  <DataTable
                    columns={[
                      { key: "distillery", label: "Distillery" },
                      { key: "count", label: "Bottles" },
                      { key: "avgRating", label: "Avg Rating", hide: "hidden sm:table-cell" },
                      { key: "totalSpend", label: "Total Spent", hide: "hidden md:table-cell" },
                      { key: "avgPrice", label: "Avg Price", hide: "hidden lg:table-cell" },
                    ]}
                    rows={analytics.distilleryLoyalty.map((row) => ({
                      distillery: row.distillery,
                      count: row.count,
                      avgRating: row.avgRating > 0 ? row.avgRating.toFixed(1) : "—",
                      totalSpend: row.totalSpend > 0 ? `$${row.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—",
                      avgPrice: row.avgPrice > 0 ? `$${row.avgPrice.toFixed(0)}` : "—",
                    }))}
                  />
                ) : (
                  <EmptyState message="Add distillery info to your bottles to see loyalty data" />
                )}
              </div>
            </Section>
          </TabsContent>

          {/* ══════════ TAB 2: PALATE ══════════ */}
          <TabsContent value="palate" className="space-y-0">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Flavor Radar */}
              <ChartCard title="Flavor Profile" description="Average flavor ratings across your reviews" height={280}>
                {analytics.flavorRadar ? (
                  <div className="flex items-center justify-center h-full">
                    <RadarChart flavorProfile={analytics.flavorRadar} size={230} />
                  </div>
                ) : (
                  <EmptyState message="Review at least 3 bottles with flavor profiles" icon={Droplets} />
                )}
              </ChartCard>

              {/* Scoring Tendencies */}
              <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden">
                <div className="px-5 pt-5 pb-2">
                  <h3 className="font-display text-base text-foreground">Scoring Tendencies</h3>
                  <p className="text-xs text-muted-foreground/40 mt-0.5">How you score across the 6 review components</p>
                </div>
                <div className="px-4 pb-4">
                  {scoringTendencies && scoringTendencies.averageOverall !== null ? (
                    <div>
                      {/* Tendency badge + overall */}
                      <div className="flex items-center gap-3 mb-5 px-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${
                            scoringTendencies.tendency === "generous"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : scoringTendencies.tendency === "critical"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
                          {scoringTendencies.tendency}
                        </span>
                        <span className="text-xs text-muted-foreground/50">
                          Avg <span className="font-display text-base font-bold text-foreground ml-1">{scoringTendencies.averageOverall.toFixed(1)}</span>
                        </span>
                      </div>

                      {/* Inline bar breakdown */}
                      <div className="space-y-3 px-1">
                        {[
                          { label: "Nose", value: scoringTendencies.averageNose },
                          { label: "Mouthfeel", value: scoringTendencies.averageMouthfeel },
                          { label: "Taste", value: scoringTendencies.averageTaste },
                          { label: "Finish", value: scoringTendencies.averageFinish },
                          { label: "Value", value: scoringTendencies.averageValue },
                        ]
                          .filter((d) => d.value !== null)
                          .map((d) => (
                            <div key={d.label} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground/60 w-16 shrink-0">{d.label}</span>
                              <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary/60 rounded-full transition-all duration-500"
                                  style={{ width: `${((d.value || 0) / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-foreground/70 tabular-nums w-6 text-right">
                                {d.value?.toFixed(1)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState message="Write some reviews to see your scoring tendencies" icon={Target} />
                  )}
                </div>
              </div>
            </div>

            <Divider label="Top Flavors" />

            {/* Top Flavors — side by side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["nose", "taste", "finish"] as const).map((category) => {
                const flavors = palateProfile?.topFlavors?.[category]?.slice(0, 8) || [];
                return (
                  <ChartCard
                    key={category}
                    title={`${category.charAt(0).toUpperCase() + category.slice(1)}`}
                    description={`Most noted ${category} flavors`}
                    height={300}
                  >
                    {flavors.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={flavors.map((f) => ({ name: f.flavor, count: f.count }))}
                          margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                          <XAxis type="number" tick={AXIS_STYLE_LG} />
                          <YAxis type="category" dataKey="name" tick={AXIS_STYLE} width={75} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar
                            dataKey="count"
                            fill={category === "nose" ? CHART_COLORS[0] : category === "taste" ? CHART_COLORS[2] : CHART_COLORS[4]}
                            radius={[0, 3, 3, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message={`No ${category} flavor data yet`} />
                    )}
                  </ChartCard>
                );
              })}
            </div>
          </TabsContent>

          {/* ══════════ TAB 3: DEEP DIVE ══════════ */}
          <TabsContent value="deep-dive" className="space-y-0">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ChartCard title="Age vs Rating" description="Does older whiskey taste better?">
                {analytics.ageRating.length >= 3 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis type="number" dataKey="x" name="Age" tick={AXIS_STYLE_LG} tickFormatter={(v) => `${v}yr`} />
                      <YAxis type="number" dataKey="y" name="Rating" tick={AXIS_STYLE_LG} domain={[0, 5]} />
                      <ZAxis range={[50, 50]} />
                      <Tooltip content={<ScatterTooltip />} />
                      <Scatter data={analytics.ageRating} fill={CHART_COLORS[1]} />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Add age statements to see correlations" />
                )}
              </ChartCard>

              <ChartCard title="ABV Sweet Spot" description="Average rating by proof range" height={280}>
                {analytics.abvSweetSpot.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.abvSweetSpot} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="name" tick={AXIS_STYLE} />
                      <YAxis tick={AXIS_STYLE_LG} domain={[0, 5]} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="avgRating" name="Avg Rating" fill={CHART_COLORS[3]} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Add proof/ABV data to your bottles" />
                )}
              </ChartCard>
            </div>

            <Divider label="Production" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <ChartCard title="Mash Bill" description="Avg rating by mash bill type" height={250}>
                {analytics.mashBillPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.mashBillPerformance} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="name" tick={AXIS_STYLE} interval={0} angle={-35} textAnchor="end" height={55} />
                      <YAxis tick={AXIS_STYLE_LG} domain={[0, 5]} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="avgRating" name="Avg Rating" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Add mash bill info to see performance" />
                )}
              </ChartCard>

              <ChartCard title="Bottle Type" description="Single barrel vs small batch vs..." height={250}>
                {analytics.bottleTypeAnalysis.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.bottleTypeAnalysis} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="name" tick={AXIS_STYLE} interval={0} angle={-35} textAnchor="end" height={55} />
                      <YAxis tick={AXIS_STYLE_LG} domain={[0, 5]} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="avgRating" name="Avg Rating" fill={CHART_COLORS[2]} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Add bottle type info to your bottles" />
                )}
              </ChartCard>

              <ChartCard title="Cask Finish" description="How finish affects your ratings" height={250}>
                {analytics.caskFinishImpact.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.caskFinishImpact} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="name" tick={AXIS_STYLE} interval={0} angle={-35} textAnchor="end" height={55} />
                      <YAxis tick={AXIS_STYLE_LG} domain={[0, 5]} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="avgRating" name="Avg Rating" fill={CHART_COLORS[4]} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Add cask finish info to see the impact" />
                )}
              </ChartCard>
            </div>

            <Divider />

            {/* Bottom: counts + purchase locations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Collection counts */}
              <div className="grid grid-cols-2 gap-px rounded-xl overflow-hidden border border-border/30 bg-border/30 h-fit">
                <div className="bg-card/50 py-5 text-center">
                  <Wine className="h-4 w-4 text-primary/40 mx-auto mb-2" />
                  <p className="font-display text-2xl font-bold text-foreground tabular-nums">{analytics.ownedCount}</p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 font-medium mt-0.5">Owned</p>
                </div>
                <div className="bg-card/50 py-5 text-center">
                  <Bookmark className="h-4 w-4 text-primary/40 mx-auto mb-2" />
                  <p className="font-display text-2xl font-bold text-foreground tabular-nums">{analytics.wishlistCount}</p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 font-medium mt-0.5">Wishlist</p>
                </div>
              </div>

              {/* Purchase Locations */}
              <div className="lg:col-span-2">
                <Section title="Purchase Locations" description="Where you buy your bottles">
                  <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden">
                    {analytics.purchaseLocations.length > 0 ? (
                      <DataTable
                        columns={[
                          { key: "location", label: "Location" },
                          { key: "count", label: "Bottles" },
                          { key: "avgPrice", label: "Avg Price", hide: "hidden sm:table-cell" },
                          { key: "totalSpend", label: "Total Spent", hide: "hidden md:table-cell" },
                        ]}
                        rows={analytics.purchaseLocations.map((row) => ({
                          location: row.location,
                          count: row.count,
                          avgPrice: row.avgPrice > 0 ? `$${row.avgPrice.toFixed(0)}` : "—",
                          totalSpend: row.totalSpend > 0 ? `$${row.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—",
                        }))}
                      />
                    ) : (
                      <EmptyState message="Add purchase locations to your bottles" icon={ShoppingBag} />
                    )}
                  </div>
                </Section>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
