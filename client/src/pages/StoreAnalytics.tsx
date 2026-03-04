import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import {
  ChevronLeft,
  Loader2,
  Eye,
  Users,
  Package,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface AnalyticsData {
  totalViews: number;
  viewsByDay: { date: string; count: number }[];
  followerCount: number;
  dropCount: number;
  recentDrops: any[];
}

const StoreAnalytics = () => {
  const params = useParams();
  const storeId = parseInt(params.id as string);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [days, setDays] = useState(30);

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['store-analytics', storeId, days],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/stores/${storeId}/analytics?days=${days}`);
      return res.json();
    },
    enabled: !isNaN(storeId) && !!user,
  });

  const { data: store } = useQuery<any>({
    queryKey: ['store-profile', storeId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/stores/${storeId}/profile`);
      return res.json();
    },
    enabled: !isNaN(storeId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0A0A0A]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4A44C]" />
        </div>
      </div>
    );
  }

  // Find max view count for bar chart scaling
  const maxViews = analytics?.viewsByDay?.length
    ? Math.max(...analytics.viewsByDay.map(d => d.count), 1)
    : 1;

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A]">
      <Header />
      <main className="flex-1 pb-24 px-4">
        <div className="py-2">
          <button onClick={() => navigate(`/store/${storeId}`)} className="flex items-center text-[#999] hover:text-white text-sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Store
          </button>
        </div>

        <h1 className="text-xl font-bold text-white font-['Playfair_Display'] mb-1">
          {store?.name || 'Store'} Analytics
        </h1>
        <p className="text-[#999] text-sm mb-4">Last {days} days</p>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-4">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              onClick={() => setDays(d)}
              className={days === d
                ? 'bg-[#D4A44C] text-black hover:bg-[#C49A42]'
                : 'bg-[#1A1A1A] text-[#999] border border-[#2A2A2A] hover:bg-[#2A2A2A]'
              }
            >
              {d}d
            </Button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardContent className="p-3 text-center">
              <Eye className="h-5 w-5 text-[#D4A44C] mx-auto mb-1" />
              <p className="text-white font-bold text-lg">{analytics?.totalViews || 0}</p>
              <p className="text-[#999] text-xs">Views</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 text-[#D4A44C] mx-auto mb-1" />
              <p className="text-white font-bold text-lg">{analytics?.followerCount || 0}</p>
              <p className="text-[#999] text-xs">Followers</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardContent className="p-3 text-center">
              <Package className="h-5 w-5 text-[#D4A44C] mx-auto mb-1" />
              <p className="text-white font-bold text-lg">{analytics?.dropCount || 0}</p>
              <p className="text-[#999] text-xs">Drops</p>
            </CardContent>
          </Card>
        </div>

        {/* Views Chart (simple bar chart) */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] mb-4">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-[#D4A44C]" />
              Views Over Time
            </h3>
            {analytics?.viewsByDay && analytics.viewsByDay.length > 0 ? (
              <div className="flex items-end gap-1 h-32">
                {analytics.viewsByDay.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full bg-[#D4A44C]/80 rounded-t min-h-[2px]"
                      style={{ height: `${(day.count / maxViews) * 100}%` }}
                      title={`${day.date}: ${day.count} views`}
                    />
                    {analytics.viewsByDay.length <= 14 && (
                      <span className="text-[#666] text-[9px] mt-1 rotate-45 origin-left">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-[#666] text-sm">No view data for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Drops */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-1">
              <Calendar className="h-4 w-4 text-[#D4A44C]" />
              Recent Drops
            </h3>
            {analytics?.recentDrops && analytics.recentDrops.length > 0 ? (
              <div className="space-y-2">
                {analytics.recentDrops.map((drop: any) => (
                  <div key={drop.id} className="flex items-center justify-between py-2 border-b border-[#2A2A2A] last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{drop.whiskeyName}</p>
                      <p className="text-[#999] text-xs">
                        {new Date(drop.droppedAt).toLocaleDateString()}
                        {drop.price && ` · $${drop.price}`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      drop.status === 'active' ? 'bg-green-900/30 text-green-400' :
                      drop.status === 'sold_out' ? 'bg-red-900/30 text-red-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {drop.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#666] text-sm text-center py-4">No drops in this period</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StoreAnalytics;
