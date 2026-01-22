import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Home,
  Building2,
  Crown,
  LogOut,
  ChevronRight,
  User,
  Shield,
  Moon,
  Sun,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { motion } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("account");
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
      setEditingProfile(false);
    }
  });

  const handleUserTypeChange = (value) => {
    updateUserMutation.mutate({ user_type: value });
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleCancelSubscription = async () => {
    if (!user?.stripe_subscription_id) return;
    
    setCancelling(true);
    try {
      await base44.functions.invoke('cancelSubscription', {
        subscriptionId: user.stripe_subscription_id
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
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-pink-300/45 to-orange-500/85 animate-gradient-shift blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/75 via-yellow-300/35 to-blue-600/80 animate-gradient-shift-slow blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-600/75 via-pink-200/40 to-orange-500/70 animate-gradient-shift-reverse blur-3xl" />
        <div className="absolute inset-0 bg-white/5" />
      </div>
      
      <style jsx>{`
        @keyframes gradient-shift {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          25% { transform: translate(15%, 10%) scale(1.2) rotate(5deg); }
          50% { transform: translate(5%, 20%) scale(1.1) rotate(-3deg); }
          75% { transform: translate(-10%, 10%) scale(1.15) rotate(4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-slow {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          33% { transform: translate(-10%, 15%) scale(1.3) rotate(-6deg); }
          66% { transform: translate(10%, -10%) scale(1.1) rotate(5deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-reverse {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          30% { transform: translate(20%, -15%) scale(1.25) rotate(7deg); }
          60% { transform: translate(-15%, 10%) scale(1.15) rotate(-4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        .animate-gradient-shift {
          animation: gradient-shift 12s ease-in-out infinite;
        }
        .animate-gradient-shift-slow {
          animation: gradient-shift-slow 15s ease-in-out infinite;
        }
        .animate-gradient-shift-reverse {
          animation: gradient-shift-reverse 13s ease-in-out infinite;
        }
      `}</style>
      
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-10 backdrop-blur-lg border-b",
        theme === "dark" ?
        "bg-slate-900/80 border-slate-700/50" :
        "bg-white border-slate-200"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-xl",
              theme === "dark" ?
              "hover:bg-slate-800 text-slate-400 hover:text-slate-300" :
              "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
            )}
            onClick={() => navigate(createPageUrl("Home"))}>

            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6943ddc3165afcd16ccf0414/b6e7c1091_ufixi_primary_RGB.png"
            alt="UFixi"
            className="h-8 w-auto object-contain"
          />
          <h1 className={cn(
            "font-semibold text-lg ml-auto",
            theme === "dark" ? "text-slate-100" : "text-slate-900"
          )}>Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={cn(
            "w-full grid grid-cols-3 mb-6",
            theme === "dark" ? "bg-slate-800" : "bg-slate-100"
          )}>
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
              className={cn(
                "rounded-2xl p-5 border",
                theme === "dark" ?
                "bg-slate-800 border-slate-700/50" :
                "bg-white border-slate-200"
              )}>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {user?.profile_picture_url ?
                  <img
                    src={user.profile_picture_url}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover shadow-lg" /> :


                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
                    theme === "dark" ?
                    "bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-600/30 border border-blue-500/30" :
                    "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20 border border-blue-400/30"
                  )}>
                  <User className={cn(
                      "w-7 h-7",
                      theme === "dark" ? "text-blue-100" : "text-white"
                    )} />
                </div>
                  }
              <label className={cn(
                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-lg",
                    uploadingPhoto ? "opacity-50" : "hover:scale-110 transition-transform",
                    theme === "dark" ?
                    "bg-[#57CFA4]" :
                    "bg-[#57CFA4]"
                  )}>
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
              <h2 className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-slate-100" : "text-slate-900"
                  )}>{user?.display_name || user?.full_name || "User"}</h2>
              <p className={cn(
                    "text-sm",
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  )}>{user?.email}</p>
            </div>
            <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingProfile(!editingProfile)}
                  className={cn(
                    "rounded-xl",
                    theme === "dark" ? "hover:bg-slate-700" : "hover:bg-slate-100"
                  )}>

              <Edit2 className="w-4 h-4" />
            </Button>
          </div>

          {editingProfile &&
              <div className="space-y-3 mb-4">
              <div>
                <Label className={cn(
                    "text-sm mb-1 block",
                    theme === "dark" ? "text-slate-300" : "text-slate-700"
                  )}>
                  Display Name
                </Label>
                <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className={cn(
                      theme === "dark" ?
                      "bg-slate-700 border-slate-600 text-white" :
                      "bg-white border-slate-200"
                    )} />

              </div>
              <div>
                <Label className={cn(
                    "text-sm mb-1 block",
                    theme === "dark" ? "text-slate-300" : "text-slate-700"
                  )}>
                  Bio
                </Label>
                <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    className={cn(
                      "h-20",
                      theme === "dark" ?
                      "bg-slate-700 border-slate-600 text-white" :
                      "bg-white border-slate-200"
                    )} />

              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={cn(
                      "text-sm mb-1 block",
                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                    )}>
                    Country
                  </Label>
                  <Select
                      value={user?.country || ""}
                      onValueChange={(value) => {
                        base44.auth.updateMe({ country: value });
                        queryClient.invalidateQueries(["user"]);
                      }}>

                    <SelectTrigger className={cn(
                        theme === "dark" ?
                        "bg-slate-700 border-slate-600 text-white" :
                        "bg-white border-slate-200"
                      )}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="IE">Ireland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className={cn(
                      "text-sm mb-1 block",
                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                    )}>
                    Postcode
                  </Label>
                  <Input
                      value={user?.postcode || ""}
                      onChange={(e) => {
                        base44.auth.updateMe({ postcode: e.target.value });
                        queryClient.invalidateQueries(["user"]);
                      }}
                      placeholder="e.g., SW1A 1AA"
                      className={cn(
                        theme === "dark" ?
                        "bg-slate-700 border-slate-600 text-white" :
                        "bg-white border-slate-200"
                      )} />

                </div>
              </div>
              
              <Button
                  onClick={handleSaveProfile}
                  disabled={updateUserMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700">

                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
              }

          {/* Location Section */}
          <div className={cn(
                "rounded-xl p-4 border",
                theme === "dark" ?
                "bg-slate-700/50 border-slate-600/50" :
                "bg-slate-50 border-slate-200"
              )}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <MapPin className={cn(
                      "w-5 h-5 mt-0.5",
                      user?.location_services_enabled ?
                      "text-[#57CFA4]" :
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    )} />
                <div className="flex-1">
                  <p className={cn(
                        "font-medium text-sm",
                        theme === "dark" ? "text-slate-200" : "text-slate-900"
                      )}>
                    Location Services
                  </p>
                  <p className={cn(
                        "text-xs mt-0.5",
                        theme === "dark" ? "text-slate-400" : "text-slate-600"
                      )}>
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
                    className={cn(
                      "rounded-xl",
                      user?.location_services_enabled ?
                      "bg-slate-500 hover:bg-slate-600" :
                      "bg-[#57CFA4] hover:bg-[#57CFA4]/90"
                    )}>

                {requestingLocation ?
                    <Loader2 className="w-4 h-4 animate-spin" /> :
                    user?.location_services_enabled ?
                    "Update" :

                    "Enable"
                    }
              </Button>
            </div>
          </div>

          {user?.bio && !editingProfile &&
              <p className={cn(
                "text-sm mb-4 p-3 rounded-xl",
                theme === "dark" ?
                "bg-slate-700/50 text-slate-300" :
                "bg-slate-50 text-slate-600"
              )}>
              {user.bio}
            </p>
              }


        </motion.section>

        {/* Theme Toggle */}
        <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={cn(
                "rounded-2xl p-5 border",
                theme === "dark" ?
                "bg-slate-800 border-slate-700/50" :
                "bg-white border-slate-200"
              )}>

          <h3 className={cn(
                "font-semibold mb-4",
                theme === "dark" ? "text-slate-200" : "text-slate-900"
              )}>Appearance</h3>
          
          <button
                onClick={toggleTheme}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                  theme === "dark" ?
                  "border-blue-500 bg-blue-500/10 hover:bg-blue-500/20" :
                  "border-blue-500 bg-blue-50 hover:bg-blue-100"
                )}>

            <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  theme === "dark" ?
                  "bg-blue-600/20 border border-blue-500/30" :
                  "bg-blue-500/20 border border-blue-400/30"
                )}>
              {theme === "dark" ?
                  <Moon className="w-6 h-6 text-blue-400" /> :

                  <Sun className="w-6 h-6 text-blue-600" />
                  }
            </div>
            <div className="flex-1 text-left">
              <p className={cn(
                    "font-medium",
                    theme === "dark" ? "text-slate-200" : "text-slate-900"
                  )}>
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </p>
              <p className={cn(
                    "text-sm",
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  )}>
                Tap to switch to {theme === "dark" ? "light" : "dark"} mode
              </p>
            </div>
          </button>
        </motion.section>

        {/* User Type */}
        <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn(
                "rounded-2xl p-5 border",
                theme === "dark" ?
                "bg-slate-800 border-slate-700/50" :
                "bg-white border-slate-200"
              )}>

          <h3 className={cn(
                "font-semibold mb-4",
                theme === "dark" ? "text-slate-200" : "text-slate-900"
              )}>I am a...</h3>
          
          <RadioGroup
                value={user?.user_type || "renter"}
                onValueChange={handleUserTypeChange}
                className="space-y-3">

            <Label
                  htmlFor="renter"
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-500/50 data-[state=checked]:border-blue-500",
                    theme === "dark" ?
                    "data-[state=checked]:bg-blue-500/10" :
                    "data-[state=checked]:bg-blue-50"
                  )}
                  data-state={user?.user_type === "renter" ? "checked" : "unchecked"}>

              <RadioGroupItem value="renter" id="renter" className="sr-only" />
              <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border",
                    theme === "dark" ?
                    "bg-teal-500/20 border-teal-500/30" :
                    "bg-teal-100 border-teal-200"
                  )}>
                <Building2 className={cn(
                      "w-6 h-6",
                      theme === "dark" ? "text-teal-400" : "text-teal-600"
                    )} />
              </div>
              <div className="flex-1">
                <p className={cn(
                      "font-medium",
                      theme === "dark" ? "text-slate-200" : "text-slate-900"
                    )}>Renter</p>
                <p className={cn(
                      "text-sm",
                      theme === "dark" ? "text-slate-400" : "text-slate-600"
                    )}>I rent my home</p>
              </div>
              <div className={cn(
                    "w-5 h-5 rounded-full border-2",
                    user?.user_type === "renter" ?
                    "border-blue-500 bg-blue-500" :
                    theme === "dark" ? "border-slate-600" : "border-slate-300"
                  )}>
                {user?.user_type === "renter" &&
                    <div className="w-full h-full flex items-center justify-center">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        theme === "dark" ? "bg-slate-900" : "bg-white"
                      )} />
                  </div>
                    }
              </div>
            </Label>

            <Label
                  htmlFor="homeowner"
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-500/50 data-[state=checked]:border-blue-500",
                    theme === "dark" ?
                    "data-[state=checked]:bg-blue-500/10" :
                    "data-[state=checked]:bg-blue-50"
                  )}
                  data-state={user?.user_type === "homeowner" ? "checked" : "unchecked"}>

              <RadioGroupItem value="homeowner" id="homeowner" className="sr-only" />
              <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border",
                    theme === "dark" ?
                    "bg-violet-500/20 border-violet-500/30" :
                    "bg-violet-100 border-violet-200"
                  )}>
                <Home className={cn(
                      "w-6 h-6",
                      theme === "dark" ? "text-violet-400" : "text-violet-600"
                    )} />
              </div>
              <div className="flex-1">
                <p className={cn(
                      "font-medium",
                      theme === "dark" ? "text-slate-200" : "text-slate-900"
                    )}>Homeowner</p>
                <p className={cn(
                      "text-sm",
                      theme === "dark" ? "text-slate-400" : "text-slate-600"
                    )}>I own my home</p>
              </div>
              <div className={cn(
                    "w-5 h-5 rounded-full border-2",
                    user?.user_type === "homeowner" ?
                    "border-blue-500 bg-blue-500" :
                    theme === "dark" ? "border-slate-600" : "border-slate-300"
                  )}>
                {user?.user_type === "homeowner" &&
                    <div className="w-full h-full flex items-center justify-center">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        theme === "dark" ? "bg-slate-900" : "bg-white"
                      )} />
                  </div>
                    }
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
            className={cn(
              "rounded-2xl p-5 border",
              theme === "dark" ?
              "bg-slate-800 border-slate-700/50" :
              "bg-white border-slate-200"
            )}>

            <h3 className={cn(
              "font-semibold mb-4",
              theme === "dark" ? "text-slate-200" : "text-slate-900"
            )}>Business Subscription</h3>

            <div className="space-y-4">
              <div className={cn(
                "p-4 rounded-xl border",
                theme === "dark" ?
                "bg-slate-700/50 border-slate-600/50" :
                "bg-slate-50 border-slate-200"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-slate-200" : "text-slate-900"
                  )}>
                    {user?.business_plan ? `${user.business_plan.charAt(0).toUpperCase() + user.business_plan.slice(1)} Plan` : 'Business Plan'}
                  </span>
                  <span className={cn(
                    "text-sm font-bold",
                    theme === "dark" ? "text-[#57CFA4]" : "text-blue-600"
                  )}>
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
                  className={cn(
                    "w-full rounded-xl",
                    theme === "dark" ?
                    "border-red-500/30 text-red-400 hover:bg-red-500/10" :
                    "border-red-200 text-red-600 hover:bg-red-50"
                  )}
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
              className={cn(
                "rounded-2xl p-5 border",
                theme === "dark" ?
                "bg-slate-800 border-slate-700/50" :
                "bg-white border-slate-200"
              )}>

            <h3 className={cn(
                "font-semibold mb-2",
                theme === "dark" ? "text-slate-200" : "text-slate-900"
              )}>Account Type</h3>
            <p className={cn(
                "text-sm mb-4",
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              )}>
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
                className={cn(
                  "w-full rounded-xl",
                  theme === "dark" ?
                  "border-slate-600 hover:bg-slate-700" :
                  "border-slate-300 hover:bg-slate-50"
                )}>

              Switch to Standard Account
            </Button>
          </motion.section>
            }

        {/* About & Legal */}
        <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={cn(
                "rounded-2xl border overflow-hidden",
                theme === "dark" ?
                "bg-slate-800 border-slate-700/50" :
                "bg-white border-slate-200"
              )}>

          <button className={cn(
                "w-full flex items-center justify-between p-4 transition-colors",
                theme === "dark" ?
                "hover:bg-slate-700/50" :
                "hover:bg-slate-50"
              )}>
            <div className="flex items-center gap-3">
              <Shield className={cn(
                    "w-5 h-5",
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  )} />
              <span className={cn(
                    theme === "dark" ? "text-slate-300" : "text-slate-700"
                  )}>Privacy Policy</span>
            </div>
            <ChevronRight className={cn(
                  "w-5 h-5",
                  theme === "dark" ? "text-slate-500" : "text-slate-400"
                )} />
          </button>
          <div className={cn(
                "h-px",
                theme === "dark" ? "bg-slate-700/50" : "bg-slate-200"
              )} />
          <button className={cn(
                "w-full flex items-center justify-between p-4 transition-colors",
                theme === "dark" ?
                "hover:bg-slate-700/50" :
                "hover:bg-slate-50"
              )}>
            <div className="flex items-center gap-3">
              <Shield className={cn(
                    "w-5 h-5",
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  )} />
              <span className={cn(
                    theme === "dark" ? "text-slate-300" : "text-slate-700"
                  )}>Terms of Service</span>
            </div>
            <ChevronRight className={cn(
                  "w-5 h-5",
                  theme === "dark" ? "text-slate-500" : "text-slate-400"
                )} />
          </button>
        </motion.section>

        {/* Logout */}
        <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}>

          <Button
                variant="outline"
                onClick={handleLogout}
                className={cn(
                  "w-full h-12 rounded-xl transition-colors",
                  theme === "dark" ?
                  "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50" :
                  "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                )}>

            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn(
                  "text-xl font-bold",
                  theme === "dark" ? "text-white" : "text-slate-900"
                )}>Your Notifications</h2>
                {unreadNotifications.length > 0 &&
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllReadMutation.mutate()}
                  className={cn(
                    "text-sm",
                    theme === "dark" ? "text-[#57CFA4]" : "text-blue-600"
                  )}>

                    Mark all read
                  </Button>
                }
              </div>

              <Tabs defaultValue="unread">
                <TabsList className={cn(
                  "w-full grid grid-cols-2 mb-4",
                  theme === "dark" ? "bg-[#1A2F42]" : "bg-slate-100"
                )}>
                  <TabsTrigger value="unread">
                    Unread {unreadNotifications.length > 0 &&
                    <Badge className="ml-2 bg-red-500">{unreadNotifications.length}</Badge>
                    }
                  </TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <TabsContent value="unread" className="space-y-3">
                  {unreadNotifications.length === 0 ?
                  <div className={cn(
                    "text-center py-12 rounded-2xl border",
                    theme === "dark" ?
                    "bg-[#1A2F42] border-[#57CFA4]/20" :
                    "bg-white border-slate-200"
                  )}>
                      <Bell className={cn(
                      "w-12 h-12 mx-auto mb-3",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
                    )} />
                      <p className={cn(
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                    )}>
                        No unread notifications
                      </p>
                    </div> :

                  unreadNotifications.map((notification) => {
                    const Icon = typeIcons[notification.type] || Info;
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "rounded-2xl p-4 border-2 cursor-pointer transition-all hover:scale-[1.02]",
                          theme === "dark" ?
                          "bg-[#1A2F42] border-[#57CFA4]" :
                          "bg-blue-50 border-blue-200"
                        )}>

                          <div className="flex items-start gap-3">
                            <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            theme === "dark" ?
                            "bg-[#57CFA4]/20" :
                            "bg-blue-100"
                          )}>
                              <Icon className={cn(
                              "w-5 h-5",
                              priorityColors[notification.priority]
                            )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className={cn(
                                "font-semibold text-sm",
                                theme === "dark" ? "text-white" : "text-slate-900"
                              )}>
                                  {notification.title}
                                </h3>
                                <p className={cn(
                                "text-xs whitespace-nowrap",
                                theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                              )}>
                                  {format(new Date(notification.created_date), "MMM d")}
                                </p>
                              </div>
                              <p className={cn(
                              "text-sm",
                              theme === "dark" ? "text-white" : "text-slate-700"
                            )}>
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                markReadMutation.mutate(notification.id);
                              }}>

                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
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
                  <div className={cn(
                    "text-center py-12 rounded-2xl border",
                    theme === "dark" ?
                    "bg-[#1A2F42] border-[#57CFA4]/20" :
                    "bg-white border-slate-200"
                  )}>
                      <Bell className={cn(
                      "w-12 h-12 mx-auto mb-3",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
                    )} />
                      <p className={cn(
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                    )}>
                        No notifications yet
                      </p>
                    </div> :

                  notifications.map((notification) => {
                    const Icon = typeIcons[notification.type] || Info;
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "rounded-2xl p-4 border cursor-pointer transition-all hover:scale-[1.01]",
                          notification.read ?
                          theme === "dark" ?
                          "bg-[#1A2F42]/50 border-[#57CFA4]/20" :
                          "bg-white border-slate-200" :
                          theme === "dark" ?
                          "bg-[#1A2F42] border-[#57CFA4]" :
                          "bg-blue-50 border-blue-200"
                        )}>

                          <div className="flex items-start gap-3">
                            <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            theme === "dark" ?
                            "bg-[#57CFA4]/20" :
                            "bg-blue-100"
                          )}>
                              <Icon className={cn(
                              "w-5 h-5",
                              priorityColors[notification.priority]
                            )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className={cn(
                                "font-semibold text-sm",
                                notification.read ?
                                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600" :
                                theme === "dark" ? "text-white" : "text-slate-900"
                              )}>
                                  {notification.title}
                                </h3>
                                <p className={cn(
                                "text-xs whitespace-nowrap",
                                theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                              )}>
                                  {format(new Date(notification.created_date), "MMM d")}
                                </p>
                              </div>
                              <p className={cn(
                              "text-sm",
                              notification.read ?
                              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600" :
                              theme === "dark" ? "text-white" : "text-slate-700"
                            )}>
                                {notification.message}
                              </p>
                            </div>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
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
              className={cn(
                "rounded-2xl p-5 border",
                theme === "dark" ?
                "bg-slate-800 border-slate-700/50" :
                "bg-white border-slate-200"
              )}>

          <h3 className={cn(
                "font-semibold mb-4",
                theme === "dark" ? "text-slate-200" : "text-slate-900"
              )}>Notification Preferences</h3>
          
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
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                        isEnabled ?
                        theme === "dark" ?
                        "border-[#57CFA4] bg-[#57CFA4]/10" :
                        "border-[#57CFA4] bg-[#57CFA4]/10" :
                        theme === "dark" ?
                        "border-slate-700 bg-slate-800/50" :
                        "border-slate-200 bg-slate-50"
                      )}>

                  <div className="flex-1">
                    <p className={cn(
                          "font-medium text-sm",
                          theme === "dark" ? "text-slate-200" : "text-slate-900"
                        )}>
                      {pref.label}
                    </p>
                    <p className={cn(
                          "text-xs mt-0.5",
                          theme === "dark" ? "text-slate-400" : "text-slate-600"
                        )}>
                      {pref.description}
                    </p>
                  </div>
                  <div className={cn(
                        "w-12 h-6 rounded-full transition-all",
                        isEnabled ? "bg-[#57CFA4]" : theme === "dark" ? "bg-slate-700" : "bg-slate-300"
                      )}>
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
              className={cn(
                "rounded-2xl p-5 border",
                theme === "dark" ?
                "bg-[#1E3A57]/50 border-[#57CFA4]/20" :
                "bg-white border-slate-200"
              )}>

          <h3 className={cn(
                "font-semibold mb-4",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>Language & Currency</h3>
          
          <div className="space-y-3">
            <div>
              <Label className={cn(theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70")}>
                Language
              </Label>
              <Select
                    value={user?.language || "en"}
                    onValueChange={(val) => updateUserMutation.mutate({ language: val })}>

                <SelectTrigger className={cn(
                      "mt-1",
                      theme === "dark" ?
                      "bg-[#1E3A57] border-[#57CFA4]/30 text-white" :
                      "bg-white border-slate-200"
                    )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className={cn(theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70")}>
                Currency
              </Label>
              <Select
                    value={user?.currency || "GBP"}
                    onValueChange={(val) => updateUserMutation.mutate({ currency: val })}>

                <SelectTrigger className={cn(
                      "mt-1",
                      theme === "dark" ?
                      "bg-[#1E3A57] border-[#57CFA4]/30 text-white" :
                      "bg-white border-slate-200"
                    )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">£ GBP (British Pound)</SelectItem>
                  <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">€ EUR (Euro)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.section>

        {/* App Version */}
        <p className="text-center text-xs text-[#57CFA4]/50">UFixi v1.0.0




            </p>
          </TabsContent>
        </Tabs>
      </main>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className={cn(
          "max-w-md",
          theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              theme === "dark" ? "text-white" : "text-slate-900"
            )}>Cancel Subscription?</DialogTitle>
            <DialogDescription className={cn(
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            )}>
              Your subscription will remain active until the end of your current billing period. 
              You'll lose access to business features after that.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelling}
              className={cn(
                theme === "dark" ? "border-slate-600 hover:bg-slate-700" : ""
              )}
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