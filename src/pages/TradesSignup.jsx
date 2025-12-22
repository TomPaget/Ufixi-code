import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Upload, Loader2, CheckCircle2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function TradesSignup() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [businessName, setBusinessName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [registrationFile, setRegistrationFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [insuranceUrl, setInsuranceUrl] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // AI vetting process for insurance and registration
      const vetting = await base44.integrations.Core.InvokeLLM({
        prompt: `You are vetting a tradesperson application for QuoFix.

Business Name: ${data.businessName}
Specialty: ${data.specialty}
Location: ${data.location}

Analyze the provided documents:
1. Insurance Document
2. Company Registration Document

Check for:
- Valid insurance certificate with coverage details
- Current insurance dates (not expired)
- Proper business registration/license
- Company details match the application
- Professional certifications if applicable
- Document authenticity (not obviously fake/edited)

Return your assessment with detailed reasons.`,
        file_urls: [data.insuranceUrl, data.registrationUrl],
        response_json_schema: {
          type: "object",
          properties: {
            approved: { type: "boolean" },
            reason: { type: "string" },
            confidence: { type: "number" },
            insurance_valid: { type: "boolean" },
            registration_valid: { type: "boolean" }
          },
          required: ["approved", "reason", "confidence", "insurance_valid", "registration_valid"]
        }
      });

      // Update user
      await base44.auth.updateMe({
        account_type: "trades",
        trades_business_name: data.businessName,
        trades_specialty: data.specialty,
        trades_location: data.location,
        trades_insurance_url: data.insuranceUrl,
        trades_registration_url: data.registrationUrl,
        trades_verified: vetting.approved && vetting.confidence >= 0.75,
        trades_subscription_active: false
      });

      return vetting;
    },
    onSuccess: (vetting) => {
      queryClient.invalidateQueries(["user"]);
      if (vetting.approved && vetting.confidence >= 0.75) {
        navigate(createPageUrl("TradesPayment"));
      } else {
        navigate(createPageUrl("TradesPending"));
      }
    }
  });

  const handleInsuranceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setInsuranceUrl(file_url);
      setInsuranceFile(file.name);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRegistrationUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setRegistrationUrl(file_url);
      setRegistrationFile(file.name);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate({
      businessName,
      specialty,
      location,
      insuranceUrl,
      registrationUrl
    });
  };

  if (user?.account_type === "trades") {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        theme === "dark" ? "bg-[#1E3A57]" : "bg-white"
      )}>
        <div className="text-center max-w-md px-5">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h1 className={cn(
            "text-2xl font-bold mb-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Already Registered
          </h1>
          <p className={cn(
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
            Your trades account is {user.trades_status}
          </p>
          <Button onClick={() => navigate(createPageUrl("Home"))} className="mt-6">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#1E3A57]" : "bg-white"
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#1E3A57] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
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
          )}>Trades Account</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        <div className={cn(
          "rounded-2xl p-6 border-2 text-center",
          theme === "dark"
            ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
            : "bg-white border-[#1E3A57]/20"
        )}>
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-[#F7B600]" />
          <h2 className={cn(
            "text-xl font-bold mb-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>Become a Verified Tradesperson</h2>
          <p className={cn(
            "text-sm mb-4",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
            Connect with local customers and grow your business
          </p>
          <div className={cn(
            "inline-block px-4 py-2 rounded-xl font-bold border-2",
            theme === "dark"
              ? "bg-[#F7B600]/20 border-[#F7B600] text-[#F7B600]"
              : "bg-[#F7B600]/20 border-[#F7B600] text-[#F7B600]"
          )}>
            £2.99 / week
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={cn(
              "text-sm font-medium mb-1 block",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>
              Business Name
            </label>
            <Input
              placeholder="Your business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={cn(
                "border-2",
                theme === "dark"
                  ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                  : "bg-white border-[#1E3A57]/20"
              )}
            />
          </div>

          <div>
            <label className={cn(
              "text-sm font-medium mb-1 block",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>
              Specialty
            </label>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger className={cn(
                "border-2",
                theme === "dark"
                  ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                  : "bg-white border-[#1E3A57]/20"
              )}>
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="carpentry">Carpentry</SelectItem>
                <SelectItem value="roofing">Roofing</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="general">General Handyman</SelectItem>
                <SelectItem value="appliances">Appliances</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={cn(
              "text-sm font-medium mb-1 block",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>
              Service Location
            </label>
            <Input
              placeholder="City or region (e.g., London, Manchester)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={cn(
                "border-2",
                theme === "dark"
                  ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                  : "bg-white border-[#1E3A57]/20"
              )}
            />
          </div>

          <div>
            <label className={cn(
              "text-sm font-medium mb-2 block",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>
              Insurance Certificate *
            </label>
            <p className={cn(
              "text-xs mb-2",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>
              Upload valid public liability insurance
            </p>
            {insuranceFile ? (
              <div className={cn(
                "rounded-2xl p-4 border-2 flex items-center justify-between",
                theme === "dark"
                  ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
                  : "bg-white border-[#1E3A57]/20"
              )}>
                <span className={cn(
                  "text-sm truncate",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>{insuranceFile}</span>
                <button
                  onClick={() => { setInsuranceFile(null); setInsuranceUrl(""); }}
                  className="text-red-500 text-sm ml-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className={cn(
                "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer",
                theme === "dark"
                  ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                  : "border-[#1E3A57]/20 hover:bg-slate-50"
              )}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleInsuranceUpload} />
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#57CFA4]" />
                ) : (
                  <>
                    <Upload className={cn("w-6 h-6 mb-2", theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/50")} />
                    <span className={cn("text-sm", theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70")}>
                      Upload insurance
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          <div>
            <label className={cn(
              "text-sm font-medium mb-2 block",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>
              Company Registration *
            </label>
            <p className={cn(
              "text-xs mb-2",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>
              Upload business registration or license
            </p>
            {registrationFile ? (
              <div className={cn(
                "rounded-2xl p-4 border-2 flex items-center justify-between",
                theme === "dark"
                  ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
                  : "bg-white border-[#1E3A57]/20"
              )}>
                <span className={cn(
                  "text-sm truncate",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>{registrationFile}</span>
                <button
                  onClick={() => { setRegistrationFile(null); setRegistrationUrl(""); }}
                  className="text-red-500 text-sm ml-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className={cn(
                "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer",
                theme === "dark"
                  ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                  : "border-[#1E3A57]/20 hover:bg-slate-50"
              )}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleRegistrationUpload} />
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#57CFA4]" />
                ) : (
                  <>
                    <Upload className={cn("w-6 h-6 mb-2", theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/50")} />
                    <span className={cn("text-sm", theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70")}>
                      Upload registration
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!businessName || !specialty || !location || !insuranceUrl || !registrationUrl || submitMutation.isPending}
            className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57] h-12 rounded-2xl font-semibold"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying Documents...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>

          <p className={cn(
            "text-xs text-center",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
            Your application will be reviewed by our AI system for instant verification
          </p>
        </div>
      </main>
    </div>
  );
}