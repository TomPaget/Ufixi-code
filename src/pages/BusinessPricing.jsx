import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
import LavaLampBackground from "@/components/kora/LavaLampBackground";

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
    navigate(createPageUrl(`BusinessSignup?plan=${plan.name.toLowerCase()}`));
  };

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      <LavaLampBackground />
      <PageHeader onMenuClick={() => setMenuOpen(true)} />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="max-w-6xl mx-auto px-5 py-12 space-y-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border" style={{ background: 'rgba(124,111,224,0.1)', borderColor: 'rgba(124,111,224,0.2)', color: '#151528' }}>
            <Building2 className="w-4 h-4" style={{ color: '#7C6FE0' }} />
            <span className="text-sm font-semibold">For Estate Agents & Businesses</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#151528', fontFamily: "'Sora', sans-serif" }}>
            Property Issues?<br />
            <span style={{ background: 'linear-gradient(135deg, #FF6E32, #E264AB, #7C6FE0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Instant Answers.</span>
          </h1>
          <p className="text-sm max-w-2xl mx-auto font-medium" style={{ color: '#6B6A8E' }}>
            See a problem during a viewing? Need a quick explanation for your client? 
            UFixi gives you instant, professional property diagnostics on the spot.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-3 gap-1.5 mb-16 items-start">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan?.name === plan.name;
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-xl border-2 transition-all cursor-pointer shadow-sm overflow-hidden",
                  plan.popular ? "pt-6" : "pt-3",
                  "px-2 pb-3",
                  isSelected ? "border-[#7C6FE0]" : "border-white/60 hover:border-[#7C6FE0]/40",
                  plan.popular && "z-10"
                )}
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(14px)',
                  ...(plan.popular ? { boxShadow: '0 0 0 2px rgba(124,111,224,0.3), 0 8px 32px rgba(226,100,171,0.15)' } : {}),
                  ...(isSelected ? { boxShadow: '0 0 0 2px rgba(124,111,224,0.5), 0 4px 20px rgba(124,111,224,0.15)' } : {})
                }}
                onClick={() => handleSelectPlan(plan)}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 py-1 flex justify-center" style={{ background: 'linear-gradient(135deg, #7C6FE0, #E264AB)' }}>
                    <span className="text-white text-[9px] font-bold tracking-wide uppercase">Popular</span>
                  </div>
                )}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1.5" style={{ background: 'rgba(124,111,224,0.1)' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: '#7C6FE0' }} />
                </div>
                <h3 className="text-[11px] font-bold mb-1 leading-none" style={{ color: '#1a2f42' }}>{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-base font-bold" style={{ color: '#1a2f42' }}>£{plan.price}</span>
                  <span className="text-[9px] font-medium block leading-none" style={{ color: '#6B7A8D' }}>/month</span>
                </div>
                <ul className="space-y-1 mb-2.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#7C6FE0' }} />
                      <span className="text-[9px] font-medium whitespace-nowrap" style={{ color: '#1a2f42' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSelectPlan(plan); }}
                  className="w-full text-[10px] font-semibold py-1.5 rounded-lg transition-all text-white"
                  style={{
                    background: plan.popular
                      ? 'linear-gradient(135deg, #FF6E32, #E264AB, #7C6FE0)'
                      : isSelected
                        ? 'linear-gradient(135deg, #7C6FE0, #E264AB)'
                        : 'rgba(21,21,40,0.75)',
                    backdropFilter: !plan.popular && !isSelected ? 'blur(8px)' : undefined,
                    border: !plan.popular && !isSelected ? '1px solid rgba(255,255,255,0.15)' : undefined,
                    boxShadow: plan.popular ? '0 4px 16px rgba(226,100,171,0.35)' : undefined
                  }}
                >
                  {isSelected ? "✓ Selected" : "Select"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Use Cases */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { icon: Home, text: "Spot issues during viewings", color: '#FF6E32', border: 'rgba(255,110,50,0.15)' },
            { icon: Clock, text: "Get instant cost estimates", color: '#E264AB', border: 'rgba(226,100,171,0.15)' },
            { icon: BarChart3, text: "Build trust with clients", color: '#7C6FE0', border: 'rgba(124,111,224,0.15)' }
          ].map((item, i) => (
            <div key={i} className="p-5 rounded-2xl text-center shadow-sm" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: `1px solid ${item.border}` }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: `${item.color}18` }}>
                <item.icon className="w-6 h-6" style={{ color: item.color }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#151528' }}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="text-center p-8 rounded-2xl shadow-sm" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(124,111,224,0.15)' }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6" style={{ color: '#7C6FE0' }} />
            <h3 className="font-semibold" style={{ color: '#151528' }}>Trusted by Estate Agents Across the UK</h3>
          </div>
          <p className="text-sm" style={{ color: '#6B6A8E' }}>
            Join hundreds of property professionals using UFixi to provide better service to their clients
          </p>
        </div>
      </main>
    </div>
  );
}