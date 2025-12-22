import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, MapPin, Star, Navigation, Phone, Mail, Filter, DollarSign, RefreshCw, Map, Bookmark, Plus, X, Check, ChevronDown, Award, Clock, Wrench } from "lucide-react";
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
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledTrade = urlParams.get("trade");
  
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [postcode, setPostcode] = useState("");
  const [tradeType, setTradeType] = useState(prefilledTrade || "all");
  const [sortBy, setSortBy] = useState("rating");
  const [maxCost, setMaxCost] = useState("any");
  const [searchRadius, setSearchRadius] = useState(5);
  const [tradesmen, setTradesmen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [services, setServices] = useState([]);
  const [minExperience, setMinExperience] = useState("any");
  const [availability, setAvailability] = useState("any");
  const [certifications, setCertifications] = useState([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [searchName, setSearchName] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: savedSearches = [] } = useQuery({
    queryKey: ["savedSearches"],
    queryFn: () => base44.entities.SavedSearch.list("-created_date")
  });

  useEffect(() => {
    // Use user's postcode if available
    if (user?.postcode && user?.country) {
      setPostcode(user.postcode);
      handlePostcodeSearch(user.postcode);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          searchLocalTradesmen(loc);
        },
        (error) => {
          setLocationError(error.message);
        }
      );
    }
  }, [user?.postcode, user?.country]);

  const searchLocalTradesmen = async (loc = location) => {
    if (!loc) return;
    
    setLoading(true);
    try {
      const tradeFilter = tradeType && tradeType !== "all" ? ` specializing in ${tradeType}` : "";
      const servicesFilter = services.length > 0 ? ` offering services: ${services.join(", ")}` : "";
      const experienceFilter = minExperience !== "any" ? ` with at least ${minExperience} years of experience` : "";
      const availabilityFilter = availability !== "any" ? ` with ${availability.replace(/_/g, " ")} availability` : "";
      const certsFilter = certifications.length > 0 ? ` with certifications: ${certifications.join(", ")}` : "";
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Find ALL local tradespeople${tradeFilter}${servicesFilter}${experienceFilter}${availabilityFilter}${certsFilter} near ${user?.postcode || ""}, ${user?.country || "UK"} (coordinates ${loc.lat}, ${loc.lng}).

SEARCH COMPREHENSIVELY ACROSS MULTIPLE SOURCES:
1. Google Search & Google Maps - for business listings
2. Facebook - search for local tradesperson pages, groups, and recommendations
3. Local Facebook Groups - scan community groups for recommended tradespeople
4. Bing, DuckDuckGo, and other search engines
5. Review sites (Trustpilot, Checkatrade, etc.)
6. Local business directories
7. Social media profiles and posts

For EACH tradesperson found, gather:
- Business name
- Trade/specialty (plumber, electrician, carpenter, etc.)
- Phone number
- Average rating (1-5 stars) from any available source
- Number of reviews/recommendations
- Approximate distance in miles from ${loc.lat}, ${loc.lng}
- Hourly rate estimate (in currency) if available
- Email if available
- Business address or service area
- Years of experience or time in business
- Specific services offered (e.g., emergency repairs, installations, maintenance, inspections)
- Availability (emergency 24/7, same-day, standard)
- Certifications, licenses, or accreditations (Gas Safe, NICEIC, etc.)
- Social media presence (if found on Facebook or other platforms)
- Any verified badges or certifications mentioned
- IMPORTANT: The direct URL/link where this tradesperson was found (Google Maps listing, Facebook page, website, business directory, etc.)

Prioritize tradespeople with:
- Active social media presence
- Recent Facebook posts or activity
- Community recommendations from local groups
- Verified business profiles
- Positive reviews

Return as many results as possible (aim for 15-25+ if available). Include both established businesses and independent tradespeople found on social media.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            tradesmen: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  trade: { type: "string" },
                  rating: { type: "number" },
                  reviews: { type: "number" },
                  distance: { type: "number" },
                  hourlyRate: { type: "number" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  address: { type: "string" },
                  verified: { type: "boolean" },
                  source: { type: "string" },
                  sourceUrl: { type: "string" },
                  yearsExperience: { type: "number" },
                  services: { type: "array", items: { type: "string" } },
                  availability: { type: "string" },
                  certifications: { type: "array", items: { type: "string" } }
                },
                required: ["name", "trade", "phone"]
              }
            }
          },
          required: ["tradesmen"]
        }
      });

      setTradesmen(result.tradesmen || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostcodeSearch = async (code = postcode) => {
    setLoading(true);
    try {
      const country = user?.country || "UK";
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Geocode this postcode/zip code: ${code} in ${country}. Return latitude and longitude.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            lat: { type: "number" },
            lng: { type: "number" }
          },
          required: ["lat", "lng"]
        }
      });
      
      setLocation(result);
      await searchLocalTradesmen(result);
    } catch (error) {
      console.error("Geocoding failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTradesmen = tradesmen
    .filter(t => tradeType === "all" || t.trade === tradeType)
    .filter(t => t.distance <= searchRadius)
    .filter(t => maxCost === "any" || t.hourlyRate <= parseInt(maxCost))
    .filter(t => {
      if (minExperience !== "any" && t.yearsExperience < parseInt(minExperience)) return false;
      if (availability !== "any" && t.availability !== availability) return false;
      if (services.length > 0 && !services.some(s => t.services?.includes(s))) return false;
      if (certifications.length > 0 && !certifications.some(c => t.certifications?.includes(c))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "distance") return (a.distance || 999) - (b.distance || 999);
      if (sortBy === "price") return (a.hourlyRate || 999) - (b.hourlyRate || 999);
      if (sortBy === "experience") return (b.yearsExperience || 0) - (a.yearsExperience || 0);
      return 0;
    });

  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[user?.currency || "GBP"];

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
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg bg-[#F7B600] text-[#0F1E2E]">
              Q
            </div>
            <h1 className={cn(
              "font-bold text-lg",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>Find Local Tradesmen</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Location & Refresh */}
        <div className={cn(
          "rounded-2xl p-5 border-2",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/30"
            : "bg-[#57CFA4]/10 border-[#57CFA4]/30"
        )}>
          {location ? (
            <div className="flex items-center justify-between">
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
                    {tradesmen.length} tradesmen found
                  </p>
                </div>
              </div>
              <Button
                onClick={() => searchLocalTradesmen()}
                disabled={loading}
                className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                Refresh
              </Button>
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

        {/* Map Toggle */}
        {location && tradesmen.length > 0 && (
          <Button
            onClick={() => setShowMap(!showMap)}
            variant="outline"
            className={cn(
              "w-full border-2 gap-2",
              theme === "dark"
                ? "bg-[#1A2F42] border-[#57CFA4]/30 text-[#57CFA4] hover:bg-[#57CFA4]/10"
                : "bg-white border-[#1E3A57]/20 text-[#1E3A57] hover:bg-slate-50"
            )}
          >
            <Map className="w-4 h-4" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
        )}

        {/* Mini Map */}
        {showMap && location && (
          <div className={cn(
            "rounded-2xl overflow-hidden border-2",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/30"
              : "bg-white border-[#1E3A57]/20"
          )}>
            <div className="h-64 relative bg-slate-200">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=tradesmen+near+${location.lat},${location.lng}&zoom=13`}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className={cn(
            "rounded-2xl p-4 border-2",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/30"
              : "bg-white border-[#1E3A57]/20"
          )}>
            <button
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#F7B600]" />
                <h3 className={cn(
                  "font-bold",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>Saved Searches ({savedSearches.length})</h3>
              </div>
              <ChevronDown className={cn(
                "w-5 h-5 transition-transform",
                showSavedSearches && "rotate-180",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]"
              )} />
            </button>
            {showSavedSearches && (
              <div className="mt-3 space-y-2">
                {savedSearches.map((search) => (
                  <button
                    key={search.id}
                    onClick={() => {
                      setTradeType(search.trade_type || "all");
                      setServices(search.services || []);
                      setMinExperience(search.min_experience?.toString() || "any");
                      setAvailability(search.availability || "any");
                      setCertifications(search.certifications || []);
                      setMaxCost(search.max_cost || "any");
                      setSearchRadius(search.search_radius || 5);
                      if (location) searchLocalTradesmen();
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border flex items-center justify-between hover:scale-[1.02] transition-transform",
                      theme === "dark"
                        ? "bg-[#1E3A57]/50 border-[#57CFA4]/20 hover:border-[#57CFA4]"
                        : "bg-slate-50 border-slate-200 hover:border-[#57CFA4]"
                    )}
                  >
                    <span className={cn(
                      "font-medium text-sm",
                      theme === "dark" ? "text-white" : "text-[#1E3A57]"
                    )}>{search.name}</span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await base44.entities.SavedSearch.delete(search.id);
                        queryClient.invalidateQueries(["savedSearches"]);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className={cn(
          "rounded-2xl p-5 space-y-4 border-2",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/30"
            : "bg-white border-[#1E3A57]/20"
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#F7B600]" />
              <h2 className={cn(
                "font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>Filters</h2>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                  "text-xs",
                  theme === "dark" ? "text-[#57CFA4] hover:bg-[#57CFA4]/10" : "text-blue-600 hover:bg-blue-50"
                )}
              >
                {showAdvancedFilters ? "Basic" : "Advanced"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const name = prompt("Name this search:");
                  if (name) {
                    base44.entities.SavedSearch.create({
                      name,
                      trade_type: tradeType !== "all" ? tradeType : undefined,
                      services,
                      min_experience: minExperience !== "any" ? parseInt(minExperience) : undefined,
                      certifications,
                      availability: availability !== "any" ? availability : undefined,
                      max_cost: maxCost !== "any" ? maxCost : undefined,
                      search_radius: searchRadius,
                      location: user?.postcode
                    });
                    queryClient.invalidateQueries(["savedSearches"]);
                  }
                }}
                className={cn(
                  "text-xs",
                  theme === "dark" ? "text-[#57CFA4] hover:bg-[#57CFA4]/10" : "text-blue-600 hover:bg-blue-50"
                )}
              >
                <Bookmark className="w-3 h-3 mr-1" />
                Save
              </Button>
            </div>
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
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-[#1E3A57]/20"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="carpentry">Carpentry</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="appliances">Appliances</SelectItem>
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
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-[#1E3A57]/20"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="distance">Nearest</SelectItem>
                  <SelectItem value="price">Lowest Price</SelectItem>
                  <SelectItem value="experience">Most Experienced</SelectItem>
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
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
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
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
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

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4 pt-4 border-t"
            >
              <div>
                <label className={cn(
                  "text-sm font-medium mb-2 block",
                  theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                )}>
                  Services Offered
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Emergency Repairs", "Installations", "Maintenance", "Inspections", "Consultations"].map((service) => (
                    <button
                      key={service}
                      onClick={() => {
                        setServices(prev =>
                          prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
                        );
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        services.includes(service)
                          ? "bg-[#57CFA4] text-white"
                          : theme === "dark"
                            ? "bg-[#1E3A57] border border-[#57CFA4]/30 text-[#57CFA4]"
                            : "bg-white border border-slate-300 text-slate-700"
                      )}
                    >
                      {services.includes(service) && <Check className="w-3 h-3 inline mr-1" />}
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={cn(
                  "text-sm font-medium mb-2 block",
                  theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                )}>
                  Minimum Experience
                </label>
                <Select value={minExperience} onValueChange={setMinExperience}>
                  <SelectTrigger className={cn(
                    "border-2",
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-[#1E3A57]/20"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Experience</SelectItem>
                    <SelectItem value="1">1+ years</SelectItem>
                    <SelectItem value="3">3+ years</SelectItem>
                    <SelectItem value="5">5+ years</SelectItem>
                    <SelectItem value="10">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={cn(
                  "text-sm font-medium mb-2 block",
                  theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                )}>
                  Availability
                </label>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger className={cn(
                    "border-2",
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-[#1E3A57]/20"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Availability</SelectItem>
                    <SelectItem value="emergency_24_7">Emergency 24/7</SelectItem>
                    <SelectItem value="today">Available Today</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={cn(
                  "text-sm font-medium mb-2 block",
                  theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                )}>
                  Certifications Required
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Gas Safe", "NICEIC", "CSCS", "City & Guilds", "NVQ"].map((cert) => (
                    <button
                      key={cert}
                      onClick={() => {
                        setCertifications(prev =>
                          prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
                        );
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        certifications.includes(cert)
                          ? "bg-[#F7B600] text-[#0F1E2E]"
                          : theme === "dark"
                            ? "bg-[#1E3A57] border border-[#57CFA4]/30 text-[#57CFA4]"
                            : "bg-white border border-slate-300 text-slate-700"
                      )}
                    >
                      {certifications.includes(cert) && <Award className="w-3 h-3 inline mr-1" />}
                      {cert}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#57CFA4] mx-auto mb-3" />
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                Searching Google, Facebook, local groups & more...
              </p>
            </div>
          ) : filteredTradesmen.length === 0 ? (
            <div className={cn(
              "text-center py-12 rounded-2xl border-2",
              theme === "dark"
                ? "bg-[#1A2F42] border-[#57CFA4]/30"
                : "bg-white border-[#1E3A57]/20"
            )}>
              <MapPin className="w-12 h-12 mx-auto mb-3 text-[#57CFA4]" />
              <p className={cn(
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                No tradesmen found
              </p>
              <p className={cn(
                "text-sm mt-1",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                Try enabling location or entering a postcode
              </p>
            </div>
          ) : (
            <>
              <p className={cn(
                "text-sm font-medium",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                {filteredTradesmen.length} tradesmen found
              </p>

              {filteredTradesmen.map((tradesman, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => tradesman.sourceUrl && window.open(tradesman.sourceUrl, '_blank')}
              className={cn(
                "rounded-2xl p-4 border-2 transition-all",
                tradesman.sourceUrl ? "cursor-pointer hover:scale-[1.02]" : "",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 hover:border-[#57CFA4]"
                  : "bg-white border-[#1E3A57]/20 hover:border-[#57CFA4]"
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

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-1">
                    <Navigation className="w-4 h-4 text-[#F7B600]" />
                    <span className={cn(
                      theme === "dark" ? "text-white" : "text-[#1E3A57]"
                    )}>
                      {tradesman.distance} mi
                    </span>
                  </div>
                  {tradesman.hourlyRate && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-[#F7B600]" />
                      <span className={cn(
                        theme === "dark" ? "text-white" : "text-[#1E3A57]"
                      )}>
                        {currencySymbol}{tradesman.hourlyRate}/hr
                      </span>
                    </div>
                  )}
                  {tradesman.yearsExperience && (
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-[#57CFA4]" />
                      <span className={cn(
                        theme === "dark" ? "text-white" : "text-[#1E3A57]"
                      )}>
                        {tradesman.yearsExperience}+ yrs
                      </span>
                    </div>
                  )}
                  {tradesman.availability && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className={cn(
                        "text-xs",
                        theme === "dark" ? "text-[#57CFA4]" : "text-blue-600"
                      )}>
                        {tradesman.availability.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                </div>

                {tradesman.services?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tradesman.services.slice(0, 3).map((service, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          theme === "dark"
                            ? "bg-[#57CFA4]/20 text-[#57CFA4]"
                            : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                )}

                {tradesman.certifications?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tradesman.certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                          theme === "dark"
                            ? "bg-[#F7B600]/20 text-[#F7B600]"
                            : "bg-yellow-100 text-yellow-700"
                        )}
                      >
                        <Award className="w-3 h-3" />
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <a
                  href={`tel:${tradesman.phone}`}
                  onClick={(e) => e.stopPropagation()}
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
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    // Create or find conversation
                    const existingConvos = await base44.entities.Conversation.filter({
                      participant_1_name: tradesman.name
                    });
                    
                    let convoId;
                    if (existingConvos.length > 0) {
                      convoId = existingConvos[0].id;
                    } else {
                      const newConvo = await base44.entities.Conversation.create({
                        participant_1_id: user.id,
                        participant_1_name: user.full_name,
                        participant_2_id: tradesman.name,
                        participant_2_name: tradesman.name,
                        last_message_date: new Date().toISOString()
                      });
                      convoId = newConvo.id;
                    }
                    navigate(createPageUrl(`Chat?id=${convoId}`));
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 font-semibold text-sm transition-colors",
                    theme === "dark"
                      ? "border-[#57CFA4]/30 text-[#57CFA4] hover:bg-[#57CFA4]/10"
                      : "border-[#1E3A57]/20 text-[#1E3A57] hover:bg-slate-50"
                  )}
                >
                  <Mail className="w-4 h-4" />
                  Message
                </button>
              </div>
            </motion.div>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}