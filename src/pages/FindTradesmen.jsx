import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, MapPin, Star, Navigation, Phone, Mail, Filter, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function FindTradesmen() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [postcode, setPostcode] = useState("");
  const [tradeType, setTradeType] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [maxCost, setMaxCost] = useState("any");
  const [searchRadius, setSearchRadius] = useState(5);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setLocationError(error.message);
        }
      );
    }
  }, []);

  const handlePostcodeSearch = () => {
    // In a real app, you'd geocode the postcode here
    console.log("Searching for postcode:", postcode);
  };

  // Mock tradesmen data - in production, this would come from Google Places API
  const mockTradesmen = [
    {
      id: 1,
      name: "Quick Fix Plumbing",
      trade: "plumber",
      rating: 4.8,
      reviews: 127,
      distance: 0.8,
      hourlyRate: 65,
      phone: "020 1234 5678",
      email: "contact@quickfix.com",
      verified: true
    },
    {
      id: 2,
      name: "Spark & Co Electrical",
      trade: "electrician",
      rating: 4.9,
      reviews: 203,
      distance: 1.2,
      hourlyRate: 75,
      phone: "020 8765 4321",
      email: "info@sparkco.com",
      verified: true
    },
    {
      id: 3,
      name: "HomeHandy Services",
      trade: "general",
      rating: 4.5,
      reviews: 89,
      distance: 2.1,
      hourlyRate: 45,
      phone: "020 5555 1234",
      verified: false
    },
    {
      id: 4,
      name: "Elite Plumbing Solutions",
      trade: "plumber",
      rating: 4.7,
      reviews: 156,
      distance: 2.8,
      hourlyRate: 70,
      phone: "020 9999 8888",
      verified: true
    }
  ];

  const filteredTradesmen = mockTradesmen
    .filter(t => tradeType === "all" || t.trade === tradeType)
    .filter(t => t.distance <= searchRadius)
    .filter(t => maxCost === "any" || t.hourlyRate <= parseInt(maxCost))
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "distance") return a.distance - b.distance;
      if (sortBy === "price") return a.hourlyRate - b.hourlyRate;
      return 0;
    });

  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[user?.currency || "GBP"];

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#1E3A57]" : "bg-white"
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#1E3A57] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
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
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={cn(
            "font-bold text-lg",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>Find Local Tradesmen</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Location Status */}
        <div className={cn(
          "rounded-2xl p-5 border-2",
          theme === "dark"
            ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
            : "bg-[#57CFA4]/10 border-[#57CFA4]/30"
        )}>
          {location ? (
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-[#57CFA4]" />
              <div>
                <p className={cn(
                  "font-semibold",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  Location Enabled
                </p>
                <p className={cn(
                  "text-sm",
                  theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                )}>
                  Showing tradesmen near you
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className={cn(
                "font-semibold mb-2",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                Enter your postcode
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., SW1A 1AA"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className={cn(
                    "border-2",
                    theme === "dark"
                      ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                      : "bg-white border-[#1E3A57]/20"
                  )}
                />
                <Button
                  onClick={handlePostcodeSearch}
                  className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57] font-semibold"
                >
                  Search
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className={cn(
          "rounded-2xl p-5 space-y-4 border-2",
          theme === "dark"
            ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
            : "bg-white border-[#1E3A57]/20"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-[#F7B600]" />
            <h2 className={cn(
              "font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>Filters</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={cn(
                "text-sm font-medium mb-1 block",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                Trade Type
              </label>
              <Select value={tradeType} onValueChange={setTradeType}>
                <SelectTrigger className={cn(
                  "border-2",
                  theme === "dark"
                    ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                    : "bg-white border-[#1E3A57]/20"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  <SelectItem value="plumber">Plumber</SelectItem>
                  <SelectItem value="electrician">Electrician</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="carpenter">Carpenter</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={cn(
                "text-sm font-medium mb-1 block",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                Sort By
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className={cn(
                  "border-2",
                  theme === "dark"
                    ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                    : "bg-white border-[#1E3A57]/20"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="distance">Nearest</SelectItem>
                  <SelectItem value="price">Lowest Price</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={cn(
                "text-sm font-medium mb-1 block",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                Max {currencySymbol}/hour
              </label>
              <Select value={maxCost} onValueChange={setMaxCost}>
                <SelectTrigger className={cn(
                  "border-2",
                  theme === "dark"
                    ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                    : "bg-white border-[#1E3A57]/20"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="50">Under {currencySymbol}50</SelectItem>
                  <SelectItem value="70">Under {currencySymbol}70</SelectItem>
                  <SelectItem value="100">Under {currencySymbol}100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={cn(
                "text-sm font-medium mb-1 block",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                Distance
              </label>
              <Select value={searchRadius.toString()} onValueChange={(v) => setSearchRadius(parseInt(v))}>
                <SelectTrigger className={cn(
                  "border-2",
                  theme === "dark"
                    ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                    : "bg-white border-[#1E3A57]/20"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="20">20 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          <p className={cn(
            "text-sm font-medium",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
            {filteredTradesmen.length} tradesmen found
          </p>

          {filteredTradesmen.map((tradesman, i) => (
            <motion.div
              key={tradesman.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-2xl p-4 border-2",
                theme === "dark"
                  ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
                  : "bg-white border-[#1E3A57]/20"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      "font-bold",
                      theme === "dark" ? "text-white" : "text-[#1E3A57]"
                    )}>{tradesman.name}</h3>
                    {tradesman.verified && (
                      <div className="w-5 h-5 rounded-full bg-[#57CFA4] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm capitalize",
                    theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                  )}>
                    {tradesman.trade}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#F7B600] text-[#F7B600]" />
                  <span className={cn(
                    "font-bold",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {tradesman.rating}
                  </span>
                  <span className={cn(
                    "text-sm",
                    theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                  )}>
                    ({tradesman.reviews})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3 text-sm">
                <div className="flex items-center gap-1">
                  <Navigation className="w-4 h-4 text-[#F7B600]" />
                  <span className={cn(
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {tradesman.distance} mi
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-[#F7B600]" />
                  <span className={cn(
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {currencySymbol}{tradesman.hourlyRate}/hr
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`tel:${tradesman.phone}`}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 font-semibold text-sm transition-colors",
                    theme === "dark"
                      ? "bg-[#57CFA4] border-[#57CFA4] text-[#1E3A57] hover:bg-[#57CFA4]/90"
                      : "bg-[#57CFA4] border-[#57CFA4] text-white hover:bg-[#57CFA4]/90"
                  )}
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
                {tradesman.email && (
                  <a
                    href={`mailto:${tradesman.email}`}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 font-semibold text-sm transition-colors",
                      theme === "dark"
                        ? "border-[#57CFA4]/30 text-[#57CFA4] hover:bg-[#57CFA4]/10"
                        : "border-[#1E3A57]/20 text-[#1E3A57] hover:bg-slate-50"
                    )}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}