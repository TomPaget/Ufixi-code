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
  Clock,
  MapPin,
  Star,
  Briefcase,
  Calendar,
  Award,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Sparkles
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
  const [generatingAI, setGeneratingAI] = useState(null);

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
      
      // Generate AI caption
      const captionResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this image of tradesperson work and generate a short, professional caption (5-10 words) that describes what's shown.
        
Examples:
- "Kitchen sink installation completed"
- "New electrical panel upgrade"
- "Bathroom renovation project"
- "Custom carpentry shelving unit"

Be specific about the type of work shown.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            caption: { type: "string" }
          },
          required: ["caption"]
        }
      });
      
      setGallery([...gallery, { 
        url: file_url, 
        caption: captionResult.caption, 
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

  const { data: approvedTestimonials = [] } = useQuery({
    queryKey: ["testimonials", user?.id],
    queryFn: () => base44.entities.Testimonial.filter({
      tradesperson_id: user?.id,
      moderation_status: "approved"
    }),
    enabled: !!user
  });

  const { data: pendingTestimonials = [] } = useQuery({
    queryKey: ["pending-testimonials", user?.id],
    queryFn: () => base44.entities.Testimonial.filter({
      tradesperson_id: user?.id,
      moderation_status: "pending"
    }),
    enabled: !!user
  });

  const toggleSpecialty = (specialty) => {
    if (specialties.includes(specialty)) {
      setSpecialties(specialties.filter(s => s !== specialty));
    } else {
      setSpecialties([...specialties, specialty]);
    }
  };

  const generateBusinessName = async () => {
    setGeneratingAI("business_name");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional, catchy business name for a tradesperson with the following details:
        
Location: ${serviceArea || user?.trades_location || "UK"}
Specialties: ${specialties.join(", ") || "general trades"}
Years of experience: ${yearsOperated || "new business"}

Generate 1 business name that is:
- Professional and trustworthy
- Easy to remember
- Related to the services offered
- Includes location reference if appropriate

Examples: "Manchester Plumbing Pros", "Elite Electrical Solutions", "LocalFix Handyman Services"`,
        response_json_schema: {
          type: "object",
          properties: {
            business_name: { type: "string" }
          },
          required: ["business_name"]
        }
      });
      setBusinessName(result.business_name);
    } finally {
      setGeneratingAI(null);
    }
  };

  const generateBio = async () => {
    setGeneratingAI("bio");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a compelling, professional bio (2-3 sentences) for a tradesperson with these details:
        
Business name: ${businessName || "their business"}
Specialties: ${specialties.join(", ") || "general trades"}
Location: ${serviceArea || user?.trades_location || "local area"}
Years in business: ${yearsOperated || "new"}

The bio should:
- Sound professional and trustworthy
- Highlight experience and expertise
- Mention service area
- Be written in third person
- Be concise (50-80 words)`,
        response_json_schema: {
          type: "object",
          properties: {
            bio: { type: "string" }
          },
          required: ["bio"]
        }
      });
      setBio(result.bio);
    } finally {
      setGeneratingAI(null);
    }
  };

  const generateWorkingHours = async () => {
    setGeneratingAI("hours");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest optimal working hours for a ${specialties.join(", ") || "general"} tradesperson in the UK.
        
Consider:
- Standard UK business hours
- Common customer availability
- Industry norms for this trade
- Weekend availability (Saturday half-day, Sunday closed is common)

Format: "9:00 AM - 5:00 PM" or "Closed"`,
        response_json_schema: {
          type: "object",
          properties: {
            monday: { type: "string" },
            tuesday: { type: "string" },
            wednesday: { type: "string" },
            thursday: { type: "string" },
            friday: { type: "string" },
            saturday: { type: "string" },
            sunday: { type: "string" }
          },
          required: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        }
      });
      setWorkingHours(result);
    } finally {
      setGeneratingAI(null);
    }
  };

  const suggestSpecialties = async () => {
    setGeneratingAI("specialties");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on these current specialties: ${specialties.join(", ") || "none yet"}
        
Suggest 2-4 related specialties that commonly go together in the trades industry.

For example:
- If they do plumbing, suggest heating/boilers
- If they do electrical, suggest lighting/appliances
- If they do carpentry, suggest flooring/doors

Choose from: plumbing, electrical, hvac, carpentry, roofing, painting, general, appliances

Return as array of specialty strings.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_specialties: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["suggested_specialties"]
        }
      });
      
      // Add suggested specialties that aren't already selected
      const newSpecialties = result.suggested_specialties.filter(s => !specialties.includes(s));
      setSpecialties([...specialties, ...newSpecialties]);
    } finally {
      setGeneratingAI(null);
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
      trades_gallery: gallery
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
              <div className="flex items-center justify-between mb-2">
                <label className={cn(
                  "text-sm font-medium flex items-center gap-2",
                  theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                )}>
                  <Briefcase className="w-4 h-4" />
                  Business Name
                </label>
                <button
                  onClick={generateBusinessName}
                  disabled={generatingAI === "business_name"}
                  className={cn(
                    "flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors",
                    theme === "dark"
                      ? "bg-[#F7B600]/20 text-[#F7B600] hover:bg-[#F7B600]/30"
                      : "bg-[#F7B600]/10 text-[#F7B600] hover:bg-[#F7B600]/20"
                  )}
                >
                  {generatingAI === "business_name" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI Suggest
                </button>
              </div>
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
              <div className="flex items-center justify-between mb-2">
                <label className={cn(
                  "text-sm font-medium",
                  theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                )}>
                  About Your Business
                </label>
                <button
                  onClick={generateBio}
                  disabled={generatingAI === "bio"}
                  className={cn(
                    "flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors",
                    theme === "dark"
                      ? "bg-[#F7B600]/20 text-[#F7B600] hover:bg-[#F7B600]/30"
                      : "bg-[#F7B600]/10 text-[#F7B600] hover:bg-[#F7B600]/20"
                  )}
                >
                  {generatingAI === "bio" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI Generate
                </button>
              </div>
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
              <div className="flex items-center justify-between mb-2">
                <label className={cn(
                  "text-sm font-medium flex items-center gap-2",
                  theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                )}>
                  <Award className="w-4 h-4" />
                  Specialties
                </label>
                <button
                  onClick={suggestSpecialties}
                  disabled={generatingAI === "specialties"}
                  className={cn(
                    "flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors",
                    theme === "dark"
                      ? "bg-[#F7B600]/20 text-[#F7B600] hover:bg-[#F7B600]/30"
                      : "bg-[#F7B600]/10 text-[#F7B600] hover:bg-[#F7B600]/20"
                  )}
                >
                  {generatingAI === "specialties" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI Suggest
                </button>
              </div>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Set your weekly schedule
              </p>
              <button
                onClick={generateWorkingHours}
                disabled={generatingAI === "hours"}
                className={cn(
                  "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors",
                  theme === "dark"
                    ? "bg-[#F7B600]/20 text-[#F7B600] hover:bg-[#F7B600]/30"
                    : "bg-[#F7B600]/10 text-[#F7B600] hover:bg-[#F7B600]/20"
                )}
              >
                {generatingAI === "hours" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                AI Suggest Hours
              </button>
            </div>
            
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
          <div className="space-y-6">
            {/* Pending Reviews */}
            {pendingTestimonials.length > 0 && (
              <div>
                <h3 className={cn(
                  "font-semibold mb-3 flex items-center gap-2",
                  theme === "dark" ? "text-[#F7B600]" : "text-[#1E3A57]"
                )}>
                  <AlertTriangle className="w-5 h-5" />
                  Pending Review ({pendingTestimonials.length})
                </h3>
                <div className="space-y-3">
                  {pendingTestimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className={cn(
                        "rounded-2xl p-4 border-2",
                        theme === "dark"
                          ? "bg-[#1A2F42] border-[#F7B600]/30"
                          : "bg-amber-50 border-amber-200"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className={cn(
                            "font-semibold",
                            theme === "dark" ? "text-white" : "text-[#1E3A57]"
                          )}>
                            {testimonial.customer_name}
                          </p>
                          <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={cn(
                                  "w-4 h-4",
                                  star <= testimonial.rating
                                    ? "fill-[#F7B600] text-[#F7B600]"
                                    : "text-slate-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          theme === "dark"
                            ? "bg-[#F7B600]/20 text-[#F7B600]"
                            : "bg-amber-100 text-amber-700"
                        )}>
                          Under Review
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm",
                        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                      )}>
                        {testimonial.comment}
                      </p>
                      {testimonial.moderation_flags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {testimonial.moderation_flags.map((flag, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600"
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Reviews */}
            <div>
              <h3 className={cn(
                "font-semibold mb-3 flex items-center gap-2",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]"
              )}>
                <CheckCircle2 className="w-5 h-5" />
                Published Reviews ({approvedTestimonials.length})
              </h3>
              {approvedTestimonials.length === 0 ? (
                <div className={cn(
                  "text-center py-8 rounded-2xl border-2",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/30"
                    : "bg-white border-slate-200"
                )}>
                  <Star className={cn(
                    "w-12 h-12 mx-auto mb-3",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
                  )} />
                  <p className={cn(
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    No reviews yet
                  </p>
                  <p className={cn(
                    "text-sm mt-1",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                  )}>
                    Customer reviews will appear here after moderation
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedTestimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className={cn(
                        "rounded-2xl p-4 border-2",
                        theme === "dark"
                          ? "bg-[#1A2F42] border-[#57CFA4]/30"
                          : "bg-white border-slate-200"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className={cn(
                            "font-semibold",
                            theme === "dark" ? "text-white" : "text-[#1E3A57]"
                          )}>
                            {testimonial.customer_name}
                          </p>
                          <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={cn(
                                  "w-4 h-4",
                                  star <= testimonial.rating
                                    ? "fill-[#F7B600] text-[#F7B600]"
                                    : "text-slate-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <span className={cn(
                          "text-xs",
                          theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                        )}>
                          Score: {testimonial.moderation_score}/100
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm",
                        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                      )}>
                        {testimonial.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={cn(
              "rounded-2xl p-4 border-2",
              theme === "dark"
                ? "bg-[#1A2F42]/50 border-[#57CFA4]/20"
                : "bg-slate-50 border-slate-200"
            )}>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                <strong>Note:</strong> All customer testimonials are automatically moderated by AI for profanity, fake reviews, and inappropriate content before publication.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}