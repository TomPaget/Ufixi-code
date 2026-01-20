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
    price: 18.99,
    icon: Building2,
    color: "from-slate-900 to-slate-950",
    features: [
      "Unlimited property scans",
      "Instant AI diagnostics",
      "Cost estimates for repairs",
      "Mobile app access",
      "Email support",
      "1 team member"
    ]
  },
  {
    name: "Professional",
    price: 39.99,
    icon: Zap,
    color: "from-slate-700 to-slate-900",
    popular: true,
    features: [
      "Everything in Starter",
      "Priority AI analysis",
      "Detailed repair reports",
      "Export & share functionality",
      "Advanced cost breakdowns",
      "Up to 5 team members",
      "Priority support",
      "Custom branding"
    ]
  },
  {
    name: "Enterprise",
    price: 79.99,
    icon: TrendingUp,
    color: "from-slate-800 to-slate-950",
    features: [
      "Everything in Professional",
      "Unlimited team members",
      "API access",
      "White-label options",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced analytics dashboard",
      "24/7 priority support",
      "Training & onboarding"
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
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-black" : "bg-slate-50"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 border-b",
        theme === "dark" 
          ? "bg-black border-[#57CFA4]/20" 
          : "bg-white border-slate-200"
      )}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/10 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={cn(
            "text-lg font-bold",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Business Membership
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-12 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full border",
            theme === "dark"
              ? "bg-[#F7B600]/10 border-[#F7B600]/30 text-[#F7B600]"
              : "bg-[#F7B600]/10 border-[#F7B600]/30 text-[#F7B600]"
          )}>
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-semibold">For Estate Agents & Businesses</span>
          </div>
          
          <h1 className={cn(
            "text-4xl md:text-5xl font-bold",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Property Issues?
            <br />
            <span className="bg-gradient-to-r from-[#F7B600] to-[#57CFA4] bg-clip-text text-transparent">
              Instant Answers.
            </span>
          </h1>
          
          <p className={cn(
            "text-lg max-w-2xl mx-auto",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
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
                className={cn(
                  "p-4 rounded-xl border",
                  theme === "dark"
                    ? "bg-[#1a1a1a] border-[#57CFA4]/20"
                    : "bg-white border-slate-200"
                )}
              >
                <item.icon className="w-8 h-8 mx-auto mb-2 text-[#F7B600]" />
                <p className={cn(
                  "text-sm",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
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
                  "relative rounded-2xl border-2 p-6 transition-all cursor-pointer",
                  isSelected
                    ? theme === "dark"
                      ? "border-[#F7B600] bg-[#1A2F42] shadow-xl scale-105"
                      : "border-[#F7B600] bg-white shadow-xl scale-105"
                    : theme === "dark"
                      ? "border-[#57CFA4]/20 bg-[#1A2F42] hover:border-[#57CFA4]/40"
                      : "border-slate-200 bg-white hover:border-[#F7B600]/40",
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

                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  `bg-gradient-to-br ${plan.color}`
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className={cn(
                  "text-xl font-bold mb-2",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  {plan.name}
                </h3>

                <div className="mb-6">
                  <span className={cn(
                    "text-4xl font-bold",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    £{plan.price}
                  </span>
                  <span className={cn(
                    "text-sm",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    /month
                  </span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#57CFA4] flex-shrink-0 mt-0.5" />
                      <span className={cn(
                        "text-sm",
                        theme === "dark" ? "text-white" : "text-slate-700"
                      )}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className={cn(
                    "w-full",
                    isSelected
                      ? "bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
                      : theme === "dark"
                        ? "bg-[#1E3A57] hover:bg-[#1E3A57]/80 text-white"
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
          <div className={cn(
            "max-w-2xl mx-auto rounded-2xl border p-8",
            theme === "dark"
              ? "bg-[#1a1a1a] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <h2 className={cn(
              "text-2xl font-bold mb-6",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Complete Your Subscription
            </h2>

            <div className="space-y-4">
              <div>
                <Label className={cn(
                  "mb-2 block",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  Company Name *
                </Label>
                <Input
                  placeholder="e.g., Smith & Co Estate Agents"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={cn(
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
                  Contact Email
                </Label>
                <Input
                  type="email"
                  placeholder="your.email@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  defaultValue={user?.email}
                  className={cn(
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-slate-200"
                  )}
                />
              </div>

              <div className={cn(
                "p-4 rounded-xl border",
                theme === "dark"
                  ? "bg-[#F7B600]/10 border-[#F7B600]/30"
                  : "bg-[#F7B600]/10 border-[#F7B600]/30"
              )}>
                <p className={cn(
                  "text-sm",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  <strong>Selected Plan:</strong> {selectedPlan.name} - £{selectedPlan.price}/month
                </p>
                <p className={cn(
                  "text-xs mt-2",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  Cancel anytime. No hidden fees.
                </p>
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={!companyName || upgradeMutation.isPending}
                className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] h-12"
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
        <div className={cn(
          "text-center p-8 rounded-2xl border",
          theme === "dark"
            ? "bg-[#1a1a1a] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-[#57CFA4]" />
            <h3 className={cn(
              "font-semibold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Trusted by Estate Agents Across the UK
            </h3>
          </div>
          <p className={cn(
            "text-sm",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            Join hundreds of property professionals using Fixplain to provide better service to their clients
          </p>
        </div>
      </main>
    </div>
  );
}