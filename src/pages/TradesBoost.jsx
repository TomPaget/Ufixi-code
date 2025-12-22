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
  const [dailyBudget, setDailyBudget] = useState(5);
  const [duration, setDuration] = useState(7);
  const [selectedPlacements, setSelectedPlacements] = useState(["homepage", "search"]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [targetLocations, setTargetLocations] = useState([]);
  const [locationInput, setLocationInput] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
    onSuccess: (data) => {
      if (data?.trades_specialty) {
        setSelectedServices([data.trades_specialty]);
      }
      if (data?.trades_location) {
        setTargetLocations([data.trades_location]);
      }
    }
  });

  const activateBoostMutation = useMutation({
    mutationFn: async (campaignData) => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + campaignData.duration);

      await base44.auth.updateMe({
        trades_boost_active: true,
        trades_boost_expires: expiryDate.toISOString().split("T")[0],
        trades_boost_daily_budget: campaignData.dailyBudget,
        trades_boost_placements: campaignData.placements,
        trades_boost_services: campaignData.services,
        trades_boost_locations: campaignData.locations
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
      navigate(createPageUrl("TradesProfile"));
    }
  });

  const totalCost = dailyBudget * duration;
  const isActive = user?.trades_boost_active && new Date(user?.trades_boost_expires) > new Date();

  const placements = [
    { id: "homepage", label: "Customer Homepage", description: "Featured section on the main page" },
    { id: "search", label: "Find Tradesmen Search", description: "Top of search results" },
    { id: "forum", label: "Community Forum", description: "Sidebar ads in forum" },
    { id: "messages", label: "Messages Page", description: "Promoted in messaging" }
  ];

  const services = [
    "plumbing", "electrical", "hvac", "carpentry", "roofing", 
    "painting", "general", "appliances", "other"
  ];

  const togglePlacement = (placementId) => {
    setSelectedPlacements(prev => 
      prev.includes(placementId)
        ? prev.filter(id => id !== placementId)
        : [...prev, placementId]
    );
  };

  const toggleService = (service) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const addLocation = () => {
    if (locationInput && !targetLocations.includes(locationInput)) {
      setTargetLocations([...targetLocations, locationInput]);
      setLocationInput("");
    }
  };

  const removeLocation = (location) => {
    setTargetLocations(targetLocations.filter(l => l !== location));
  };

  const handleActivate = () => {
    activateBoostMutation.mutate({
      dailyBudget,
      duration,
      placements: selectedPlacements,
      services: selectedServices,
      locations: targetLocations
    });
  };

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

        {/* Daily Budget */}
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
            Campaign Budget
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={cn(
                "text-sm mb-2 block",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Daily Budget (£)
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Math.max(1, parseInt(e.target.value) || 1))}
                className={cn(
                  "border-2",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
              />
              <p className={cn(
                "text-xs mt-1",
                theme === "dark" ? "text-[#57CFA4]/70" : "text-slate-500"
              )}>
                Higher budgets get more visibility
              </p>
            </div>

            <div>
              <label className={cn(
                "text-sm mb-2 block",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Campaign Duration (days)
              </label>
              <Input
                type="number"
                min="1"
                max="90"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className={cn(
                  "border-2",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
              />
            </div>
          </div>
        </div>

        {/* Ad Placements */}
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
            Where to Show Ads
          </h3>
          
          <div className="space-y-2">
            {placements.map((placement) => (
              <button
                key={placement.id}
                onClick={() => togglePlacement(placement.id)}
                className={cn(
                  "w-full p-3 rounded-xl border-2 text-left transition-all",
                  selectedPlacements.includes(placement.id)
                    ? theme === "dark"
                      ? "border-[#57CFA4] bg-[#57CFA4]/10"
                      : "border-[#57CFA4] bg-[#57CFA4]/10"
                    : theme === "dark"
                      ? "border-[#57CFA4]/20 bg-[#0F1E2E]"
                      : "border-slate-200 bg-white"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={cn(
                      "font-semibold text-sm",
                      theme === "dark" ? "text-white" : "text-slate-900"
                    )}>
                      {placement.label}
                    </p>
                    <p className={cn(
                      "text-xs mt-0.5",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                    )}>
                      {placement.description}
                    </p>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center",
                    selectedPlacements.includes(placement.id)
                      ? "border-[#57CFA4] bg-[#57CFA4]"
                      : theme === "dark"
                        ? "border-[#57CFA4]/30"
                        : "border-slate-300"
                  )}>
                    {selectedPlacements.includes(placement.id) && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Services */}
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
            Services to Promote
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <button
                key={service}
                onClick={() => toggleService(service)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  selectedServices.includes(service)
                    ? "bg-[#57CFA4] text-white"
                    : theme === "dark"
                      ? "bg-[#0F1E2E] text-[#57CFA4] border border-[#57CFA4]/30"
                      : "bg-white text-slate-700 border border-slate-200"
                )}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        {/* Target Locations */}
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
            Target Locations
          </h3>
          
          <div className="flex gap-2 mb-3">
            <Input
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addLocation()}
              placeholder="Add city or postcode"
              className={cn(
                "border-2 flex-1",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
            <Button
              onClick={addLocation}
              className="bg-[#57CFA4] hover:bg-[#57CFA4]/90"
            >
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {targetLocations.map((location) => (
              <div
                key={location}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-sm flex items-center gap-2",
                  theme === "dark"
                    ? "bg-[#57CFA4]/20 text-[#57CFA4]"
                    : "bg-[#57CFA4]/10 text-[#57CFA4]"
                )}
              >
                {location}
                <button
                  onClick={() => removeLocation(location)}
                  className="hover:opacity-70"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Summary */}
        <div className={cn(
          "rounded-xl p-6 border-2",
          theme === "dark"
            ? "bg-[#F7B600]/20 border-[#F7B600]"
            : "bg-[#F7B600]/10 border-[#F7B600]"
        )}>
          <div className="text-center mb-4">
            <p className={cn(
              "text-3xl font-bold mb-1",
              theme === "dark" ? "text-[#F7B600]" : "text-[#F7B600]"
            )}>
              £{totalCost}
            </p>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#F7B600]/70" : "text-[#F7B600]"
            )}>
              Total Campaign Cost
            </p>
          </div>
          <div className={cn(
            "text-xs space-y-1",
            theme === "dark" ? "text-white" : "text-slate-700"
          )}>
            <p>• £{dailyBudget}/day × {duration} days</p>
            <p>• {selectedPlacements.length} ad placement{selectedPlacements.length !== 1 ? "s" : ""}</p>
            <p>• {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""}</p>
            <p>• {targetLocations.length} location{targetLocations.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <Button
          onClick={handleActivate}
          disabled={activateBoostMutation.isPending || selectedPlacements.length === 0 || selectedServices.length === 0}
          className="w-full h-12 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] font-semibold rounded-xl"
        >
          {activateBoostMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Activating Campaign...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Launch Campaign
            </>
          )}
        </Button>
      </main>
    </div>
  );
}