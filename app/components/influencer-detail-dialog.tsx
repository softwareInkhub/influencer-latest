import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Instagram, Youtube, Mail, Phone, MapPin, Calendar, Users, Eye, Edit, Save, X, Globe, Facebook } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import type { Influencer } from "../../shared/schema";

interface InfluencerDetailDialogProps {
  influencer: Influencer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusClasses = (status?: string) => {
  const normalized = (status || "").toString().toLowerCase();
  // Map various backend statuses to visual categories per spec
  const isApproved = normalized === "approved" || normalized === "active" || normalized === "ordercreated" || normalized === "completed";
  const isPending = normalized === "pending" || normalized === "pendingapproval" || normalized === "pendingvideoupload";
  const isRejected = normalized === "rejected";
  const isArchived = normalized === "archived";
  if (isApproved) return "bg-green-100 text-green-800 border-green-200";
  if (isRejected) return "bg-red-100 text-red-800 border-red-200";
  if (isArchived) return "bg-gray-300 text-gray-800 border-gray-400";
  if (isPending) return "bg-gray-100 text-gray-800 border-gray-200";
  // fallback
  return "bg-gray-100 text-gray-800 border-gray-200";
};

export default function InfluencerDetailDialog({ influencer, open, onOpenChange }: InfluencerDetailDialogProps) {
  const { updateInfluencer } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [detail, setDetail] = useState<Influencer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    instagramHandle: '',
    instagramFollowers: '',
    youtubeChannel: '',
    youtubeSubscribers: '',
    status: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Remove authentication checks - assume admin access for now
  const isAdmin = true;
  const headers: Record<string, string> = {};

  useEffect(() => {
    if (!open || !influencer?.id) return;
    let cancelled = false;
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const token = localStorage.getItem('auth_token') || '';
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        // Primary BRMH endpoint per spec
        const primaryUrl = `/influencer/${influencer.id}`;
        const altUrl = `/api/influencers/${influencer.id}`; // local/dev fallback

        // helper to fetch JSON
        const fetchJson = async (url: string) => {
          const r = await fetch(url, { headers });
          if (r.status === 404) return { notFound: true } as any;
          if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
          return await r.json();
        };

        let payload: any;
        try {
          payload = await fetchJson(primaryUrl);
          if ((payload as any)?.notFound) throw new Error('404');
        } catch (e) {
          // fallback to local API
          const r = await fetch(altUrl, { headers });
          if (r.status === 404) {
            if (!cancelled) { setNotFound(true); setDetail(null); }
            return;
          }
          if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
          payload = await r.json();
        }

        // If API is split (user/profile), try to merge
        try {
          const [userResp, profileResp] = await Promise.all([
            fetch(`/user/${influencer.id}`, { headers }).catch(() => null),
            fetch(`/profile/${influencer.id}`, { headers }).catch(() => null),
          ]);
          if (userResp && userResp.ok) {
            const u = await userResp.json();
            payload = { ...u, ...payload };
          }
          if (profileResp && profileResp.ok) {
            const p = await profileResp.json();
            payload = { ...payload, ...p };
          }
        } catch {}

        // Normalize fields to UI shape
        const normalized: any = {
          id: payload.id || payload.influencer_id || influencer.id,
          name: payload.name || payload.full_name || influencer.name,
          email: payload.email || influencer.email,
          phone: payload.phone || influencer.phone,
          address: payload.address ?? influencer.address,
          status: payload.status || influencer.status,
          createdAt: payload.created_at || payload.createdAt || influencer.createdAt,
          updatedAt: payload.updated_at || payload.updatedAt || influencer.updatedAt,
          dob: payload.dob || (payload.profile && payload.profile.dob),
          socialMedia: (() => {
            const socials = payload.socials || payload.socialMedia || {};
            const instagram = socials.instagram ? {
              handle: typeof socials.instagram === 'string' ? socials.instagram : socials.instagram.handle,
              followers: typeof socials.instagram === 'object' ? socials.instagram.followers : undefined,
            } : undefined;
            const youtube = socials.youtube ? {
              channel: typeof socials.youtube === 'string' ? socials.youtube : socials.youtube.channel,
              subscribers: typeof socials.youtube === 'object' ? socials.youtube.subscribers : undefined,
            } : undefined;
            const facebook = socials.facebook ? { url: socials.facebook } : undefined;
            const tiktok = socials.tiktok ? { handle: socials.tiktok } : undefined;
            const website = socials.website ? { url: socials.website } : undefined;
            return { instagram, youtube, facebook, tiktok, website };
          })(),
        };

        if (!cancelled) setDetail(normalized);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [open, influencer?.id]);

  if (!influencer) return null;

  // Initialize form when influencer changes or editing starts
  const initializeForm = () => {
    setEditForm({
      name: influencer.name || '',
      email: influencer.email || '',
      phone: influencer.phone || '',
      age: influencer.age?.toString() || '',
      gender: influencer.gender || '',
      address: influencer.address || '',
      instagramHandle: influencer.socialMedia?.instagram?.handle || '',
      instagramFollowers: influencer.socialMedia?.instagram?.followers?.toString() || '',
      youtubeChannel: influencer.socialMedia?.youtube?.channel || '',
      youtubeSubscribers: influencer.socialMedia?.youtube?.subscribers?.toString() || '',
      status: influencer.status || ''
    });
  };

  const handleEdit = () => {
    initializeForm();
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: '',
      email: '',
      phone: '',
      age: '',
      gender: '',
      address: '',
      instagramHandle: '',
      instagramFollowers: '',
      youtubeChannel: '',
      youtubeSubscribers: '',
      status: ''
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        age: editForm.age ? parseInt(editForm.age) : influencer.age,
        gender: editForm.gender,
        address: editForm.address,
        socialMedia: {
          instagram: editForm.instagramHandle ? {
            handle: editForm.instagramHandle,
            followers: editForm.instagramFollowers ? parseInt(editForm.instagramFollowers) : 0
          } : influencer.socialMedia?.instagram,
          youtube: editForm.youtubeChannel ? {
            channel: editForm.youtubeChannel,
            subscribers: editForm.youtubeSubscribers ? parseInt(editForm.youtubeSubscribers) : 0
          } : influencer.socialMedia?.youtube,
          facebook: influencer.socialMedia?.facebook
        },
        status: editForm.status,
        updatedAt: new Date()
      };

      await updateInfluencer(influencer.id, updatedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update influencer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name || typeof name !== 'string') return '??';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase();
  };

  const formatDDMMYYYY = (input?: string | Date | null) => {
    if (!input) return '—';
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const computeAge = (dob?: string) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  };

  const current = detail || influencer;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl rounded-lg" hideCloseButton>
        <DialogHeader className="relative pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">Influencer Details</DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Profile Header */}
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">
                {getInitials(isEditing ? editForm.name : current.name)}
              </span>
            </div>
            <div className="flex-1">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-6 bg-gray-100 rounded w-48" />
                  <div className="h-5 bg-gray-100 rounded w-32" />
                </div>
              ) : notFound ? (
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-900">Influencer not found</h3>
                </div>
              ) : isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="age" className="text-sm font-medium text-gray-700">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={editForm.age}
                        onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</Label>
                      <Select value={editForm.gender} onValueChange={(value) => setEditForm({...editForm, gender: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                    <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PendingApproval">Pending Approval</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="OrderCreated">Order Created</SelectItem>
                        <SelectItem value="PendingVideoUpload">Pending Video Upload</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-900" data-testid="infl-name">{current.name || '—'}</h3>
                  <Badge className="mt-2 bg-green-100 text-green-800 border-green-200" data-testid="infl-status">
                    {current.status || 'OrderCreated'}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {error && !isLoading && !notFound && (
            <div className="text-sm text-red-600">
              {error}
              <Button variant="outline" size="sm" className="ml-2" onClick={() => {
                onOpenChange(false);
                setTimeout(() => onOpenChange(true), 0);
              }}>Retry</Button>
            </div>
          )}

          {/* Contact Information */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-48" />
                  <div className="h-4 bg-gray-100 rounded w-40" />
                  <div className="h-4 bg-gray-100 rounded w-56" />
                </div>
              ) : isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
                    <Input
                      id="address"
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : notFound ? (
                <div className="text-sm text-gray-500">—</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700" data-testid="infl-email">{current.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700" data-testid="infl-phone">{current.phone || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-700" data-testid="infl-location">{(() => {
                      const addr = (current as any).address;
                      if (!addr) return 'No address provided';
                      if (typeof addr === 'string') return addr || 'No address provided';
                      const parts = [addr.city, addr.state, addr.country, addr.pin].filter((v: any) => !!v && String(v).trim() !== '');
                      return parts.length ? parts.join(', ') : 'No address provided';
                    })()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Social Media</h4>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-10 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded" />
                </div>
              ) : isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Instagram</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          placeholder="@handle"
                          value={editForm.instagramHandle}
                          onChange={(e) => setEditForm({...editForm, instagramHandle: e.target.value})}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Followers"
                          value={editForm.instagramFollowers}
                          onChange={(e) => setEditForm({...editForm, instagramFollowers: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">YouTube</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          placeholder="Enter YouTube channel name"
                          value={editForm.youtubeChannel}
                          onChange={(e) => setEditForm({...editForm, youtubeChannel: e.target.value})}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Enter subscriber count"
                          value={editForm.youtubeSubscribers}
                          onChange={(e) => setEditForm({...editForm, youtubeSubscribers: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : notFound ? (
                <p className="text-sm text-gray-500 text-center py-4" data-testid="infl-socials">No social media accounts added</p>
              ) : (
                <div className="space-y-3" data-testid="infl-socials">
                  {current.socialMedia?.instagram && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Instagram className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{current.socialMedia.instagram.handle || 'No handle'}</p>
                          <p className="text-xs text-gray-500">Instagram</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {current.socialMedia.instagram.followers ? 
                            (current.socialMedia.instagram.followers >= 1000000 ? 
                              `${(current.socialMedia.instagram.followers / 1000000).toFixed(1)}M` :
                              current.socialMedia.instagram.followers >= 1000 ? 
                                `${(current.socialMedia.instagram.followers / 1000).toFixed(1)}K` :
                                current.socialMedia.instagram.followers.toString()
                            ) : '0'
                          }
                        </p>
                        <p className="text-xs text-gray-500">followers</p>
                      </div>
                    </div>
                  )}
                  
                  {current.socialMedia?.youtube && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <Youtube className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{current.socialMedia.youtube.channel || 'No channel'}</p>
                          <p className="text-xs text-gray-500">YouTube</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {current.socialMedia.youtube.subscribers ? 
                            (current.socialMedia.youtube.subscribers >= 1000000 ? 
                              `${(current.socialMedia.youtube.subscribers / 1000000).toFixed(1)}M` :
                              current.socialMedia.youtube.subscribers >= 1000 ? 
                                `${(current.socialMedia.youtube.subscribers / 1000).toFixed(1)}K` :
                                current.socialMedia.youtube.subscribers.toString()
                            ) : '0'
                          }
                        </p>
                        <p className="text-xs text-gray-500">subscribers</p>
                      </div>
                    </div>
                  )}
                  
                  {(!current.socialMedia?.instagram && !current.socialMedia?.youtube) && (
                    <p className="text-sm text-gray-500 text-center py-4">No social media accounts added</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Account Information</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Joined</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-900" data-testid="infl-joined">
                      {current.createdAt ? new Date(current.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900" data-testid="infl-updated">
                    {current.updatedAt ? new Date(current.updatedAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ID</span>
                  <span className="text-xs font-mono text-gray-500" data-testid="infl-id">{current.id || 'Unknown'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center pt-4">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1 mr-2" 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  className="flex-1 ml-2" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg px-6 py-2 font-medium" 
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}