import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home, Building2, LogOut, ChevronRight, User, Shield, Edit2, Camera,
  MapPin, Loader2, Bell, Check, Trash2, AlertTriangle, Briefcase, Calendar,
  CreditCard, MessageCircle, Info, AlertCircle, Ruler, Globe, KeyRound
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import MobileSelect from "@/components/kora/MobileSelect";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
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

const TABS = [
  { id: "account", label: "Account" },
  { id: "notifications", label: "Notifications" },
  { id: "preferences", label: "Preferences" },
];

function ToggleRow({ label, description, isEnabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left min-h-[60px]"
      style={{
        borderColor: isEnabled ? '#E8530A' : 'rgba(232,83,10,0.2)',
        background: isEnabled ? 'rgba(232,83,10,0.07)' : 'rgba(255,255,255,0.4)'
      }}
    >
      <div className="flex-1">
        <p className="font-medium text-sm" style={{ color: '#1a2f42' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>{description}</p>}
      </div>
      <div className="w-12 h-6 rounded-full flex-shrink-0 transition-all" style={{ background: isEnabled ? 'linear-gradient(135deg, #E8530A, #D93870)' : '#cbd5e1' }}>
        <div className={cn("w-5 h-5 rounded-full bg-white shadow-lg transition-all mt-0.5", isEnabled ? "ml-6" : "ml-0.5")} />
      </div>
    </button>
  );
}

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
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteVerificationCode, setDeleteVerificationCode] = useState("");
  const [deletingStep, setDeletingStep] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [notifSubTab, setNotifSubTab] = useState("settings");

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
    onMutate: async (id) => {
      await queryClient.cancelQueries(["notifications"]);
      const prev = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (old = []) => old.map(n => n.id === id ? { ...n, read: true } : n));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && queryClient.setQueryData(["notifications"], ctx.prev),
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(["notifications"]);
      const prev = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (old = []) => old.filter(n => n.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && queryClient.setQueryData(["notifications"], ctx.prev),
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id => base44.entities.Notification.update(id, { read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries(["user"]);
      const previousUser = queryClient.getQueryData(["user"]);
      queryClient.setQueryData(["user"], old => old ? { ...old, ...variables } : old);
      return { previousUser };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousUser) queryClient.setQueryData(["user"], context.previousUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
      setEditingProfile(false);
    },
  });

  const handleUserTypeChange = (value) => updateUserMutation.mutate({ user_type: value });
  const handleLogout = () => base44.auth.logout();

  const handleSendVerificationCode = async () => {
    setDeletingStep("sending");
    try {
      await base44.integrations.Core.SendEmail({
        to: user?.email,
        subject: "Confirm Your Account Deletion - UFixi",
        body: `A request to delete your UFixi account has been initiated. Please return to the app within 10 minutes and enter the verification code below.\n\nVerification Code: ${Math.random().toString().slice(2, 8).toUpperCase()}\n\nIf you did not request this, ignore this email.`
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
      if (user?.stripe_subscription_id) {
        await base44.functions.invoke('cancelSubscription', { subscriptionId: user.stripe_subscription_id });
      }
      await base44.auth.updateMe({ is_premium: false, subscription_tier: null, subscription_cancelled: true });
      queryClient.invalidateQueries(["user"]);
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveProfile = () => updateUserMutation.mutate({ display_name: displayName, bio });

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
          try {
            const locationData = await base44.integrations.Core.InvokeLLM({
              prompt: `Given coordinates: ${latitude}, ${longitude}, return ONLY the city and country. Format: "City, Country".`,
              add_context_from_internet: true
            });
            await updateUserMutation.mutateAsync({ location_latitude: latitude, location_longitude: longitude, approximate_location: locationData, location_services_enabled: true });
          } catch (error) {
            console.error("Location error:", error);
          } finally {
            setRequestingLocation(false);
          }
        },
        () => { setRequestingLocation(false); alert("Unable to access location."); }
      );
    } else {
      setRequestingLocation(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) markReadMutation.mutate(notification.id);
    if (notification.action_url) navigate(createPageUrl(notification.action_url));
  };

  const toggleNotifPref = (key) => {
    const prefs = user?.notification_preferences || {};
    updateUserMutation.mutate({ notification_preferences: { ...prefs, [key]: !(prefs[key] !== false) } });
  };

  const getPref = (key) => (user?.notification_preferences || {})[key] !== false;

  const unreadNotifications = notifications.filter(n => !n.read);
  const isPremium = user?.subscription_tier === "premium";

  const sectionStyle = { background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(0,23,47,0.1)' };

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      <LavaLampBackground />
      <PageHeader onMenuClick={() => setMenuOpen(true)} />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="max-w-lg mx-auto px-5 py-6 pb-12 relative z-10">

        {/* Custom Tab Bar */}
        <div className="flex rounded-2xl overflow-hidden mb-6 p-1 gap-1" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,23,47,0.08)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all min-h-[44px] relative"
              style={activeTab === tab.id
                ? { background: 'linear-gradient(135deg, #E8530A, #D93870)', color: '#fff' }
                : { color: '#6B7A8D' }}
            >
              {tab.label}
              {tab.id === "notifications" && unreadNotifications.length > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* ─── ACCOUNT TAB ─── */}
        {activeTab === "account" && (
          <div className="space-y-6">
            {/* Profile */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-5" style={sectionStyle}>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  {user?.profile_picture_url
                    ? <img src={user.profile_picture_url} alt="Profile" className="w-14 h-14 rounded-full object-cover shadow-lg" />
                    : <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'rgba(232,83,10,0.1)', border: '1px solid rgba(232,83,10,0.25)' }}>
                        <User className="w-7 h-7" style={{ color: '#E8530A' }} />
                      </div>
                  }
                  <label className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer shadow-lg ${uploadingPhoto ? "opacity-50" : ""}`} style={{ background: 'linear-gradient(135deg, #E8530A, #D93870)' }}>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    {uploadingPhoto ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
                  </label>
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold" style={{ color: '#00172F' }}>{user?.display_name || user?.full_name || "User"}</h2>
                  <p className="text-sm" style={{ color: '#6B7A8D' }}>{user?.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setEditingProfile(!editingProfile)} className="rounded-xl w-11 h-11">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>

              {editingProfile && (
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
                  <Button onClick={handleSaveProfile} disabled={updateUserMutation.isPending} className="w-full border-0 text-white" style={{ background: 'linear-gradient(135deg, #E8530A, #D93870)' }}>
                    {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}

              <div className="rounded-xl p-4" style={{ background: 'rgba(232,83,10,0.07)', border: '1px solid rgba(232,83,10,0.18)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <MapPin className={`w-5 h-5 mt-0.5 ${user?.location_services_enabled ? "text-[#E8530A]" : "text-slate-400"}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: '#1a2f42' }}>Location Services</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>
                        {user?.location_services_enabled && user?.approximate_location ? user.approximate_location : "Enable to find local tradespeople"}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={handleRequestLocation} disabled={requestingLocation} className="rounded-xl text-white border-0"
                    style={{ background: user?.location_services_enabled ? 'rgba(100,100,120,0.5)' : 'linear-gradient(135deg, #E8530A, #D93870)' }}>
                    {requestingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : user?.location_services_enabled ? "Update" : "Enable"}
                  </Button>
                </div>
              </div>

              {user?.bio && !editingProfile && <p className="text-sm mt-3 p-3 rounded-xl bg-slate-50" style={{ color: '#6B7A8D' }}>{user.bio}</p>}
            </motion.section>

            {/* User Type */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl p-5" style={sectionStyle}>
              <h3 className="font-semibold mb-4" style={{ color: '#00172F' }}>I am a...</h3>
              <RadioGroup value={user?.user_type || "renter"} onValueChange={handleUserTypeChange} className="space-y-3">
                {[
                  { value: "renter", label: "Renter", sub: "I rent my home", Icon: Building2, color: "#E8530A" },
                  { value: "homeowner", label: "Homeowner", sub: "I own my home", Icon: Home, color: "#D93870" },
                ].map(({ value, label, sub, Icon, color }) => (
                  <Label key={value} htmlFor={value} className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all"
                    style={{ borderColor: user?.user_type === value ? color : `${color}33`, background: user?.user_type === value ? `${color}12` : 'rgba(255,255,255,0.5)' }}>
                    <RadioGroupItem value={value} id={value} className="sr-only" />
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                      <Icon className="w-6 h-6" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: '#151528' }}>{label}</p>
                      <p className="text-sm" style={{ color: '#6B6A8E' }}>{sub}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: user?.user_type === value ? color : "#cbd5e1", background: user?.user_type === value ? color : "transparent" }}>
                      {user?.user_type === value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </motion.section>

            {/* Business Subscription */}
            {user?.account_type === 'business' && user?.subscription_tier === 'business' && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl p-5" style={sectionStyle}>
                <h3 className="font-semibold mb-4" style={{ color: '#00172F' }}>Business Subscription</h3>
                <div className="p-4 rounded-xl mb-3" style={{ background: 'rgba(232,83,10,0.07)', border: '1px solid rgba(232,83,10,0.18)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold" style={{ color: '#151528' }}>
                      {user?.business_plan ? `${user.business_plan.charAt(0).toUpperCase() + user.business_plan.slice(1)} Plan` : 'Business Plan'}
                    </span>
                    <span className="text-sm font-bold" style={{ color: '#E8530A' }}>£{user?.business_monthly_price || 0}/month</span>
                  </div>
                  {user?.subscription_cancelled && user?.subscription_cancel_at && (
                    <p className="text-sm text-orange-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Cancels on {new Date(user.subscription_cancel_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {!user?.subscription_cancelled && (
                  <Button onClick={() => setShowCancelDialog(true)} variant="outline" className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50">Cancel Subscription</Button>
                )}
              </motion.section>
            )}

            {/* Trades Account */}
            {user?.is_trades && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl p-5" style={sectionStyle}>
                <h3 className="font-semibold mb-2" style={{ color: '#00172F' }}>Account Type</h3>
                <p className="text-sm mb-4" style={{ color: '#6B7A8D' }}>You have a professional trades account. Switch to standard if you no longer want job requests.</p>
                <Button variant="outline" onClick={() => { if (confirm("Switch to standard account?")) updateUserMutation.mutate({ is_trades: false, trades_status: null }); }} disabled={updateUserMutation.isPending} className="w-full rounded-xl border-slate-200 hover:bg-slate-50">Switch to Standard Account</Button>
              </motion.section>
            )}

            {/* Legal */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl overflow-hidden" style={sectionStyle}>
              <button className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/40 min-h-[52px]">
                <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-[#E8530A]" /><span style={{ color: '#151528' }}>Privacy Policy</span></div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
              <div className="h-px" style={{ background: 'rgba(232,83,10,0.12)' }} />
              <button className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/40 min-h-[52px]">
                <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-[#D93870]" /><span style={{ color: '#151528' }}>Terms of Service</span></div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </motion.section>

            {/* Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
              <Button variant="outline" onClick={handleLogout} className="w-full h-12 rounded-xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
                <LogOut className="w-5 h-5 mr-2" />Log Out
              </Button>
              {(user?.is_premium || user?.subscription_tier === 'business') && !user?.subscription_cancelled && (
                <Button variant="outline" onClick={() => setShowCancelDialog(true)} className="w-full h-12 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 text-sm">Cancel Subscription</Button>
              )}
              <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="w-full h-12 rounded-xl text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                <Trash2 className="w-4 h-4 mr-2" />Delete Account
              </Button>
            </motion.div>
          </div>
        )}

        {/* ─── NOTIFICATIONS TAB ─── */}
        {activeTab === "notifications" && (
          <div className="space-y-5">
            {/* Sub-tabs */}
            <div className="flex rounded-xl overflow-hidden p-1 gap-1" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(0,23,47,0.08)' }}>
              {[{ id: "settings", label: "Settings" }, { id: "inbox", label: `Inbox${unreadNotifications.length > 0 ? ` (${unreadNotifications.length})` : ""}` }].map(t => (
                <button key={t.id} onClick={() => setNotifSubTab(t.id)} className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all min-h-[44px]"
                  style={notifSubTab === t.id ? { background: 'linear-gradient(135deg, #E8530A, #D93870)', color: '#fff' } : { color: '#6B7A8D' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {notifSubTab === "settings" && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-5 space-y-3" style={sectionStyle}>
                <h3 className="font-semibold mb-1" style={{ color: '#00172F' }}>Notification Preferences</h3>
                <p className="text-sm mb-3" style={{ color: '#6B7A8D' }}>Control how and when you receive notifications.</p>
                <ToggleRow label="Push Notifications" description="Receive alerts on your mobile device" isEnabled={getPref("push_enabled")} onToggle={() => toggleNotifPref("push_enabled")} />
                <ToggleRow label="Email Notifications" description="Receive updates to your inbox" isEnabled={getPref("email_enabled")} onToggle={() => toggleNotifPref("email_enabled")} />
                <ToggleRow label="Repair Reminder Alerts" description="Reminders for scheduled maintenance and follow-ups" isEnabled={getPref("reminders_enabled")} onToggle={() => toggleNotifPref("reminders_enabled")} />
                <ToggleRow label="Work Request Alerts" description="New job requests from tradespeople" isEnabled={getPref("workrequest_enabled")} onToggle={() => toggleNotifPref("workrequest_enabled")} />
                <ToggleRow label="Message Alerts" description="New messages from tradespeople" isEnabled={getPref("message_enabled")} onToggle={() => toggleNotifPref("message_enabled")} />
              </motion.section>
            )}

            {notifSubTab === "inbox" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold" style={{ color: '#00172F' }}>Recent Notifications</h3>
                  {unreadNotifications.length > 0 && (
                    <button onClick={() => markAllReadMutation.mutate()} className="text-sm font-medium min-h-[44px] px-3" style={{ color: '#E8530A' }}>Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,23,47,0.08)' }}>
                    <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p style={{ color: '#6B7A8D' }}>No notifications yet</p>
                  </div>
                ) : notifications.map(notification => {
                  const Icon = typeIcons[notification.type] || Info;
                  return (
                    <div key={notification.id} onClick={() => handleNotificationClick(notification)} className="rounded-2xl p-4 cursor-pointer transition-all" style={{ background: notification.read ? 'rgba(255,255,255,0.5)' : 'rgba(232,83,10,0.07)', border: notification.read ? '1px solid rgba(0,23,47,0.08)' : '1px solid rgba(232,83,10,0.25)' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,83,10,0.1)' }}>
                          <Icon className={`w-5 h-5 ${priorityColors[notification.priority]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-sm" style={{ color: notification.read ? '#6B7A8D' : '#1a2f42' }}>{notification.title}</h3>
                            <p className="text-xs whitespace-nowrap" style={{ color: '#6B7A8D' }}>{format(new Date(notification.created_date), "MMM d")}</p>
                          </div>
                          <p className="text-sm" style={{ color: notification.read ? '#6B7A8D' : '#1a2f42' }}>{notification.message}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!notification.read && (
                            <Button variant="ghost" size="icon" className="h-11 w-11" onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(notification.id); }}>
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-11 w-11 text-red-500" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notification.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}

        {/* ─── PREFERENCES TAB ─── */}
        {activeTab === "preferences" && (
          <div className="space-y-5">

            {/* Measurement Units */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-5" style={sectionStyle}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,83,10,0.1)' }}>
                  <Ruler className="w-5 h-5" style={{ color: '#E8530A' }} />
                </div>
                <h3 className="font-semibold" style={{ color: '#00172F' }}>Measurement Units</h3>
              </div>
              <div className="flex gap-3">
                {[{ value: "metric", label: "Metric", sub: "m, cm, kg" }, { value: "imperial", label: "Imperial", sub: "ft, in, lbs" }].map(({ value, label, sub }) => {
                  const selected = (user?.measurement_units || "metric") === value;
                  return (
                    <button key={value} onClick={() => updateUserMutation.mutate({ measurement_units: value })}
                      className="flex-1 p-4 rounded-xl border-2 transition-all text-center min-h-[70px]"
                      style={{ borderColor: selected ? '#E8530A' : 'rgba(232,83,10,0.2)', background: selected ? 'rgba(232,83,10,0.08)' : 'rgba(255,255,255,0.5)' }}>
                      <p className="font-semibold text-sm" style={{ color: selected ? '#E8530A' : '#1a2f42' }}>{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>{sub}</p>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            {/* Language & Currency */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl p-5" style={sectionStyle}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,83,10,0.1)' }}>
                  <Globe className="w-5 h-5" style={{ color: '#E8530A' }} />
                </div>
                <h3 className="font-semibold" style={{ color: '#00172F' }}>Language & Region</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm mb-1 block" style={{ color: '#6B7A8D' }}>Language</Label>
                  <MobileSelect
                    value={user?.language || "en"}
                    onChange={(val) => updateUserMutation.mutate({ language: val })}
                    placeholder="Language"
                    className="w-full mt-1"
                    options={[
                      { value: "en", label: "🇬🇧 English" },
                      { value: "es", label: "🇪🇸 Español" },
                      { value: "fr", label: "🇫🇷 Français" },
                      { value: "de", label: "🇩🇪 Deutsch" },
                    ]}
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block" style={{ color: '#6B7A8D' }}>Currency</Label>
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

            {/* Default Property Type */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl p-5" style={sectionStyle}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(217,56,112,0.1)' }}>
                  <Home className="w-5 h-5" style={{ color: '#D93870' }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: '#00172F' }}>Default Property Type</h3>
                  <p className="text-xs" style={{ color: '#6B7A8D' }}>Used when creating new diagnostic reports</p>
                </div>
              </div>
              <div className="flex gap-3">
                {[
                  { value: "renter", label: "Renter", Icon: Building2 },
                  { value: "homeowner", label: "Homeowner", Icon: Home },
                ].map(({ value, label, Icon }) => {
                  const selected = (user?.default_property_type || user?.user_type || "renter") === value;
                  return (
                    <button key={value} onClick={() => updateUserMutation.mutate({ default_property_type: value })}
                      className="flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-h-[60px]"
                      style={{ borderColor: selected ? '#D93870' : 'rgba(217,56,112,0.2)', background: selected ? 'rgba(217,56,112,0.08)' : 'rgba(255,255,255,0.5)' }}>
                      <Icon className="w-5 h-5" style={{ color: selected ? '#D93870' : '#94a3b8' }} />
                      <span className="font-semibold text-sm" style={{ color: selected ? '#D93870' : '#1a2f42' }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            <p className="text-center text-xs pb-4" style={{ color: '#6B7A8D' }}>UFixi v1.0.0</p>
          </div>
        )}
      </main>

      {/* Delete Account Dialog — App Store / Play Store compliant */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) { setDeleteStep(1); setDeleteConfirmText(""); } }}>
        <DialogContent className="max-w-md bg-white">
          {deleteStep === 1 && (
            <>
              <DialogHeader>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <DialogTitle className="text-center text-lg" style={{ color: '#1a2f42' }}>Delete Your Account?</DialogTitle>
                <DialogDescription className="text-center text-sm" style={{ color: '#6B7A8D' }}>
                  This is a permanent action and <strong>cannot be undone</strong>.
                </DialogDescription>
              </DialogHeader>

              <div className="my-3 rounded-xl p-4 space-y-2.5" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-2">What will be permanently deleted:</p>
                {[
                  "All your home issues and AI diagnostic history",
                  "Saved contractors and repair records",
                  "Your profile, preferences and settings",
                  "All personal data associated with your account",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    <p className="text-sm" style={{ color: '#1a2f42' }}>{item}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-3 mb-1" style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)' }}>
                <p className="text-xs" style={{ color: '#92400e' }}>
                  <strong>Active subscription?</strong> Please cancel it in Settings → Account before deleting your account to avoid further charges.
                </p>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col mt-2">
                <Button variant="destructive" className="w-full h-12" onClick={() => setDeleteStep(2)}>
                  I understand — continue
                </Button>
                <Button variant="outline" className="w-full h-12" onClick={() => setShowDeleteDialog(false)}>
                  Keep my account
                </Button>
              </DialogFooter>
            </>
          )}

          {deleteStep === 2 && (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: '#1a2f42' }}>Final Confirmation</DialogTitle>
                <DialogDescription style={{ color: '#6B7A8D' }}>
                  Type <strong className="text-red-500">DELETE</strong> in capitals to permanently delete your account and all associated data.
                </DialogDescription>
              </DialogHeader>
              <div className="my-4">
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  aria-label="Type DELETE to confirm account deletion"
                  className="h-12 bg-white border-red-200 focus:border-red-400 text-center font-bold tracking-widest text-red-600"
                  autoFocus
                />
              </div>
              <p className="text-xs text-center mb-4" style={{ color: '#6B7A8D' }}>
                Your data will be erased within 30 days in accordance with our Privacy Policy.
              </p>
              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  variant="destructive"
                  className="w-full h-12"
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== "DELETE"}
                  aria-label="Permanently delete my account"
                >
                  {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting account…</> : "Permanently Delete Account"}
                </Button>
                <Button variant="outline" className="w-full h-12" onClick={() => { setDeleteStep(1); setDeleteConfirmText(""); }} disabled={deleting}>
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
            <DialogDescription style={{ color: '#6B7A8D' }}>Your subscription stays active until end of billing period. Business features will be removed after that.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={cancelling}>Keep Subscription</Button>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={cancelling}>{cancelling ? "Cancelling..." : "Yes, Cancel"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}