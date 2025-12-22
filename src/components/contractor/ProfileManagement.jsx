import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { Loader2, Save, Upload, Star } from "lucide-react";

export default function ProfileManagement({ user }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    trades_business_name: user?.trades_business_name || "",
    trades_bio: user?.trades_bio || "",
    trades_phone: user?.trades_phone || "",
    trades_website: user?.trades_website || "",
    trades_hourly_rate: user?.trades_hourly_rate || "",
    profile_picture_url: user?.profile_picture_url || ""
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, profile_picture_url: file_url });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className={cn(
      "rounded-2xl p-6 border",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={cn(
          "text-xl font-bold",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Profile Information
        </h2>
        {user?.trades_rating && (
          <div className="flex items-center gap-1 text-[#F7B600]">
            <Star className="w-5 h-5 fill-current" />
            <span className="font-bold">{user.trades_rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div>
          <Label className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
            Profile Picture
          </Label>
          <div className="flex items-center gap-4 mt-2">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center overflow-hidden",
              theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-100"
            )}>
              {formData.profile_picture_url ? (
                <img src={formData.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className={cn(
                  "text-2xl font-bold",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
                )}>
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <div className="px-4 py-2 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] rounded-xl font-medium flex items-center gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Photo
              </div>
            </label>
          </div>
        </div>

        {/* Business Name */}
        <div>
          <Label htmlFor="business_name" className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
            Business Name
          </Label>
          <Input
            id="business_name"
            value={formData.trades_business_name}
            onChange={(e) => setFormData({ ...formData, trades_business_name: e.target.value })}
            className={cn(
              "mt-2",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                : "bg-white border-slate-200"
            )}
          />
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio" className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
            Professional Bio
          </Label>
          <Textarea
            id="bio"
            value={formData.trades_bio}
            onChange={(e) => setFormData({ ...formData, trades_bio: e.target.value })}
            rows={4}
            className={cn(
              "mt-2",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                : "bg-white border-slate-200"
            )}
            placeholder="Describe your experience, specialties, and what makes you unique..."
          />
        </div>

        {/* Contact Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone" className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.trades_phone}
              onChange={(e) => setFormData({ ...formData, trades_phone: e.target.value })}
              className={cn(
                "mt-2",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>
          <div>
            <Label htmlFor="website" className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
              Website (optional)
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.trades_website}
              onChange={(e) => setFormData({ ...formData, trades_website: e.target.value })}
              className={cn(
                "mt-2",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Hourly Rate */}
        <div>
          <Label htmlFor="rate" className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
            Hourly Rate (£)
          </Label>
          <Input
            id="rate"
            type="number"
            min="0"
            step="0.01"
            value={formData.trades_hourly_rate}
            onChange={(e) => setFormData({ ...formData, trades_hourly_rate: parseFloat(e.target.value) })}
            className={cn(
              "mt-2",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                : "bg-white border-slate-200"
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-white"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </form>
    </div>
  );
}