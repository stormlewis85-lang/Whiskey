import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Whiskey, ReviewNote } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

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
      const roundedScore = Math.round(review.rating * 2) / 2; // Round to nearest 0.5
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
      .sort((a, b) => b.value - a.value); // Sort by count descending
    
    // Region distribution
    const regionMap = new Map<string, number>();
    whiskeys.forEach(whiskey => {
      const region = whiskey.region || 'Unknown';
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
    });
    
    const regionDistribution = Array.from(regionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort by count descending
    
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
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading collection data</p>
      </div>
    );
  }
  
  if (!whiskeys || whiskeys.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <p className="text-muted-foreground">Your collection is empty. Add some whiskeys to see analytics.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-serif font-bold text-[#7d5936]">Collection Dashboard</h2>
          <Link href="/">
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Back to Collection
              </span>
            </Button>
          </Link>
        </div>
        <div className="text-sm text-muted-foreground">
          {whiskeys.length} whiskeys in collection
        </div>
      </div>
      
      <Separator className="mb-6 bg-[#E8D9BD]" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-md border-[#E8D9BD]">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-[#7d5936]">Collection by Type</CardTitle>
            <CardDescription>Distribution of whiskey types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} whiskeys`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-[#E8D9BD]">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-[#7d5936]">Collection by Region</CardTitle>
            <CardDescription>Distribution of whiskey regions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {regionDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} whiskeys`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-[#E8D9BD]">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-[#7d5936]">Price Distribution</CardTitle>
            <CardDescription>Whiskeys by price range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priceDistribution}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value} whiskeys`, 'Count']} />
                  <Bar dataKey="value" fill="#b68c60" name="Whiskeys" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-md border-[#E8D9BD]">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-[#7d5936]">Reviews Over Time</CardTitle>
            <CardDescription>Number of reviews by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reviewsByMonth}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value} reviews`, 'Count']} />
                  <Bar dataKey="count" fill="#8a634b" name="Reviews" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-[#E8D9BD]">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-[#7d5936]">Rating Distribution</CardTitle>
            <CardDescription>Number of whiskeys by rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={scoreDistribution}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value} whiskeys`, 'Count']} />
                  <Bar dataKey="value" fill="#d1a25f" name="Whiskeys" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-md border-[#E8D9BD] mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-[#7d5936]">Top Rated Whiskeys</CardTitle>
          <CardDescription>Your highest rated whiskeys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E8D9BD]">
                  <th className="py-2 px-4 text-left text-[#794e2f]">Rank</th>
                  <th className="py-2 px-4 text-left text-[#794e2f]">Name</th>
                  <th className="py-2 px-4 text-left text-[#794e2f]">Distillery</th>
                  <th className="py-2 px-4 text-left text-[#794e2f]">Type</th>
                  <th className="py-2 px-4 text-left text-[#794e2f]">Rating</th>
                </tr>
              </thead>
              <tbody>
                {topRatedWhiskeys.map((whiskey, index) => (
                  <tr key={index} className="border-b border-[#E8D9BD] hover:bg-amber-50">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{whiskey.name}</td>
                    <td className="py-3 px-4">{whiskey.distillery}</td>
                    <td className="py-3 px-4">{whiskey.type}</td>
                    <td className="py-3 px-4 font-bold text-amber-700">{whiskey.rating.toFixed(1)}</td>
                  </tr>
                ))}
                {topRatedWhiskeys.length === 0 && (
                  <tr>
                    <td className="py-3 px-4 text-center text-muted-foreground" colSpan={5}>
                      No rated whiskeys yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md border-[#E8D9BD]">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-[#7d5936]">Collection Stats</CardTitle>
          <CardDescription>Interesting statistics about your collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total Whiskeys</p>
              <p className="text-2xl font-bold text-amber-800">{whiskeys.length}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Reviews Written</p>
              <p className="text-2xl font-bold text-amber-800">
                {whiskeys.reduce((total, w) => {
                  const notesCount = Array.isArray(w.notes) ? w.notes.length : 0;
                  return total + notesCount;
                }, 0)}
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold text-amber-800">
                {whiskeys.filter(w => w.rating !== null && w.rating > 0).length > 0
                  ? (whiskeys.reduce((sum, w) => sum + (w.rating || 0), 0) / 
                     whiskeys.filter(w => w.rating !== null && w.rating > 0).length).toFixed(1)
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Collection Value</p>
              <p className="text-2xl font-bold text-amber-800">
                ${whiskeys.reduce((total, w) => total + (w.price || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}