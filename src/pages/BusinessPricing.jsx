import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
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

const plans = [
  {
    name: "Starter",
    price: 6.99,
    icon: Building2,
    color: "from-slate-900 to-slate-950",
    features: [
      "Up to 3 team members",
      "No ads on app",
      "Unlimited property scans",
      "Instant AI diagnostics",
      "Cost estimates for repairs",
      "Mobile app access"
    ]
  },
  {
    name: "Professional",
    price: 14.99,
    icon: Zap,
    color: "from-slate-700 to-slate-900",
    popular: true,
    features: [
      "Everything in Starter",
      "Up to 10 team members",
      "Priority support",
      "Priority AI analysis",
      "Detailed repair reports",
      "Export & share functionality",
      "Advanced cost breakdowns"
    ]
  },
  {
    name: "Enterprise",
    price: 19.99,
    icon: TrendingUp,
    color: "from-slate-800 to-slate-950",
    features: [
      "Everything in Professional",
      "Up to 25 team members",
      "No ads on app",
      "Advanced analytics dashboard",
      "Priority support",
      "Custom integrations",
      "Dedicated account manager"
    ]
  }
];

export default function BusinessPricing() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

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

  const handleSubscribe = () => {
    if (selectedPlan && companyName) {
      upgradeMutation.mutate(selectedPlan);
    }
  };

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/85 via-pink-300/45 to-orange-500/85 animate-gradient-shift blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/75 via-yellow-300/35 to-blue-500/75 animate-gradient-shift-slow blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/65 via-pink-200/40 to-orange-500/70 animate-gradient-shift-reverse blur-3xl" />
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
      <header className="sticky top-0 z-30 border-b-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-xl hover:bg-slate-100 text-[#1E3A57]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-[#1E3A57]">
            Business Membership
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-12 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-[#F7B600]/10 border-[#F7B600]/30 text-[#F7B600]">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-semibold">For Estate Agents & Businesses</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-[#1E3A57]">
            Property Issues?
            <br />
            <span className="bg-gradient-to-r from-green-300 to-yellow-400 bg-clip-text text-transparent">
              Instant Answers.
            </span>
          </h1>
          
          <p className="text-lg max-w-2xl mx-auto text-slate-800 font-medium">
            See a problem during a viewing? Need a quick explanation for your client? 
            Fixplain gives you instant, professional property diagnostics on the spot.
          </p>

          {/* Use Cases */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
            {[
              { icon: Home, text: "Spot issues during viewings" },
              { icon: Clock, text: "Get instant cost estimates" },
              { icon: BarChart3, text: "Build trust with clients" }
            ].map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20"
              >
                <item.icon className="w-8 h-8 mx-auto mb-2 text-[#F7B600]" />
                <p className="text-sm font-semibold text-slate-900">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan?.name === plan.name;
            
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border-2 p-6 transition-all cursor-pointer bg-white/60 backdrop-blur-md",
                  isSelected
                    ? "border-[#57CFA4] shadow-xl scale-105"
                    : "border-[#1E3A57]/20 hover:border-[#57CFA4]/40",
                  plan.popular && "ring-2 ring-[#F7B600] ring-offset-4"
                )}
                onClick={() => handleSelectPlan(plan)}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#F7B600] to-[#57CFA4] text-[#0F1E2E] px-4 py-1 rounded-full text-xs font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-slate-900 to-slate-950">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-2 text-[#1E3A57]">
                  {plan.name}
                </h3>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#1E3A57]">
                    £{plan.price}
                  </span>
                  <span className="text-sm text-slate-700 font-medium">
                    /month
                  </span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#57CFA4] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-900 font-medium">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className={cn(
                    "w-full font-semibold",
                    isSelected
                      ? "bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-[#0F1E2E]"
                      : "bg-[#1E3A57] hover:bg-[#1E3A57]/90 text-white"
                  )}
                >
                  {isSelected ? "Selected" : "Select Plan"}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Company Details Form */}
        {selectedPlan && (
          <div className="max-w-2xl mx-auto rounded-2xl border-2 p-8 bg-white/60 backdrop-blur-md border-[#1E3A57]/20">
            <h2 className="text-2xl font-bold mb-6 text-[#1E3A57]">
              Complete Your Subscription
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-[#1E3A57]">
                  Company Name *
                </Label>
                <Input
                  placeholder="e.g., Smith & Co Estate Agents"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-white/60 backdrop-blur-sm border-2 border-[#1E3A57]/20"
                />
              </div>

              <div>
                <Label className="mb-2 block text-[#1E3A57]">
                  Contact Email
                </Label>
                <Input
                  type="email"
                  placeholder="your.email@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  defaultValue={user?.email}
                  className="bg-white/60 backdrop-blur-sm border-2 border-[#1E3A57]/20"
                />
              </div>

              <div className="p-4 rounded-xl border bg-[#F7B600]/10 border-[#F7B600]/30">
                <p className="text-sm text-[#1E3A57]">
                  <strong>Selected Plan:</strong> {selectedPlan.name} - £{selectedPlan.price}/month
                </p>
                <p className="text-xs mt-2 text-slate-700 font-medium">
                  Cancel anytime. No hidden fees.
                </p>
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={!companyName || upgradeMutation.isPending}
                className="w-full bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-[#0F1E2E] h-12 font-semibold"
              >
                {upgradeMutation.isPending ? (
                  "Processing..."
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Business Membership
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Social Proof */}
        <div className="text-center p-8 rounded-2xl border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-[#57CFA4]" />
            <h3 className="font-semibold text-[#1E3A57]">
              Trusted by Estate Agents Across the UK
            </h3>
          </div>
          <p className="text-sm text-slate-800 font-medium">
            Join hundreds of property professionals using Fixplain to provide better service to their clients
          </p>
        </div>
      </main>
    </div>
  );
}