import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/kora/PageHeader";
import {
  Building2,
  CheckCircle2,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  Clock,
  Shield,
  BarChart3,
  Home
} from "lucide-react";
import HamburgerMenu from "@/components/kora/HamburgerMenu";

const plans = [
  {
    name: "Starter",
    price: 12.99,
    icon: Building2,
    color: "from-slate-900 to-slate-950",
    features: [
      "5 team members",
      "No ads",
      "Unlimited scans",
      "2x faster scans",
      "AI diagnostics",
      "Cost estimates",
      "Mobile access"
    ]
  },
  {
    name: "Pro",
    price: 14.99,
    icon: Zap,
    color: "from-slate-700 to-slate-900",
    popular: true,
    features: [
      "All Starter +",
      "10 team members",
      "3x faster scans",
      "Priority support",
      "Priority AI",
      "Repair reports",
      "Export & share",
      "Cost breakdowns"
    ]
  },
  {
    name: "Enterprise",
    price: 19.99,
    icon: TrendingUp,
    color: "from-slate-800 to-slate-950",
    features: [
      "All Pro +",
      "25 team members",
      "5x faster scans",
      "No ads",
      "Analytics dash",
      "Priority support",
      "Integrations",
      "Account manager"
    ]
  }
];

export default function BusinessPricing() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan) => {
      await base44.auth.updateMe({
        subscription_tier: "business",
        business_plan: plan.name.toLowerCase(),
        business_monthly_price: plan.price,
        company_name: companyName,
        account_type: "business"
      });
    },
    onSuccess: () => {
      navigate(createPageUrl("Home"));
    }
  });

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleSubscribe = async () => {
    if (selectedPlan && companyName) {
      try {
        // Save company name first
        await base44.auth.updateMe({
          company_name: companyName,
          account_type: "business"
        });

        // Create Stripe checkout session
        const { data } = await base44.functions.invoke('createStripeCheckout', {
          planType: selectedPlan.name.toLowerCase(),
          planName: `${selectedPlan.name} Plan`,
          price: selectedPlan.price,
          accountType: 'business'
        });

        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (error) {
        console.error('Checkout error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-[#F5F7FA]">
      <PageHeader onMenuClick={() => setMenuOpen(true)} />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="max-w-6xl mx-auto px-5 py-12 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-[#4BC896]/10 border-[#4BC896]/20" style={{ color: '#1a2f42' }}>
            <Building2 className="w-4 h-4 text-[#4BC896]" />
            <span className="text-sm font-semibold">For Estate Agents & Businesses</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold" style={{ color: '#1a2f42' }}>
            Property Issues?<br />
            <span style={{ color: '#4BC896' }}>Instant Answers.</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto font-medium" style={{ color: '#6B7A8D' }}>
            See a problem during a viewing? Need a quick explanation for your client? 
            UFixi gives you instant, professional property diagnostics on the spot.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-3 gap-2 mb-16 items-center">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan?.name === plan.name;
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border-2 transition-all cursor-pointer p-3 bg-white shadow-sm",
                  plan.popular ? "pt-8" : "",
                  isSelected ? "border-[#4BC896] shadow-lg shadow-[#4BC896]/20" : "border-slate-100 hover:border-[#4BC896]/40 hover:shadow-md",
                  plan.popular && "z-10"
                )}
                style={plan.popular ? { boxShadow: '0 0 0 3px rgba(75,200,150,0.12), 0 0 20px 4px rgba(75,200,150,0.15), 0 4px 16px rgba(0,0,0,0.08)' } : {}}
                onClick={() => handleSelectPlan(plan)}
              >
                {plan.popular && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-full flex justify-center px-1">
                    <span className="bg-[#4BC896] text-white px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                      Popular
                    </span>
                  </div>
                )}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-[#4BC896]/10">
                  <Icon className="w-4 h-4 text-[#4BC896]" />
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ color: '#1a2f42' }}>{plan.name}</h3>
                <div className="mb-3">
                  <span className="text-xl font-bold" style={{ color: '#1a2f42' }}>£{plan.price}</span>
                  <span className="text-[10px] font-medium block" style={{ color: '#6B7A8D' }}>/month</span>
                </div>
                <ul className="space-y-1.5 mb-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5 text-[#4BC896]" />
                      <span className="text-[10px] font-medium leading-tight" style={{ color: '#1a2f42' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={cn(
                    "w-full text-[11px] font-semibold py-1.5 rounded-lg transition-colors",
                    isSelected ? "bg-[#4BC896] text-white" : "bg-[#1a2f42] text-white"
                  )}
                >
                  {isSelected ? "Selected" : "Select"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Use Cases */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { icon: Home, text: "Spot issues during viewings" },
            { icon: Clock, text: "Get instant cost estimates" },
            { icon: BarChart3, text: "Build trust with clients" }
          ].map((item, i) => (
            <div key={i} className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm text-center">
              <item.icon className="w-8 h-8 mx-auto mb-2 text-[#4BC896]" />
              <p className="text-sm font-semibold" style={{ color: '#1a2f42' }}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Company Details Form */}
        {selectedPlan && (
          <div className="max-w-2xl mx-auto rounded-2xl border p-8 bg-white border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a2f42' }}>Complete Your Subscription</h2>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block" style={{ color: '#1a2f42' }}>Company Name *</Label>
                <Input placeholder="e.g., Smith & Co Estate Agents" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="border-slate-200" />
              </div>
              <div>
                <Label className="mb-2 block" style={{ color: '#1a2f42' }}>Contact Email</Label>
                <Input type="email" placeholder="your.email@company.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} defaultValue={user?.email} className="border-slate-200" />
              </div>
              <div className="p-4 rounded-xl border bg-[#4BC896]/5 border-[#4BC896]/20">
                <p className="text-sm" style={{ color: '#1a2f42' }}>
                  <strong>Selected Plan:</strong> {selectedPlan.name} - £{selectedPlan.price}/month
                </p>
                <p className="text-xs mt-2" style={{ color: '#6B7A8D' }}>Cancel anytime. No hidden fees.</p>
              </div>
              <Button onClick={handleSubscribe} disabled={!companyName} className="w-full bg-[#4BC896] hover:bg-[#2eaf7d] text-white h-12 font-semibold">
                <Sparkles className="w-5 h-5 mr-2" />
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {/* Social Proof */}
        <div className="text-center p-8 rounded-2xl border bg-white border-slate-100 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-[#4BC896]" />
            <h3 className="font-semibold" style={{ color: '#1a2f42' }}>Trusted by Estate Agents Across the UK</h3>
          </div>
          <p className="text-sm" style={{ color: '#6B7A8D' }}>
            Join hundreds of property professionals using UFixi to provide better service to their clients
          </p>
        </div>
      </main>
    </div>
  );
}