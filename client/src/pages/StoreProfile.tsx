import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Store,
  MapPin,
  Phone,
  Globe,
  Clock,
  Instagram,
  Users,
  Package,
  Eye,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Loader2,
  BarChart3,
  Flag,
  Edit,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { StoreDropCard } from '@/components/drops/StoreDropCard';

interface StoreProfileData {
  id: number;
  name: string;
  address: string | null;
  instagramHandle: string | null;
  latitude: string | null;
  longitude: string | null;
  isVerified: boolean;
  submittedBy: number | null;
  claimedBy: number | null;
  claimedAt: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  coverImage: string | null;
  logoImage: string | null;
  createdAt: string;
  followerCount: number;
  dropCount: number;
  recentDrops: any[];
  claimedByUser: { id: number; username: string } | null;
}

const StoreProfile = () => {
  const params = useParams();
  const storeId = parseInt(params.id as string);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimRole, setClaimRole] = useState('');
  const [claimNote, setClaimNote] = useState('');

  const { data: profile, isLoading, error } = useQuery<StoreProfileData>({
    queryKey: ['store-profile', storeId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/stores/${storeId}/profile`);
      return res.json();
    },
    enabled: !isNaN(storeId),
  });

  const { data: isFollowing } = useQuery<boolean>({
    queryKey: ['store-following', storeId],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/followed-stores');
      const stores = await res.json();
      return stores.some((s: any) => s.id === storeId);
    },
    enabled: !!user,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest('DELETE', `/api/stores/${storeId}/follow`);
      } else {
        await apiRequest('POST', `/api/stores/${storeId}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-following', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-profile', storeId] });
      queryClient.invalidateQueries({ queryKey: ['followed-stores'] });
      toast({
        title: isFollowing ? 'Unfollowed' : 'Following!',
        description: isFollowing ? `You unfollowed ${profile?.name}` : `You're now following ${profile?.name}`,
      });
    },
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/stores/${storeId}/claim`, {
        businessRole: claimRole,
        verificationNote: claimNote,
      });
    },
    onSuccess: () => {
      setShowClaimModal(false);
      setClaimRole('');
      setClaimNote('');
      toast({
        title: 'Claim Submitted',
        description: 'Your claim has been submitted for review. We\'ll notify you once it\'s processed.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to submit claim',
        variant: 'destructive',
      });
    },
  });

  const isOwner = user && profile && profile.claimedBy === user.id;

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

  if (error || !profile) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0A0A0A]">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="bg-[#1A1A1A] border-[#2A2A2A] max-w-md w-full">
            <CardContent className="p-6 text-center">
              <Store className="h-12 w-12 text-[#666] mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-white mb-1">Store Not Found</h2>
              <p className="text-[#999] text-sm">This store doesn't exist or has been removed.</p>
              <Button onClick={() => navigate('/drops')} className="mt-4 bg-[#D4A44C] text-black hover:bg-[#C49A42]">
                Back to Drops
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A]">
      <Header />
      <main className="flex-1 pb-24">
        {/* Back button */}
        <div className="px-4 py-2">
          <button onClick={() => navigate('/drops')} className="flex items-center text-[#999] hover:text-white text-sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Drops
          </button>
        </div>

        {/* Cover Image */}
        <div className="relative h-40 bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] overflow-hidden">
          {profile.coverImage ? (
            <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store className="h-16 w-16 text-[#333]" />
            </div>
          )}
          {/* Logo overlay */}
          <div className="absolute -bottom-8 left-4">
            <div className="w-16 h-16 rounded-xl bg-[#1A1A1A] border-2 border-[#2A2A2A] flex items-center justify-center overflow-hidden">
              {profile.logoImage ? (
                <img src={profile.logoImage} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="h-8 w-8 text-[#D4A44C]" />
              )}
            </div>
          </div>
        </div>

        {/* Store Info */}
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white font-['Playfair_Display']">{profile.name}</h1>
                {profile.isVerified && (
                  <ShieldCheck className="h-5 w-5 text-[#D4A44C]" />
                )}
              </div>
              {profile.address && (
                <p className="text-[#999] text-sm flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {profile.address}
                </p>
              )}
            </div>
            {user && (
              <Button
                size="sm"
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={cn(
                  'rounded-full text-xs px-4',
                  isFollowing
                    ? 'bg-[#2A2A2A] text-white hover:bg-[#333] border border-[#444]'
                    : 'bg-[#D4A44C] text-black hover:bg-[#C49A42]'
                )}
              >
                {followMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isFollowing ? (
                  <><UserMinus className="h-3 w-3 mr-1" /> Following</>
                ) : (
                  <><UserPlus className="h-3 w-3 mr-1" /> Follow</>
                )}
              </Button>
            )}
          </div>

          {/* Description */}
          {profile.description && (
            <p className="text-[#CCC] text-sm mt-3">{profile.description}</p>
          )}

          {/* Stats Row */}
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-white font-bold">{profile.followerCount}</p>
              <p className="text-[#999] text-xs">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold">{profile.dropCount}</p>
              <p className="text-[#999] text-xs">Drops</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-3 mt-4">
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-1 text-[#D4A44C] text-sm hover:underline">
                <Phone className="h-3 w-3" /> {profile.phone}
              </a>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#D4A44C] text-sm hover:underline">
                <Globe className="h-3 w-3" /> Website
              </a>
            )}
            {profile.instagramHandle && (
              <a href={`https://instagram.com/${profile.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#D4A44C] text-sm hover:underline">
                <Instagram className="h-3 w-3" /> @{profile.instagramHandle}
              </a>
            )}
          </div>

          {/* Hours */}
          {profile.hours && (
            <div className="mt-3 flex items-start gap-1 text-[#999] text-sm">
              <Clock className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{profile.hours}</span>
            </div>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/store/${storeId}/edit`)}
                className="border-[#D4A44C] text-[#D4A44C] hover:bg-[#D4A44C] hover:text-black"
              >
                <Edit className="h-3 w-3 mr-1" /> Edit Profile
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/store/${storeId}/analytics`)}
                className="border-[#444] text-[#999] hover:bg-[#2A2A2A]"
              >
                <BarChart3 className="h-3 w-3 mr-1" /> Analytics
              </Button>
            </div>
          )}

          {/* Claim Button (only for unclaimed stores) */}
          {user && !profile.claimedBy && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowClaimModal(true)}
              className="mt-4 border-[#444] text-[#999] hover:bg-[#2A2A2A]"
            >
              <Flag className="h-3 w-3 mr-1" /> Claim This Store
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="drops" className="px-4">
          <TabsList className="bg-[#1A1A1A] border border-[#2A2A2A] w-full">
            <TabsTrigger value="drops" className="flex-1 text-xs data-[state=active]:bg-[#D4A44C] data-[state=active]:text-black">
              Drops ({profile.recentDrops.length})
            </TabsTrigger>
            <TabsTrigger value="about" className="flex-1 text-xs data-[state=active]:bg-[#D4A44C] data-[state=active]:text-black">
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drops" className="mt-4 space-y-3">
            {profile.recentDrops.length === 0 ? (
              <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
                <CardContent className="p-6 text-center">
                  <Package className="h-10 w-10 text-[#444] mx-auto mb-2" />
                  <p className="text-[#999] text-sm">No drops reported yet</p>
                </CardContent>
              </Card>
            ) : (
              profile.recentDrops.map((drop: any) => (
                <StoreDropCard
                  key={drop.id}
                  drop={{ ...drop, store: profile }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-4">
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardContent className="p-4 space-y-4">
                {profile.description && (
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">About</h3>
                    <p className="text-[#CCC] text-sm">{profile.description}</p>
                  </div>
                )}
                {profile.hours && (
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">Hours</h3>
                    <p className="text-[#CCC] text-sm whitespace-pre-line">{profile.hours}</p>
                  </div>
                )}
                {profile.address && (
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">Address</h3>
                    <p className="text-[#CCC] text-sm">{profile.address}</p>
                  </div>
                )}
                {profile.claimedByUser && (
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">Managed By</h3>
                    <Badge className="bg-[#2A2A2A] text-[#D4A44C] border-[#D4A44C]/30">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      {profile.claimedByUser.username}
                    </Badge>
                  </div>
                )}
                {!profile.description && !profile.hours && !profile.claimedByUser && (
                  <p className="text-[#999] text-sm text-center py-4">No additional information yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Claim Modal */}
        {showClaimModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-[#1A1A1A] w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-1">Claim {profile.name}</h2>
              <p className="text-[#999] text-sm mb-4">
                Verify that you own or manage this store to update its profile and view analytics.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[#999] text-xs block mb-1">Your Role</label>
                  <select
                    value={claimRole}
                    onChange={(e) => setClaimRole(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white text-sm p-2"
                  >
                    <option value="">Select your role...</option>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#999] text-xs block mb-1">Verification Note</label>
                  <textarea
                    value={claimNote}
                    onChange={(e) => setClaimNote(e.target.value)}
                    placeholder="How can we verify you're associated with this store?"
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white text-sm p-2 h-20 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 border-[#444] text-[#999]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => claimMutation.mutate()}
                  disabled={!claimRole || claimMutation.isPending}
                  className="flex-1 bg-[#D4A44C] text-black hover:bg-[#C49A42]"
                >
                  {claimMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Claim'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StoreProfile;
