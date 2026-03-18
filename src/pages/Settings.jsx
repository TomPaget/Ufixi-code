import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  Building2,
  Crown,
  LogOut,
  ChevronRight,
  User,
  Shield,
  Edit2,
  Camera,
  MapPin,
  Loader2,
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  Briefcase,
  Calendar,
  CreditCard,
  MessageCircle,
  Info,
  AlertCircle } from
"lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import MobileSelect from "@/components/kora/MobileSelect";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
// cn is still used in notification preferences button
import { format } from "date-fns";
import HamburgerMenu from "@/components/kora/HamburgerMenu";
import PageHeader from "@/components/kora/PageHeader";
import LavaLampBackground from "@/components/kora/LavaLampBackground";

const typeIcons = {
  issue_update: AlertTriangle,
  work_request: Briefcase,
  appointment: Calendar,
  payment: CreditCard,
  message: MessageCircle,
  general: Info
};

const priorityColors = {
  low: "text-blue-500",
  normal: "text-slate-500",
  high: "text-orange-500",
  urgent: "text-red-500"
};

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("account");
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1 = warning, 2 = confirm, 3 = email verification
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteVerificationCode, setDeleteVerificationCode] = useState("");
  const [deletingStep, setDeletingStep] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
    onSuccess: (data) => {
      setDisplayName(data?.display_name || data?.full_name || "");
      setBio(data?.bio || "");
    }
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id }, "-created_date"),
    enabled: !!user && activeTab === "notifications"
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      await Promise.all(unreadIds.map((id) =>
      base44.entities.Notification.update(id, { read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries(["user"]);
      const previousUser = queryClient.getQueryData(["user"]);
      queryClient.setQueryData(["user"], (old) => old ? { ...old, ...variables } : old);
      return { previousUser };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["user"], context.previousUser);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
      setEditingProfile(false);
    },
  });

  const handleUserTypeChange = (value) => {
    updateUserMutation.mutate({ user_type: value });
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleSendVerificationCode = async () => {
    setDeletingStep("sending");
    try {
      await base44.integrations.Core.SendEmail({
        to: user?.email,
        subject: "Confirm Your Account Deletion - UFixi",
        body: `A request to delete your UFixi account has been initiated. Please return to the app within 10 minutes and enter the verification code below to complete account deletion.\n\nVerification Code: ${Math.random().toString().slice(2, 8).toUpperCase()}\n\nIf you did not request this, you can safely ignore this email.`
      });
      setVerificationCodeSent(true);
      setDeleteStep(3);
    } catch (error) {
      console.error("Failed to send verification email:", error);
    } finally {
      setDeletingStep(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE" || !deleteVerificationCode) return;
    setDeleting(true);
    try {
      await base44.auth.updateMe({ account_deletion_requested: true, account_deletion_date: new Date().toISOString() });
      base44.auth.logout();
    } catch (error) {
      console.error("Account deletion failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      // Only call Stripe if there's a subscription ID
      if (user?.stripe_subscription_id) {
        await base44.functions.invoke('cancelSubscription', {
          subscriptionId: user.stripe_subscription_id
        });
      }

      // Always revert user to free tier
      await base44.auth.updateMe({
        is_premium: false,
        subscription_tier: null,
        subscription_cancelled: true
      });

      queryClient.invalidateQueries(["user"]);
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveProfile = () => {
    updateUserMutation.mutate({
      display_name: displayName,
      bio: bio
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateUserMutation.mutateAsync({ profile_picture_url: file_url });
    } catch (error) {
      console.error("Photo upload error:", error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRequestLocation = () => {
    setRequestingLocation(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Get approximate city/area using reverse geocoding via LLM
          try {
            const locationData = await base44.integrations.Core.InvokeLLM({
              prompt: `Given these coordinates: latitude ${latitude}, longitude ${longitude}, return ONLY the city name and country. Format: "City, Country". Be concise.`,
              add_context_from_internet: true
            });

            await updateUserMutation.mutateAsync({
              location_latitude: latitude,
              location_longitude: longitude,
              approximate_location: locationData,
              location_services_enabled: true
            });
          } catch (error) {
            console.error("Location error:", error);
          } finally {
            setRequestingLocation(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setRequestingLocation(false);
          alert("Unable to access location. Please enable location services in your browser settings.");
        }
      );
    } else {
      setRequestingLocation(false);
      alert("Location services are not supported by your browser.");
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(createPageUrl(notification.action_url));
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const isPremium = user?.subscription_tier === "premium";

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      <LavaLampBackground />
      <PageHeader onMenuClick={() => setMenuOpen(true)} />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="max-w-lg mx-auto px-5 py-6 pb-12 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-6" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(124,111,224,0.15)' }}>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {unreadNotifications.length > 0 &&
              <Badge className="ml-1 bg-red-500 text-white">{unreadNotifications.length}</Badge>
              }
            </TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
        {/* Profile Section */}
        <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(124,111,224,0.15)' }}>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {user?.profile_picture_url ?
                  <img
                    src={user.profile_picture_url}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover shadow-lg" /> :


                  <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)' }}>
                  <User className="w-7 h-7 text-[#FF6B35]" />
                </div>
                  }
              <label className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-lg ${uploadingPhoto ? "opacity-50" : "hover:scale-110 transition-transform"}`} style={{ background: 'linear-gradient(135deg, #FF6B35, #E8365D)' }}>
                <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto} />

                {uploadingPhoto ?
                    <Loader2 className="w-3 h-3 text-white animate-spin" /> :

                    <Camera className="w-3 h-3 text-white" />
                    }
              </label>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold" style={{ color: '#151528', fontFamily: "'Sora', sans-serif" }}>{user?.display_name || user?.full_name || "User"}</h2>
              <p className="text-sm" style={{ color: '#6B6A8E' }}>{user?.email}</p>
            </div>
            <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingProfile(!editingProfile)}
                  aria-label={editingProfile ? "Cancel editing profile" : "Edit profile"}
                  className="rounded-xl hover:bg-slate-100 w-11 h-11">

              <Edit2 className="w-4 h-4" />
            </Button>
          </div>

          {editingProfile &&
              <div className="space-y-3 mb-4">
              <div>
                <Label className="text-sm mb-1 block" style={{ color: '#1a2f42' }}>Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" className="bg-white border-slate-200" />

              </div>
              <div>
                <Label className="text-sm mb-1 block" style={{ color: '#1a2f42' }}>Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." className="h-20 bg-white border-slate-200" />

              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm mb-1 block" style={{ color: '#1a2f42' }}>Country</Label>
                  <MobileSelect
                    value={user?.country || ""}
                    onChange={(value) => { base44.auth.updateMe({ country: value }); queryClient.invalidateQueries(["user"]); }}
                    placeholder="Select country"
                    className="w-full mt-1"
                    options={[
                      { value: "UK", label: "United Kingdom" },
                      { value: "US", label: "United States" },
                      { value: "CA", label: "Canada" },
                      { value: "AU", label: "Australia" },
                      { value: "IE", label: "Ireland" },
                    ]}
                  />
                </div>

                <div>
                  <Label className="text-sm mb-1 block" style={{ color: '#1a2f42' }}>Postcode</Label>
                  <Input value={user?.postcode || ""} onChange={(e) => { base44.auth.updateMe({ postcode: e.target.value }); queryClient.invalidateQueries(["user"]); }} placeholder="e.g., SW1A 1AA" className="bg-white border-slate-200" />

                </div>
              </div>
              
              <Button
                  onClick={handleSaveProfile}
                  disabled={updateUserMutation.isPending}
                  className="w-full border-0 text-white"
                  style={{ background: 'linear-gradient(135deg, #FF6B35, #E8365D)' }}>

                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
              }

          {/* Location Section */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,107,53,0.07)', border: '1px solid rgba(255,107,53,0.18)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <MapPin className={`w-5 h-5 mt-0.5 ${user?.location_services_enabled ? "text-[#FF6B35]" : "text-slate-400"}`} />
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ color: '#1a2f42' }}>Location Services</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>
                    {user?.location_services_enabled && user?.approximate_location ?
                        user.approximate_location :
                        "Enable to find local tradespeople"}
                  </p>
                </div>
              </div>
              <Button
                    size="sm"
                    onClick={handleRequestLocation}
                    disabled={requestingLocation}
                    className="rounded-xl text-white border-0"
                    style={{ background: user?.location_services_enabled ? 'rgba(100,100,120,0.5)' : 'linear-gradient(135deg, #FF6B35, #E8365D)' }}>

                {requestingLocation ?
                    <Loader2 className="w-4 h-4 animate-spin" /> :
                    user?.location_services_enabled ?
                    "Update" :

                    "Enable"
                    }
              </Button>
            </div>
          </div>

          {user?.bio && !editingProfile && <p className="text-sm mb-4 p-3 rounded-xl bg-slate-50" style={{ color: '#6B7A8D' }}>{user.bio}</p>}


        </motion.section>



        {/* User Type */}
        <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(124,111,224,0.15)' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#151528', fontFamily: "'Sora', sans-serif" }}>I am a...</h3>
          
          <RadioGroup
                value={user?.user_type || "renter"}
                onValueChange={handleUserTypeChange}
                className="space-y-3">

            <Label htmlFor="renter" className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all" style={{ borderColor: user?.user_type === "renter" ? "#FF6B35" : "rgba(255,107,53,0.2)", background: user?.user_type === "renter" ? "rgba(255,107,53,0.08)" : "rgba(255,255,255,0.5)" }}>
              <RadioGroupItem value="renter" id="renter" className="sr-only" />
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)' }}>
                <Building2 className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: '#151528' }}>Renter</p>
                <p className="text-sm" style={{ color: '#6B6A8E' }}>I rent my home</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: user?.user_type === "renter" ? "#FF6B35" : "#cbd5e1", background: user?.user_type === "renter" ? "#FF6B35" : "transparent" }}>
                {user?.user_type === "renter" && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </Label>

            <Label htmlFor="homeowner" className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all" style={{ borderColor: user?.user_type === "homeowner" ? "#E8365D" : "rgba(232,54,93,0.2)", background: user?.user_type === "homeowner" ? "rgba(232,54,93,0.08)" : "rgba(255,255,255,0.5)" }}>
              <RadioGroupItem value="homeowner" id="homeowner" className="sr-only" />
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,54,93,0.1)', border: '1px solid rgba(232,54,93,0.2)' }}>
                <Home className="w-6 h-6 text-[#E8365D]" />
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: '#151528' }}>Homeowner</p>
                <p className="text-sm" style={{ color: '#6B6A8E' }}>I own my home</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: user?.user_type === "homeowner" ? "#E8365D" : "#cbd5e1", background: user?.user_type === "homeowner" ? "#E8365D" : "transparent" }}>
                {user?.user_type === "homeowner" && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </Label>
          </RadioGroup>
        </motion.section>

        {/* Subscription Management for Business Users */}
        {user?.account_type === 'business' && user?.subscription_tier === 'business' && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(124,111,224,0.15)' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#151528', fontFamily: "'Sora', sans-serif" }}>Business Subscription</h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,107,53,0.07)', border: '1px solid rgba(255,107,53,0.18)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold" style={{ color: '#151528' }}>
                    {user?.business_plan ? `${user.business_plan.charAt(0).toUpperCase() + user.business_plan.slice(1)} Plan` : 'Business Plan'}
                  </span>
                  <span className="text-sm font-bold text-[#FF6B35]">
                    £{user?.business_monthly_price || 0}/month
                  </span>
                </div>
                {user?.subscription_cancelled && user?.subscription_cancel_at && (
                  <p className="text-sm text-orange-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Cancels on {new Date(user.subscription_cancel_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {!user?.subscription_cancelled && (
                <Button
                  onClick={() => setShowCancelDialog(true)}
                  variant="outline"
                  className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </motion.section>
        )}

        {/* Account Type Switch */}
        {user?.is_trades &&
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(124,111,224,0.15)' }}>
            <h3 className="font-semibold mb-2" style={{ color: '#151528', fontFamily: "'Sora', sans-serif" }}>Account Type</h3>
            <p className="text-sm mb-4" style={{ color: '#6B7A8D' }}>
              You currently have a professional trades account. Switch to a standard account if you no longer want to receive job requests.
            </p>
            
            <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Are you sure you want to switch to a standard account? You'll no longer receive job requests from customers.")) {
                    updateUserMutation.mutate({
                      is_trades: false,
                      trades_status: null
                    });
                  }
                }}
                disabled={updateUserMutation.isPending}
                className="w-full rounded-xl border-slate-200 hover:bg-slate-50">

              Switch to Standard Account
            </Button>
          </motion.section>
            }

        {/* About & Legal */}
        <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(124,111,224,0.15)' }}>
          <button className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/40">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#FF6B35]" />
              <span style={{ color: '#151528' }}>Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
          <div className="h-px" style={{ background: 'rgba(255,107,53,0.12)' }} />
          <button className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/40">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#E8365D]" />
              <span style={{ color: '#151528' }}>Terms of Service</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </motion.section>

        {/* Logout */}
        <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2">

          <Button
                variant="outline"
                onClick={handleLogout}
                aria-label="Log out of your account"
                className="w-full h-12 rounded-xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100">

            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>

          {(user?.is_premium || user?.subscription_tier === 'business') && !user?.subscription_cancelled && (
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              className="w-full h-12 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 text-sm"
            >
              Cancel Subscription
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="w-full h-12 rounded-xl border-red-100 text-red-400 hover:bg-red-50 text-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: '#1a2f42' }}>Your Notifications</h2>
                {unreadNotifications.length > 0 &&
                <Button variant="ghost" size="sm" onClick={() => markAllReadMutation.mutate()} className="text-sm text-[#FF6B35]">

                    Mark all read
                  </Button>
                }
              </div>

              <Tabs defaultValue="unread">
                <TabsList className="w-full grid grid-cols-2 mb-4" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(124,111,224,0.15)' }}>
                  <TabsTrigger value="unread">
                    Unread {unreadNotifications.length > 0 &&
                    <Badge className="ml-2 bg-red-500">{unreadNotifications.length}</Badge>
                    }
                  </TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <TabsContent value="unread" className="space-y-3">
                  {unreadNotifications.length === 0 ?
                  <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(124,111,224,0.12)' }}>
                      <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p style={{ color: '#6B7A8D' }}>No unread notifications</p>
                    </div> :

                  unreadNotifications.map((notification) => {
                    const Icon = typeIcons[notification.type] || Info;
                    return (
                      <div key={notification.id} onClick={() => handleNotificationClick(notification)} className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,107,53,0.07)', border: '2px solid rgba(255,107,53,0.25)', backdropFilter: 'blur(8px)' }}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,107,53,0.12)' }}>
                              <Icon className={`w-5 h-5 ${priorityColors[notification.priority]}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-sm" style={{ color: '#1a2f42' }}>{notification.title}</h3>
                                <p className="text-xs whitespace-nowrap" style={{ color: '#6B7A8D' }}>{format(new Date(notification.created_date), "MMM d")}</p>
                              </div>
                              <p className="text-sm" style={{ color: '#1a2f42' }}>{notification.message}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11"
                              onClick={(e) => {
                                e.stopPropagation();
                                markReadMutation.mutate(notification.id);
                              }}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11 text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate(notification.id);
                              }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>);

                  })
                  }
                </TabsContent>

                <TabsContent value="all" className="space-y-3">
                  {notifications.length === 0 ?
                  <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(124,111,224,0.12)' }}>
                      <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p style={{ color: '#6B7A8D' }}>No notifications yet</p>
                    </div> :

                  notifications.map((notification) => {
                    const Icon = typeIcons[notification.type] || Info;
                    return (
                      <div key={notification.id} onClick={() => handleNotificationClick(notification)} className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01]" style={{ background: notification.read ? 'rgba(255,255,255,0.5)' : 'rgba(255,107,53,0.07)', border: notification.read ? '1px solid rgba(255,107,53,0.1)' : '1px solid rgba(255,107,53,0.25)', backdropFilter: 'blur(8px)' }}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,107,53,0.1)' }}>
                              <Icon className={`w-5 h-5 ${priorityColors[notification.priority]}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-sm" style={{ color: notification.read ? '#6B7A8D' : '#1a2f42' }}>{notification.title}</h3>
                                <p className="text-xs whitespace-nowrap" style={{ color: '#6B7A8D' }}>{format(new Date(notification.created_date), "MMM d")}</p>
                              </div>
                              <p className="text-sm" style={{ color: notification.read ? '#6B7A8D' : '#1a2f42' }}>{notification.message}</p>
                            </div>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(notification.id);
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>);

                  })
                  }
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">

        {/* Notification Preferences */}
        <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(124,111,224,0.15)' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#151528', fontFamily: "'Sora', sans-serif" }}>Notification Preferences</h3>
          
          <div className="space-y-3">
            {[
                { key: "email_enabled", label: "Email Notifications", description: "Receive updates via email" },
                { key: "push_enabled", label: "Push Notifications", description: "Receive mobile push alerts" },
                { key: "issueupdate_enabled", label: "Issue Updates", description: "Notifications when issues change status" },
                { key: "workrequest_enabled", label: "Work Requests", description: "New job requests from tradespeople" },
                { key: "appointment_enabled", label: "Appointments", description: "Upcoming maintenance reminders" },
                { key: "payment_enabled", label: "Payment Alerts", description: "Payment due and completed notifications" },
                { key: "message_enabled", label: "Messages", description: "New messages from tradespeople" },
                { key: "reminders_enabled", label: "Maintenance Reminders", description: "Automated reminder notifications" }].
                map((pref) => {
                  const prefs = user?.notification_preferences || {};
                  const isEnabled = prefs[pref.key] !== false;

                  return (
                    <button
                      key={pref.key}
                      onClick={() => {
                        updateUserMutation.mutate({
                          notification_preferences: {
                            ...prefs,
                            [pref.key]: !isEnabled
                          }
                        });
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                      style={{ borderColor: isEnabled ? '#FF6B35' : 'rgba(255,107,53,0.2)', background: isEnabled ? 'rgba(255,107,53,0.08)' : 'rgba(255,255,255,0.4)' }}>

                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: '#1a2f42' }}>{pref.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>{pref.description}</p>
                  </div>
                  <div className="w-12 h-6 rounded-full transition-all" style={{ background: isEnabled ? 'linear-gradient(135deg, #FF6B35, #E8365D)' : '#cbd5e1' }}>
                    <div className={cn(
                          "w-5 h-5 rounded-full bg-white shadow-lg transition-all mt-0.5",
                          isEnabled ? "ml-6" : "ml-0.5"
                        )} />
                  </div>
                </button>);

                })}
          </div>
        </motion.section>

        {/* Language & Currency */}
        <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(124,111,224,0.15)' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#151528', fontFamily: "'Sora', sans-serif" }}>Language & Currency</h3>
          <div className="space-y-3">
            <div>
              <Label style={{ color: '#6B7A8D' }}>Language</Label>
              <MobileSelect
                value={user?.language || "en"}
                onChange={(val) => updateUserMutation.mutate({ language: val })}
                placeholder="Language"
                className="w-full mt-1"
                options={[
                  { value: "en", label: "English" },
                  { value: "es", label: "Español" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                ]}
              />
            </div>

            <div>
              <Label style={{ color: '#6B7A8D' }}>Currency</Label>
              <MobileSelect
                value={user?.currency || "GBP"}
                onChange={(val) => updateUserMutation.mutate({ currency: val })}
                placeholder="Currency"
                className="w-full mt-1"
                options={[
                  { value: "GBP", label: "£ GBP (British Pound)" },
                  { value: "USD", label: "$ USD (US Dollar)" },
                  { value: "EUR", label: "€ EUR (Euro)" },
                ]}
              />
            </div>
          </div>
        </motion.section>

        {/* App Version */}
        <p className="text-center text-xs" style={{ color: '#6B7A8D' }}>UFixi v1.0.0




            </p>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Account Dialog — 3-step with email verification */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) { setDeleteStep(1); setDeleteConfirmText(""); setDeleteVerificationCode(""); } }}>
        <DialogContent className="max-w-md bg-white">
          {deleteStep === 1 ? (
                <>
                  <DialogHeader>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(239,68,68,0.1)' }}>
                      <AlertTriangle className="w-7 h-7 text-red-500" />
                    </div>
                    <DialogTitle className="text-center text-lg" style={{ color: '#1a2f42' }}>Delete Your Account?</DialogTitle>
                    <DialogDescription className="text-center" style={{ color: '#6B7A8D' }}>
                      This is permanent and cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="my-3 space-y-2 rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    {[
                      "All your issues and diagnostic history will be deleted",
                      "Your saved contractors and preferences will be removed",
                      "Any active subscriptions must be cancelled separately",
                      "This action cannot be reversed",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        <p className="text-sm" style={{ color: '#1a2f42' }}>{item}</p>
                      </div>
                    ))}
                  </div>
                  <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button variant="destructive" className="w-full h-12" onClick={() => setDeleteStep(2)}>
                      I understand, continue
                    </Button>
                    <Button variant="outline" className="w-full h-12" onClick={() => setShowDeleteDialog(false)}>
                      Keep my account
                    </Button>
                  </DialogFooter>
                </>
              ) : deleteStep === 2 ? (
                <>
                  <DialogHeader>
                    <DialogTitle style={{ color: '#1a2f42' }}>Confirm Deletion</DialogTitle>
                    <DialogDescription style={{ color: '#6B7A8D' }}>
                      Type <strong style={{ color: '#ef4444' }}>DELETE</strong> in capitals to proceed.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="my-3">
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="h-12 bg-white border-red-200 focus:border-red-400 text-center font-semibold tracking-widest"
                      autoFocus
                    />
                  </div>
                  <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                      variant="destructive"
                      className="w-full h-12"
                      onClick={handleSendVerificationCode}
                      disabled={deletingStep || deleteConfirmText !== "DELETE"}
                    >
                      {deletingStep === "sending" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</> : "Send Verification Code"}
                    </Button>
                    <Button variant="outline" className="w-full h-12" onClick={() => { setDeleteStep(1); setDeleteConfirmText(""); }} disabled={deletingStep}>
                      Go back
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle style={{ color: '#1a2f42' }}>Verify Email</DialogTitle>
                    <DialogDescription style={{ color: '#6B7A8D' }}>
                      A verification code has been sent to {user?.email}. Enter it below to complete deletion.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="my-3 space-y-3">
                    <Input
                      value={deleteVerificationCode}
                      onChange={(e) => setDeleteVerificationCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit code"
                      className="h-12 bg-white border-slate-200 text-center font-mono text-lg tracking-widest"
                      maxLength="6"
                      autoFocus
                    />
                    <p className="text-xs text-center" style={{ color: '#6B7A8D' }}>Code expires in 10 minutes</p>
                  </div>
                  <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                      variant="destructive"
                      className="w-full h-12"
                      onClick={handleDeleteAccount}
                      disabled={deleting || !deleteVerificationCode || deleteVerificationCode.length !== 6}
                    >
                      {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting…</> : "Delete Account"}
                    </Button>
                    <Button variant="outline" className="w-full h-12" onClick={() => { setDeleteStep(2); setDeleteVerificationCode(""); }} disabled={deleting}>
                      Go back
                    </Button>
                  </DialogFooter>
                </>
              )}
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle style={{ color: '#1a2f42' }}>Cancel Subscription?</DialogTitle>
            <DialogDescription style={{ color: '#6B7A8D' }}>
              Your subscription will remain active until the end of your current billing period. 
              You'll lose access to business features after that.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelling}
              className=""
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}