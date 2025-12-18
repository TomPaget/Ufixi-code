import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function TradesSuccess() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      theme === "dark" ? "bg-[#1E3A57]" : "bg-white"
    )}>
      <div className="max-w-md px-5 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h1 className={cn(
          "text-2xl font-bold mb-3",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Welcome to QuoFix Trades!
        </h1>
        <p className={cn(
          "mb-2",
          theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
        )}>
          Your application has been approved! You're now a verified tradesperson.
        </p>
        <p className={cn(
          "text-sm mb-6",
          theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
        )}>
          You can now respond to community posts and connect with customers in your area.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => navigate(createPageUrl("Forum"))}
            className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57]"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Go to Community Forum
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Home"))}
            className={cn(
              "w-full border-2",
              theme === "dark"
                ? "border-[#57CFA4]/30 text-[#57CFA4] hover:bg-[#57CFA4]/10"
                : "border-[#1E3A57]/20 text-[#1E3A57] hover:bg-slate-50"
            )}
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}