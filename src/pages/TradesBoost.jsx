import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, TrendingUp, Zap, Eye, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function TradesBoost() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [days, setDays] = useState(1);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const activateBoostMutation = useMutation({
    mutationFn: async (numDays) => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + numDays);

      await base44.auth.updateMe({
        trades_boost_active: true,
        trades_boost_expires: expiryDate.toISOString().split("T")[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
      navigate(createPageUrl("TradesProfile"));
    }
  });

  const totalCost = days * 5;
  const isActive = user?.trades_boost_active && new Date(user?.trades_boost_expires) > new Date();

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
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
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={cn(
            "font-bold text-lg",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>Boost Your Profile</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {isActive && (
          <div className={cn(
            "rounded-2xl p-4 border-2",
            theme === "dark"
              ? "bg-[#F7B600]/20 border-[#F7B600]"
              : "bg-[#F7B600]/10 border-[#F7B600]"
          )}>
            <p className="font-semibold text-[#F7B600] mb-1">🚀 Boost Active!</p>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-white" : "text-slate-700"
            )}>
              Expires: {new Date(user.trades_boost_expires).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className={cn(
          "rounded-2xl p-6 border-2",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/30"
            : "bg-white border-slate-200"
        )}>
          <Zap className="w-12 h-12 text-[#F7B600] mb-3" />
          <h2 className={cn(
            "text-xl font-bold mb-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Get More Visibility
          </h2>
          <p className={cn(
            "text-sm mb-4",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            Boost your profile to appear at the top of search results and on the homepage
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-[#F7B600] flex-shrink-0 mt-0.5" />
              <div>
                <p className={cn(
                  "font-semibold text-sm",
                  theme === "dark" ? "text-white" : "text-slate-800"
                )}>
                  Featured at Top of "Find Tradesmen"
                </p>
                <p className={cn(
                  "text-xs",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  Appear first when customers search for trades in your area
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-[#F7B600] flex-shrink-0 mt-0.5" />
              <div>
                <p className={cn(
                  "font-semibold text-sm",
                  theme === "dark" ? "text-white" : "text-slate-800"
                )}>
                  Featured on Customer Homepage
                </p>
                <p className={cn(
                  "text-xs",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  Displayed at the bottom of the home page to all users
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-[#F7B600] flex-shrink-0 mt-0.5" />
              <div>
                <p className={cn(
                  "font-semibold text-sm",
                  theme === "dark" ? "text-white" : "text-slate-800"
                )}>
                  Special "Featured" Badge
                </p>
                <p className={cn(
                  "text-xs",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  Stand out with a special badge on your profile
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          "rounded-2xl p-6 border-2",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/30"
            : "bg-white border-slate-200"
        )}>
          <h3 className={cn(
            "font-bold mb-4",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Select Duration
          </h3>
          
          <div className="mb-4">
            <label className={cn(
              "text-sm mb-2 block",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Number of Days
            </label>
            <Input
              type="number"
              min="1"
              max="30"
              value={days}
              onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
              className={cn(
                "border-2",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>

          <div className={cn(
            "rounded-xl p-4 mb-6 text-center",
            theme === "dark"
              ? "bg-[#F7B600]/20 border-2 border-[#F7B600]"
              : "bg-[#F7B600]/10 border-2 border-[#F7B600]"
          )}>
            <p className={cn(
              "text-3xl font-bold mb-1",
              theme === "dark" ? "text-[#F7B600]" : "text-[#F7B600]"
            )}>
              £{totalCost}
            </p>
            <p className={cn(
              "text-xs",
              theme === "dark" ? "text-[#F7B600]/70" : "text-[#F7B600]"
            )}>
              £5 per day × {days} {days === 1 ? "day" : "days"}
            </p>
          </div>

          <Button
            onClick={() => activateBoostMutation.mutate(days)}
            disabled={activateBoostMutation.isPending}
            className="w-full h-12 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] font-semibold rounded-xl"
          >
            {activateBoostMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Activate Boost
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}