import { ExternalLink, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function AmazonProducts({ products }) {
  const { theme } = useTheme();
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const currency = user?.currency || "GBP";
  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[currency];

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "rounded-2xl p-6 border",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-5 h-5 text-[#F7B600]" />
        <h3 className={cn(
          "font-semibold",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Products You'll Need
        </h3>
      </div>

      <p className={cn(
        "text-sm mb-4",
        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
      )}>
        Order these items to complete the repair yourself
      </p>

      <div className="space-y-3">
        {products.map((product, index) => (
          <div
            key={index}
            className={cn(
              "rounded-xl p-4 border transition-all hover:shadow-md",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/20 hover:border-[#57CFA4]/40"
                : "bg-slate-50 border-slate-200 hover:border-[#F7B600]"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                theme === "dark"
                  ? "bg-[#57CFA4]/10"
                  : "bg-[#F7B600]/10"
              )}>
                <Package className="w-5 h-5 text-[#F7B600]" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "font-semibold text-sm mb-1",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  {product.name}
                </h4>
                <p className={cn(
                  "text-xs mb-2",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  {product.description}
                </p>
                
                {product.estimatedCost && (
                  <p className={cn(
                    "text-sm font-semibold mb-2",
                    theme === "dark" ? "text-[#F7B600]" : "text-[#1E3A57]"
                  )}>
                    Approx. {product.estimatedCost}
                  </p>
                )}

                <a
                  href={product.amazonSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button
                    size="sm"
                    className="bg-[#FF9900] hover:bg-[#FF9900]/90 text-black font-semibold"
                  >
                    <ShoppingCart className="w-3 h-3 mr-2" />
                    Buy on Amazon
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={cn(
        "mt-4 p-3 rounded-xl",
        theme === "dark"
          ? "bg-[#57CFA4]/10"
          : "bg-blue-50"
      )}>
        <p className={cn(
          "text-xs",
          theme === "dark" ? "text-[#57CFA4]" : "text-blue-700"
        )}>
          💡 Tip: Compare prices and read reviews before purchasing. These are suggested products based on your issue.
        </p>
      </div>
    </div>
  );
}