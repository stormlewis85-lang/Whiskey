import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Store,
  ChevronLeft,
  Loader2,
  Camera,
  Save,
} from 'lucide-react';

const StoreEdit = () => {
  const params = useParams();
  const storeId = parseInt(params.id as string);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [hours, setHours] = useState('');
  const [address, setAddress] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['store-profile', storeId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/stores/${storeId}/profile`);
      return res.json();
    },
    enabled: !isNaN(storeId),
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setDescription(profile.description || '');
      setPhone(profile.phone || '');
      setWebsite(profile.website || '');
      setHours(profile.hours || '');
      setAddress(profile.address || '');
      setInstagramHandle(profile.instagramHandle || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', `/api/stores/${storeId}/profile`, {
        name: name || undefined,
        description: description || undefined,
        phone: phone || undefined,
        website: website || undefined,
        hours: hours || undefined,
        address: address || undefined,
        instagramHandle: instagramHandle || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-profile', storeId] });
      toast({ title: 'Profile Updated', description: 'Store profile has been saved.' });
      navigate(`/store/${storeId}`);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update store profile.', variant: 'destructive' });
    },
  });

  const uploadImage = async (file: File, type: 'cover' | 'logo') => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      await apiRequest('POST', `/api/stores/${storeId}/${type}-image`, formData);
      queryClient.invalidateQueries({ queryKey: ['store-profile', storeId] });
      toast({ title: 'Image Uploaded', description: `${type === 'cover' ? 'Cover' : 'Logo'} image updated.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to upload image.', variant: 'destructive' });
    }
  };

  // Redirect if not owner
  if (!isLoading && profile && user && profile.claimedBy !== user.id && user.id !== 1) {
    navigate(`/store/${storeId}`);
    return null;
  }

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

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A]">
      <Header />
      <main className="flex-1 pb-24 px-4">
        {/* Back button */}
        <div className="py-2">
          <button onClick={() => navigate(`/store/${storeId}`)} className="flex items-center text-[#999] hover:text-white text-sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Store
          </button>
        </div>

        <h1 className="text-xl font-bold text-white font-['Playfair_Display'] mb-4">Edit Store Profile</h1>

        {/* Cover Image Upload */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] mb-4">
          <CardContent className="p-4">
            <label className="text-[#999] text-xs block mb-2">Cover Image</label>
            <div className="relative h-32 bg-[#0A0A0A] rounded-lg overflow-hidden mb-2">
              {profile?.coverImage ? (
                <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#444]">
                  <Camera className="h-8 w-8" />
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'cover')}
              className="text-xs text-[#999]"
            />
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] mb-4">
          <CardContent className="p-4">
            <label className="text-[#999] text-xs block mb-2">Logo</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-[#0A0A0A] border border-[#2A2A2A] flex items-center justify-center overflow-hidden">
                {profile?.logoImage ? (
                  <img src={profile.logoImage} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="h-6 w-6 text-[#444]" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')}
                className="text-xs text-[#999]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Fields */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] mb-4">
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="text-[#999] text-xs block mb-1">Store Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
              />
            </div>
            <div>
              <label className="text-[#999] text-xs block mb-1">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people about your store..."
                className="bg-[#0A0A0A] border-[#2A2A2A] text-white h-20 resize-none"
              />
            </div>
            <div>
              <label className="text-[#999] text-xs block mb-1">Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
              />
            </div>
            <div>
              <label className="text-[#999] text-xs block mb-1">Phone</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
              />
            </div>
            <div>
              <label className="text-[#999] text-xs block mb-1">Website</label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
              />
            </div>
            <div>
              <label className="text-[#999] text-xs block mb-1">Instagram Handle</label>
              <Input
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="storename"
                className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
              />
            </div>
            <div>
              <label className="text-[#999] text-xs block mb-1">Hours</label>
              <Textarea
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Mon-Fri: 9am-9pm&#10;Sat: 10am-8pm&#10;Sun: 12pm-6pm"
                className="bg-[#0A0A0A] border-[#2A2A2A] text-white h-24 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="w-full bg-[#D4A44C] text-black hover:bg-[#C49A42] font-semibold"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </main>
    </div>
  );
};

export default StoreEdit;
