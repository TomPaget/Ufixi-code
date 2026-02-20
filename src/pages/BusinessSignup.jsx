import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/kora/PageHeader";
import HamburgerMenu from "@/components/kora/HamburgerMenu";
import { Building2, Users, MapPin, Briefcase, Sparkles, ChevronRight } from "lucide-react";

const PLAN_DETAILS = {
  starter: { name: "Starter", price: 12.99 },
  pro: { name: "Pro", price: 14.99 },
  enterprise: { name: "Enterprise", price: 19.99 }
};

const BUSINESS_TYPES = [
  { value: "estate_agent", label: "Estate Agent" },
  { value: "property_management", label: "Property Management" },
  { value: "letting_agent", label: "Letting Agent" },
  { value: "construction", label: "Construction / Developer" },
  { value: "facilities", label: "Facilities Management" },
  { value: "other", label: "Other" }
];

export default function BusinessSignup() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const planKey = urlParams.get("plan") || "pro";
  const plan = PLAN_DETAILS[planKey] || PLAN_DETAILS.pro;

  const [form, setForm] = useState({
    companyName: "",
    businessType: "",
    teamSize: "",
    location: "",
    contactEmail: ""
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const isValid = form.companyName && form.businessType && form.teamSize;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await base44.auth.updateMe({
        company_name: form.companyName,
        business_type: form.businessType,
        team_size: form.teamSize,
        company_location: form.location,
        account_type: "business"
      });

      const { data } = await base44.functions.invoke("createStripeCheckout", {
        planType: planKey,
        planName: `${plan.name} Plan`,
        price: plan.price,
        accountType: "business"
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "linear-gradient(160deg, #B8D8D8 0%, #C8D8E8 40%, #D0D8E8 70%, #C8D0E0 100%)" }}>
      <PageHeader showBack title="Set Up Your Business" onMenuClick={() => setMenuOpen(true)} />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="max-w-lg mx-auto px-5 py-8 space-y-6">
        {/* Selected Plan Badge */}
        <div className="flex items-center justify-between rounded-2xl px-5 py-4" style={{ background: "linear-gradient(135deg, #6ECBA6 0%, #4BA8C8 100%)", boxShadow: "0 4px 20px rgba(75,200,150,0.3)" }}>
          <div>
            <p className="text-xs font-semibold text-white/70">Selected Plan</p>
            <p className="text-xl font-bold text-white">{plan.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">£{plan.price}</p>
            <p className="text-xs text-white/70">/month</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-lg" style={{ color: "#1a2f42" }}>Tell us about your business</h2>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#1a2f42" }}>
              <Building2 className="w-4 h-4 text-[#4BC896]" />
              Company Name *
            </Label>
            <Input
              placeholder="e.g., Smith & Co Estate Agents"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#1a2f42" }}>
              <Briefcase className="w-4 h-4 text-[#4BC896]" />
              Business Type *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, businessType: t.value })}
                  className="text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                  style={{
                    borderColor: form.businessType === t.value ? "#4BC896" : "#e2e8f0",
                    background: form.businessType === t.value ? "rgba(75,200,150,0.08)" : "#fff",
                    color: form.businessType === t.value ? "#1a2f42" : "#6B7A8D"
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#1a2f42" }}>
              <Users className="w-4 h-4 text-[#4BC896]" />
              Team Size *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {["1–5 people", "6–10 people", "11–25 people", "25+ people"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setForm({ ...form, teamSize: size })}
                  className="text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                  style={{
                    borderColor: form.teamSize === size ? "#4BC896" : "#e2e8f0",
                    background: form.teamSize === size ? "rgba(75,200,150,0.08)" : "#fff",
                    color: form.teamSize === size ? "#1a2f42" : "#6B7A8D"
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#1a2f42" }}>
              <MapPin className="w-4 h-4 text-[#4BC896]" />
              Location <span className="font-normal text-xs" style={{ color: "#6B7A8D" }}>(optional)</span>
            </Label>
            <Input
              placeholder="e.g., London, Manchester..."
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* Summary & CTA */}
        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: "#6B7A8D" }}>
            Cancel anytime. No hidden fees. Secure payment via Stripe.
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: isValid ? "#4BC896" : "#c8d0da" }}
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Continue to Payment
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}