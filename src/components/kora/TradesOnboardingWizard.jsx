import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Loader2, 
  Upload, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  FileCheck,
  CreditCard,
  Building2,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import AIProfilePreview from "./AIProfilePreview";

const STEPS = [
  { id: 1, title: "Business Details", icon: Briefcase },
  { id: 2, title: "Verification", icon: FileCheck },
  { id: 3, title: "Payment Setup", icon: CreditCard },
  { id: 4, title: "Company Profile", icon: Building2 }
];

export default function TradesOnboardingWizard({ onComplete }) {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [generatingProfile, setGeneratingProfile] = useState(false);
  const [aiProfile, setAiProfile] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  // Step 1: Business Details
  const [businessName, setBusinessName] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [location, setLocation] = useState("");
  const [yearsOperated, setYearsOperated] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [bio, setBio] = useState("");

  // Step 2: Verification Documents
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [insuranceUrl, setInsuranceUrl] = useState("");
  const [licenseFile, setLicenseFile] = useState(null);
  const [licenseUrl, setLicenseUrl] = useState("");
  const [certificationFile, setCertificationFile] = useState(null);
  const [certificationUrl, setCertificationUrl] = useState("");

  // Step 3: Bank Details
  const [accountName, setAccountName] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // Step 4: Company Profile
  const [hasCompany, setHasCompany] = useState("no");
  const [companyNumber, setCompanyNumber] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");

  const allSpecialties = ["plumbing", "electrical", "hvac", "carpentry", "roofing", "painting", "general", "appliances"];

  const toggleSpecialty = (specialty) => {
    if (specialties.includes(specialty)) {
      setSpecialties(specialties.filter(s => s !== specialty));
    } else {
      setSpecialties([...specialties, specialty]);
    }
  };

  const handleFileUpload = async (file, setter, urlSetter) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urlSetter(file_url);
      setter(file.name);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const isStep1Valid = businessName && serviceArea && specialties.length > 0;
  const isStep2Valid = insuranceUrl && licenseUrl;
  const isStep3Valid = accountName && sortCode && accountNumber;
  const isStep4Valid = hasCompany === "no" || (companyNumber && insuranceProvider);

  const handleGenerateProfile = async () => {
    setGeneratingProfile(true);
    try {
      const { data } = await base44.functions.invoke('generateTradesProfile', {
        businessName,
        specialties,
        yearsOperated,
        location,
        serviceArea,
        existingBio: bio,
        certifications: [] // Can be populated from verification step
      });
      setAiProfile(data);
      if (data.professional_bio) {
        setBio(data.professional_bio);
      }
    } catch (error) {
      console.error('Profile generation failed:', error);
    } finally {
      setGeneratingProfile(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      // Generate AI profile after step 1
      if (currentStep === 1 && !aiProfile) {
        await handleGenerateProfile();
      }
      
      setCurrentStep(currentStep + 1);
      
      // Save progress after each step
      await base44.auth.updateMe({
        trades_onboarding_step: currentStep + 1
      });
    } else {
      // Final submission
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setVerifying(true);
    
    try {
      const documents = [
        { type: "insurance", url: insuranceUrl, status: "pending" },
        { type: "license", url: licenseUrl, status: "pending" }
      ];
      
      if (certificationUrl) {
        documents.push({ type: "certification", url: certificationUrl, status: "pending" });
      }

      // Save profile first
      await base44.auth.updateMe({
        account_type: "trades",
        is_trades: true,
        trades_business_name: businessName,
        trades_service_area: serviceArea,
        trades_location: location,
        trades_years_operated: parseInt(yearsOperated) || 0,
        trades_specialties: specialties,
        trades_bio: bio,
        trades_verification_documents: documents,
        trades_bank_account_name: accountName,
        trades_bank_sort_code: sortCode,
        trades_bank_account_number: accountNumber,
        trades_company_number: hasCompany === "yes" ? companyNumber : null,
        trades_insurance_provider: insuranceProvider,
        trades_insurance_policy_number: policyNumber,
        trades_onboarding_completed: true,
        trades_status: "pending"
      });

      // Trigger AI verification
      const documentUrls = [insuranceUrl, licenseUrl];
      if (certificationUrl) documentUrls.push(certificationUrl);

      const { data } = await base44.functions.invoke('verifyTradesDocuments', {
        documentUrls,
        businessName,
        businessNumber: companyNumber
      });

      setVerificationResult(data);

      // If auto-approved, save additional AI profile data
      if (data.auto_approved && aiProfile) {
        await base44.auth.updateMe({
          trades_hourly_rate: aiProfile.suggested_hourly_rate_min || 50,
          trades_service_highlights: aiProfile.service_highlights,
          trades_seo_keywords: aiProfile.seo_keywords,
          professional_summary: aiProfile.professional_summary
        });
      }

      onComplete();
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600/85 via-pink-300/45 to-orange-500/85 animate-gradient-shift blur-3xl" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-orange-500/75 via-yellow-300/35 to-blue-500/75 animate-gradient-shift-slow blur-3xl" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-bl from-blue-500/65 via-pink-200/40 to-orange-500/70 animate-gradient-shift-reverse blur-3xl" />
      <div className="absolute inset-0 -z-10 bg-white/5" />

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

      <div className="relative space-y-6 p-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  currentStep >= step.id
                    ? "bg-[#F7B600] border-[#F7B600] text-[#0F1E2E]"
                    : "border-slate-200 text-slate-400"
                )}>
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 text-center",
                  currentStep >= step.id
                    ? "text-[#0F1E2E]"
                    : "text-slate-400"
                )}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 -mt-8",
                  currentStep > step.id
                    ? "bg-[#F7B600]"
                    : "bg-slate-200"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className={cn(
          "rounded-2xl p-6 border min-h-[400px] backdrop-blur-md",
          "bg-white/60 border-slate-200"
        )}>
        {/* Step 1: Business Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className={cn(
              "text-xl font-semibold mb-4",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Tell us about your business
            </h3>

            <div>
              <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                Business Name *
              </Label>
              <Input
                placeholder="Your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={cn(
                  "mt-1",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                  Location *
                </Label>
                <Input
                  placeholder="City/Town"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={cn(
                    "mt-1",
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-slate-200"
                  )}
                />
              </div>
              <div>
                <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                  Years Operating
                </Label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={yearsOperated}
                  onChange={(e) => setYearsOperated(e.target.value)}
                  className={cn(
                    "mt-1",
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-slate-200"
                  )}
                />
              </div>
            </div>

            <div>
              <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                Service Area *
              </Label>
              <Input
                placeholder="e.g., Greater London, 20 mile radius"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                className={cn(
                  "mt-1",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
              />
            </div>

            <div>
              <Label className={cn(
                "mb-2 block",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                Specialties * (select at least one)
              </Label>
              <div className="flex flex-wrap gap-2">
                {allSpecialties.map(specialty => (
                  <button
                    key={specialty}
                    onClick={() => toggleSpecialty(specialty)}
                    className={cn(
                      "px-3 py-2 rounded-lg border-2 text-sm capitalize transition-colors",
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                  Professional Bio
                </Label>
                {!aiProfile && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateProfile}
                    disabled={generatingProfile || !businessName || specialties.length === 0}
                    className="text-xs"
                  >
                    {generatingProfile ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Generate
                      </>
                    )}
                  </Button>
                )}
              </div>
              <Textarea
                placeholder="Tell customers about your experience and services..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={cn(
                  "mt-1 min-h-32",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
              />
              {aiProfile && (
                <div className={cn(
                  "mt-2 p-3 rounded-lg border text-xs",
                  theme === "dark"
                    ? "bg-green-900/20 border-green-500/30 text-green-300"
                    : "bg-green-50 border-green-200 text-green-700"
                )}>
                  <strong>✓ AI Profile Generated:</strong> Bio, service highlights, and pricing recommendations created. Review and edit as needed.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Verification */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={cn(
                  "text-xl font-semibold",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  Upload verification documents
                </h3>
                <p className={cn(
                  "text-sm mt-1",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  AI will analyze and verify your credentials automatically
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-[#F7B600]" />
            </div>

            <div>
              <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                Public Liability Insurance *
              </Label>
              <p className={cn(
                "text-xs mb-2",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
              )}>
                Valid insurance certificate with minimum £2 million coverage
              </p>
              {insuranceFile ? (
                <div className={cn(
                  "rounded-xl p-3 border flex items-center justify-between",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30"
                    : "bg-slate-50 border-slate-200"
                )}>
                  <span className={cn(
                    "text-sm truncate",
                    theme === "dark" ? "text-white" : "text-slate-900"
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
                  "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer",
                  theme === "dark"
                    ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                    : "border-slate-200 hover:bg-slate-50"
                )}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files[0], setInsuranceFile, setInsuranceUrl)}
                  />
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#57CFA4]" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-2 text-[#57CFA4]" />
                      <span className={cn(
                        "text-sm",
                        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                      )}>
                        Upload insurance certificate
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            <div>
              <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                Business License/Registration *
              </Label>
              <p className={cn(
                "text-xs mb-2",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
              )}>
                Proof of business registration or trade license
              </p>
              {licenseFile ? (
                <div className={cn(
                  "rounded-xl p-3 border flex items-center justify-between",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30"
                    : "bg-slate-50 border-slate-200"
                )}>
                  <span className={cn(
                    "text-sm truncate",
                    theme === "dark" ? "text-white" : "text-slate-900"
                  )}>{licenseFile}</span>
                  <button
                    onClick={() => { setLicenseFile(null); setLicenseUrl(""); }}
                    className="text-red-500 text-sm ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className={cn(
                  "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer",
                  theme === "dark"
                    ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                    : "border-slate-200 hover:bg-slate-50"
                )}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files[0], setLicenseFile, setLicenseUrl)}
                  />
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#57CFA4]" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-2 text-[#57CFA4]" />
                      <span className={cn(
                        "text-sm",
                        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                      )}>
                        Upload license/registration
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            <div>
              <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                Professional Certifications (optional)
              </Label>
              <p className={cn(
                "text-xs mb-2",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
              )}>
                Gas Safe, NICEIC, or other relevant certifications
              </p>
              {certificationFile ? (
                <div className={cn(
                  "rounded-xl p-3 border flex items-center justify-between",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30"
                    : "bg-slate-50 border-slate-200"
                )}>
                  <span className={cn(
                    "text-sm truncate",
                    theme === "dark" ? "text-white" : "text-slate-900"
                  )}>{certificationFile}</span>
                  <button
                    onClick={() => { setCertificationFile(null); setCertificationUrl(""); }}
                    className="text-red-500 text-sm ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className={cn(
                  "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer",
                  theme === "dark"
                    ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                    : "border-slate-200 hover:bg-slate-50"
                )}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files[0], setCertificationFile, setCertificationUrl)}
                  />
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#57CFA4]" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-2 text-[#57CFA4]" />
                      <span className={cn(
                        "text-sm",
                        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                      )}>
                        Upload certifications
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* AI Verification Preview */}
            {(insuranceUrl || licenseUrl) && (
              <div className={cn(
                "rounded-xl border p-4 text-sm",
                theme === "dark"
                  ? "bg-blue-900/20 border-blue-500/30"
                  : "bg-blue-50 border-blue-200"
              )}>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={cn(
                      "font-semibold mb-1",
                      theme === "dark" ? "text-blue-300" : "text-blue-700"
                    )}>
                      AI Document Analysis
                    </p>
                    <p className="text-xs text-slate-600">
                      Your documents will be automatically analyzed for authenticity, validity, and completeness. 
                      High-confidence documents may be auto-approved instantly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Bank Details */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className={cn(
              "text-xl font-semibold mb-4",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Payment setup
            </h3>

            <div className={cn(
              "rounded-xl p-4 border",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/30"
                : "bg-blue-50 border-blue-200"
            )}>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-blue-800"
              )}>
                <strong>Secure Payment Processing:</strong> Your bank details are encrypted and only used for receiving payments from completed jobs.
              </p>
            </div>

            <div>
              <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                Account Holder Name *
              </Label>
              <Input
                placeholder="Full name as it appears on bank account"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className={cn(
                  "mt-1",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                  Sort Code *
                </Label>
                <Input
                  placeholder="00-00-00"
                  value={sortCode}
                  onChange={(e) => setSortCode(e.target.value)}
                  className={cn(
                    "mt-1",
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-slate-200"
                  )}
                  maxLength={8}
                />
              </div>
              <div>
                <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                  Account Number *
                </Label>
                <Input
                  placeholder="12345678"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className={cn(
                    "mt-1",
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-slate-200"
                  )}
                  maxLength={8}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Company Profile */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className={cn(
              "text-xl font-semibold mb-4",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Final details
            </h3>

            {verificationResult && (
              <div className={cn(
                "rounded-xl border p-4",
                verificationResult.auto_approved
                  ? theme === "dark"
                    ? "bg-green-900/20 border-green-500/30"
                    : "bg-green-50 border-green-200"
                  : theme === "dark"
                    ? "bg-yellow-900/20 border-yellow-500/30"
                    : "bg-yellow-50 border-yellow-200"
              )}>
                <div className="flex items-start gap-3">
                  {verificationResult.auto_approved ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={cn(
                      "font-semibold mb-1",
                      verificationResult.auto_approved
                        ? "text-green-600"
                        : "text-yellow-600"
                    )}>
                      {verificationResult.auto_approved 
                        ? '✓ Documents Verified!' 
                        : 'Documents Under Review'
                      }
                    </p>
                    <p className="text-sm text-slate-600">
                      {verificationResult.reasoning}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Confidence: {verificationResult.confidence_score}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                Do you have a registered company?
              </Label>
              <RadioGroup value={hasCompany} onValueChange={setHasCompany} className="mt-2">
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="company-yes" />
                    <Label htmlFor="company-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="company-no" />
                    <Label htmlFor="company-no" className="cursor-pointer">No (sole trader)</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {hasCompany === "yes" && (
              <>
                <div>
                  <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                    Company Registration Number *
                  </Label>
                  <Input
                    placeholder="e.g., 12345678"
                    value={companyNumber}
                    onChange={(e) => setCompanyNumber(e.target.value)}
                    className={cn(
                      "mt-1",
                      theme === "dark"
                        ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                        : "bg-white border-slate-200"
                    )}
                  />
                </div>

                <div>
                  <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                    Insurance Provider *
                  </Label>
                  <Input
                    placeholder="e.g., Simply Business, Hiscox"
                    value={insuranceProvider}
                    onChange={(e) => setInsuranceProvider(e.target.value)}
                    className={cn(
                      "mt-1",
                      theme === "dark"
                        ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                        : "bg-white border-slate-200"
                    )}
                  />
                </div>

                <div>
                  <Label className={theme === "dark" ? "text-white" : "text-[#1E3A57]"}>
                    Policy Number
                  </Label>
                  <Input
                    placeholder="Insurance policy number"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    className={cn(
                      "mt-1",
                      theme === "dark"
                        ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                        : "bg-white border-slate-200"
                    )}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 1}
          className={cn(
            "rounded-xl",
            theme === "dark"
              ? "border-[#57CFA4]/30 text-[#57CFA4] hover:bg-[#57CFA4]/10"
              : "border-slate-200"
          )}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={
            verifying ||
            (currentStep === 1 && !isStep1Valid) ||
            (currentStep === 2 && !isStep2Valid) ||
            (currentStep === 3 && !isStep3Valid) ||
            (currentStep === 4 && !isStep4Valid)
          }
          className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] rounded-xl flex-1"
        >
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying Documents...
            </>
          ) : currentStep === 4 ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {verificationResult ? 'Finish' : 'Submit & AI Verify'}
            </>
          ) : currentStep === 1 && generatingProfile ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Profile...
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}