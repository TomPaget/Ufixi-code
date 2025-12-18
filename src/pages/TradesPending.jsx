import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function TradesPending() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      theme === "dark" ? "bg-[#1E3A57]" : "bg-white"
    )}>
      <div className="max-w-md px-5 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-12 h-12 text-amber-500" />
        </div>
        <h1 className={cn(
          "text-2xl font-bold mb-3",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Application Under Review
        </h1>
        <p className={cn(
          "mb-6",
          theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
        )}>
          Thank you for applying! Our team will review your documents and get back to you within 24-48 hours.
        </p>
        <Button
          onClick={() => navigate(createPageUrl("Home"))}
          className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57]"
        >
          Go Home
        </Button>
      </div>
    </div>
  );
}