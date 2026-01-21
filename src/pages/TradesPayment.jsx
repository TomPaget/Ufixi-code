import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function TradesPayment() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const activateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      // Calculate expiry date (1 week from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      await base44.auth.updateMe({
        trades_subscription_active: true,
        trades_subscription_expires: expiryDate.toISOString().split("T")[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
      navigate(createPageUrl("TradesSuccess"));
    }
  });

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const { data } = await base44.functions.invoke('createStripeCheckout', {
        planType: 'trades',
        planName: 'Trades Subscription',
        price: 2.99,
        accountType: 'trades'
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setProcessing(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-5",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[#57CFA4]" />
          <h1 className={cn(
            "text-2xl font-bold mb-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Verification Complete!
          </h1>
          <p className={cn(
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            Your documents have been verified. Subscribe to activate your trades account.
          </p>
        </div>

        <div className={cn(
          "rounded-2xl p-6 border-2",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/30"
            : "bg-white border-slate-200"
        )}>
          <h3 className={cn(
            "font-bold text-lg mb-4",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Trades Subscription
          </h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#57CFA4]" />
              <span className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
                Featured on customer searches
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#57CFA4]" />
              <span className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
                Receive job requests
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#57CFA4]" />
              <span className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
                Verified badge on profile
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#57CFA4]" />
              <span className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
                Direct messaging with customers
              </span>
            </div>
          </div>

          <div className={cn(
            "rounded-xl p-4 mb-6 text-center border",
            theme === "dark"
              ? "bg-[#F7B600]/20 border-[#F7B600]"
              : "bg-[#F7B600]/10 border-[#F7B600]"
          )}>
            <p className={cn(
              "text-3xl font-bold mb-1",
              theme === "dark" ? "text-[#F7B600]" : "text-[#F7B600]"
            )}>
              £2.99 <span className="text-lg font-normal">/week</span>
            </p>
            <p className={cn(
              "text-xs",
              theme === "dark" ? "text-[#F7B600]/70" : "text-[#F7B600]"
            )}>
              Billed weekly • Cancel anytime
            </p>
          </div>

          <Button
            onClick={handlePayment}
            disabled={processing}
            className="w-full h-12 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] font-semibold rounded-xl"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Activate Subscription
              </>
            )}
          </Button>

          <p className={cn(
            "text-xs text-center mt-3",
            theme === "dark" ? "text-[#57CFA4]/70" : "text-slate-500"
          )}>
            Secure payment via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}