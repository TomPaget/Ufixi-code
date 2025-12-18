import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Upload, 
  Loader2, 
  X, 
  Plus,
  Clock,
  MapPin,
  Star,
  Briefcase,
  Calendar,
  Award,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function TradesProfile() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [yearsOperated, setYearsOperated] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [workingHours, setWorkingHours] = useState({
    monday: "9:00 AM - 5:00 PM",
    tuesday: "9:00 AM - 5:00 PM",
    wednesday: "9:00 AM - 5:00 PM",
    thursday: "9:00 AM - 5:00 PM",
    friday: "9:00 AM - 5:00 PM",
    saturday: "Closed",
    sunday: "Closed"
  });
  const [gallery, setGallery] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    if (user) {
      setBusinessName(user.trades_business_name || "");
      setBio(user.trades_bio || "");
      setServiceArea(user.trades_service_area || user.trades_location || "");
      setYearsOperated(user.trades_years_operated?.toString() || "");
      setSpecialties(user.trades_specialties || [user.trades_specialty].filter(Boolean));
      setWorkingHours(user.trades_working_hours || workingHours);
      setGallery(user.trades_gallery || []);
      setTestimonials(user.trades_testimonials || []);
    }
  }, [user]);

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
      setGallery([...gallery, { 
        url: file_url, 
        caption: "", 
        date: new Date().toISOString().split("T")[0]
      }]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setGallery(gallery.filter((_, i) => i !== index));
  };

  const updateImageCaption = (index, caption) => {
    const updated = [...gallery];
    updated[index].caption = caption;
    setGallery(updated);
  };

  const addTestimonial = () => {
    setTestimonials([...testimonials, {
      customer_name: "",
      rating: 5,
      comment: "",
      date: new Date().toISOString().split("T")[0]
    }]);
  };

  const updateTestimonial = (index, field, value) => {
    const updated = [...testimonials];
    updated[index][field] = value;
    setTestimonials(updated);
  };

  const removeTestimonial = (index) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };

  const toggleSpecialty = (specialty) => {
    if (specialties.includes(specialty)) {
      setSpecialties(specialties.filter(s => s !== specialty));
    } else {
      setSpecialties([...specialties, specialty]);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      trades_business_name: businessName,
      trades_bio: bio,
      trades_service_area: serviceArea,
      trades_years_operated: parseInt(yearsOperated) || 0,
      trades_specialties: specialties,
      trades_working_hours: workingHours,
      trades_gallery: gallery,
      trades_testimonials: testimonials
    });
  };

  if (!user || user.account_type !== "trades") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1E2E]">
        <div className="text-center text-white">
          <p>Access restricted to trades accounts</p>
          <Button onClick={() => navigate(createPageUrl("Home"))} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const allSpecialties = ["plumbing", "electrical", "hvac", "carpentry", "roofing", "painting", "general", "appliances"];

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-xl",
                theme === "dark"
                  ? "hover:bg-[#57CFA4]/20 text-[#57CFA4]"
                  : "hover:bg-slate-100 text-[#1E3A57]"
              )}
              onClick={() => navigate(createPageUrl("Home"))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={cn(
              "font-bold text-lg",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>My Profile</h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] font-semibold"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className={cn(
        "sticky top-[73px] z-20 border-b",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]/30" : "bg-white border-slate-200"
      )}>
        <div className="max-w-lg mx-auto px-5 flex gap-1">
          {[
            { id: "info", label: "Info", icon: Briefcase },
            { id: "hours", label: "Hours", icon: Clock },
            { id: "gallery", label: "Gallery", icon: ImageIcon },
            { id: "testimonials", label: "Reviews", icon: Star }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors",
                activeTab === tab.id
                  ? theme === "dark"
                    ? "border-[#F7B600] text-[#F7B600]"
                    : "border-[#1E3A57] text-[#1E3A57]"
                  : theme === "dark"
                    ? "border-transparent text-[#57CFA4]"
                    : "border-transparent text-slate-500"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Basic Info Tab */}
        {activeTab === "info" && (
          <>
            <div>
              <label className={cn(
                "text-sm font-medium mb-2 block flex items-center gap-2",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                <Briefcase className="w-4 h-4" />
                Business Name
              </label>
              <Input
                placeholder="Your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={cn(
                  "border-2",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                    : "bg-white border-[#1E3A57]/20"
                )}
              />
            </div>

            <div>
              <label className={cn(
                "text-sm font-medium mb-2 block",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                About Your Business
              </label>
              <Textarea
                placeholder="Tell customers about your business, experience, and what makes you stand out..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={cn(
                  "border-2 min-h-32",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                    : "bg-white border-[#1E3A57]/20"
                )}
              />
            </div>

            <div>
              <label className={cn(
                "text-sm font-medium mb-2 block flex items-center gap-2",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                <MapPin className="w-4 h-4" />
                Service Area
              </label>
              <Input
                placeholder="e.g., Greater London, 20 mile radius from Manchester"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                className={cn(
                  "border-2",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                    : "bg-white border-[#1E3A57]/20"
                )}
              />
            </div>

            <div>
              <label className={cn(
                "text-sm font-medium mb-2 block flex items-center gap-2",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                <Calendar className="w-4 h-4" />
                Years in Business
              </label>
              <Input
                type="number"
                placeholder="e.g., 10"
                value={yearsOperated}
                onChange={(e) => setYearsOperated(e.target.value)}
                className={cn(
                  "border-2",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                    : "bg-white border-[#1E3A57]/20"
                )}
              />
            </div>

            <div>
              <label className={cn(
                "text-sm font-medium mb-2 block flex items-center gap-2",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                <Award className="w-4 h-4" />
                Specialties
              </label>
              <div className="flex flex-wrap gap-2">
                {allSpecialties.map(specialty => (
                  <button
                    key={specialty}
                    onClick={() => toggleSpecialty(specialty)}
                    className={cn(
                      "px-4 py-2 rounded-xl border-2 font-medium text-sm capitalize transition-colors",
                      specialties.includes(specialty)
                        ? "bg-[#F7B600] border-[#F7B600] text-[#0F1E2E]"
                        : theme === "dark"
                          ? "border-[#57CFA4]/30 text-[#57CFA4] hover:bg-[#57CFA4]/10"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Working Hours Tab */}
        {activeTab === "hours" && (
          <div className="space-y-3">
            {Object.entries(workingHours).map(([day, hours]) => (
              <div key={day}>
                <label className={cn(
                  "text-sm font-medium mb-1 block capitalize",
                  theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                )}>
                  {day}
                </label>
                <Input
                  placeholder="e.g., 9:00 AM - 5:00 PM or Closed"
                  value={hours}
                  onChange={(e) => setWorkingHours({ ...workingHours, [day]: e.target.value })}
                  className={cn(
                    "border-2",
                    theme === "dark"
                      ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                      : "bg-white border-[#1E3A57]/20"
                  )}
                />
              </div>
            ))}
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === "gallery" && (
          <div className="space-y-4">
            <label className={cn(
              "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer",
              theme === "dark"
                ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                : "border-slate-200 hover:bg-slate-50"
            )}>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#57CFA4]" />
              ) : (
                <>
                  <Upload className={cn("w-8 h-8 mb-2", theme === "dark" ? "text-[#57CFA4]" : "text-slate-400")} />
                  <span className={cn("text-sm", theme === "dark" ? "text-[#57CFA4]" : "text-slate-600")}>
                    Upload work photo
                  </span>
                </>
              )}
            </label>

            <div className="grid grid-cols-2 gap-3">
              {gallery.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-2xl overflow-hidden border-2 relative",
                    theme === "dark" ? "border-[#57CFA4]/30" : "border-slate-200"
                  )}
                >
                  <img src={item.url} alt={item.caption} className="w-full h-40 object-cover" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className={cn(
                    "p-2",
                    theme === "dark" ? "bg-[#1A2F42]" : "bg-white"
                  )}>
                    <Input
                      placeholder="Add caption..."
                      value={item.caption}
                      onChange={(e) => updateImageCaption(index, e.target.value)}
                      className={cn(
                        "text-xs border",
                        theme === "dark"
                          ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                          : "bg-white border-slate-200"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials Tab */}
        {activeTab === "testimonials" && (
          <div className="space-y-4">
            <Button
              onClick={addTestimonial}
              className="w-full border-2 border-dashed gap-2 bg-transparent hover:bg-[#57CFA4]/10 text-[#57CFA4] border-[#57CFA4]/30"
            >
              <Plus className="w-4 h-4" />
              Add Testimonial
            </Button>

            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-2xl p-4 border-2 space-y-3",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/30"
                    : "bg-white border-slate-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Customer name"
                    value={testimonial.customer_name}
                    onChange={(e) => updateTestimonial(index, "customer_name", e.target.value)}
                    className={cn(
                      "flex-1 border-2",
                      theme === "dark"
                        ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                        : "bg-white border-slate-200"
                    )}
                  />
                  <button
                    onClick={() => removeTestimonial(index)}
                    className="ml-2 text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => updateTestimonial(index, "rating", star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "w-5 h-5",
                            star <= testimonial.rating
                              ? "fill-[#F7B600] text-[#F7B600]"
                              : theme === "dark"
                                ? "text-[#57CFA4]/30"
                                : "text-slate-300"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  placeholder="Customer feedback..."
                  value={testimonial.comment}
                  onChange={(e) => updateTestimonial(index, "comment", e.target.value)}
                  className={cn(
                    "border-2 min-h-20",
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-slate-200"
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}