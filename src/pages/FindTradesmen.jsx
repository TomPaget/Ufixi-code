import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import TradespersonCard from "@/components/kora/TradespersonCard";
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
import { getGradientStyle, getBackdropFilter, getBoxShadow, getBorderColor } from "@/components/kora/gradientThemes";

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
  const [minRating, setMinRating] = useState(0);

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
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          
          // Reverse geocode to get postcode from coordinates
          try {
            const result = await base44.integrations.Core.InvokeLLM({
              prompt: `Use Google Maps reverse geocoding to get the postcode/zip code for these exact coordinates:
Latitude: ${loc.lat}
Longitude: ${loc.lng}

Return ONLY the postcode/zip code for this location.`,
              add_context_from_internet: true,
              response_json_schema: {
                type: "object",
                properties: {
                  postcode: { type: "string" },
                  formatted_address: { type: "string" }
                },
                required: ["postcode"]
              }
            });
            
            if (result.postcode) {
              setPostcode(result.postcode);
              // Update user's postcode if not set
              if (!user?.postcode) {
                await base44.auth.updateMe({ postcode: result.postcode });
              }
            }
          } catch (error) {
            console.error("Reverse geocoding failed:", error);
          }
          
          searchLocalTradesmen(loc);
        },
        (error) => {
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, [user?.postcode, user?.country]);

  const searchLocalTradesmen = async (loc = location) => {
    if (!loc) return;
    
    setLoading(true);
    try {
      const currentPostcode = postcode || user?.postcode || "";
      const tradeFilter = tradeType && tradeType !== "all" ? ` specializing in ${tradeType}` : "";
      const servicesFilter = services.length > 0 ? ` offering services: ${services.join(", ")}` : "";
      const experienceFilter = minExperience !== "any" ? ` with at least ${minExperience} years of experience` : "";
      const availabilityFilter = availability !== "any" ? ` with ${availability.replace(/_/g, " ")} availability` : "";
      const certsFilter = certifications.length > 0 ? ` with certifications: ${certifications.join(", ")}` : "";
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a LOCAL tradesperson finder. Your mission is to find REAL tradespeople who ACTUALLY service this exact location.

**PRECISE LOCATION DATA:**
- Exact Coordinates: ${loc.lat}, ${loc.lng}
- Postcode/Zip: ${currentPostcode}
- Country: ${user?.country || "UK"}
- Search Radius: ${searchRadius} miles

**MANDATORY SEARCH SOURCES (use ALL of these):**
1. **Google Maps Business Listings** - Search "${tradeType || "tradesmen"} near ${currentPostcode || loc.lat + "," + loc.lng}"
2. **Checkatrade** - Verified local tradespeople in postcode area ${currentPostcode}
3. **RatedPeople** - Search by postcode ${currentPostcode} for local professionals
4. **TrustATrader** - Check local listings for ${currentPostcode}
5. **MyBuilder** - Local tradesperson profiles serving ${currentPostcode}
6. **Google Business** - Local business listings within ${searchRadius} miles of ${loc.lat}, ${loc.lng}
7. **Bing Maps** - Additional local business data for ${currentPostcode}
8. **Local directories** - Yell, Thomson Local for postcode ${currentPostcode}
9. **Facebook Business Pages** - Local tradespeople serving ${currentPostcode}
10. **Google Search** - "${tradeType || "tradesman"} ${currentPostcode}"

**SEARCH REQUIREMENTS:**
Trade Type: ${tradeType || "any"}${servicesFilter}${experienceFilter}${availabilityFilter}${certsFilter}

**STRICT VALIDATION:**
- Each tradesperson MUST actually service postcode ${currentPostcode}
- Calculate EXACT distance from coordinates ${loc.lat}, ${loc.lng}
- Verify they operate within ${searchRadius} miles radius
- Include ONLY tradespeople with verifiable phone numbers and addresses
- Must have actual business presence with real reviews (not generic results)

**For EACH tradesperson, provide:**
- Business name (from actual listing)
- Trade/specialty
- Phone number (verified from listing)
- Postcode/service area (confirm it matches)
- Average rating from reviews (Checkatrade, Google, etc.)
- Number of reviews
- Distance in miles from ${loc.lat}, ${loc.lng}
- Hourly rate (realistic for ${user?.country || "UK"})
- Email if available
- Years in business
- Services offered (from their actual profile)
- Availability
- Certifications (Gas Safe, NICEIC, etc.)
- Source URL (direct link to their listing)

**QUALITY OVER QUANTITY:**
Return 8-15 REAL local tradespeople. Better to have fewer accurate results than many generic ones.`,
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
    const postcodeStr = String(code || "").trim();
    if (!postcodeStr) return;
    
    setLoading(true);
    setLocationError(null);
    try {
      const country = user?.country || "UK";
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Use Google Maps Geocoding API to convert this postcode/zip code to exact coordinates:
        
Postcode: ${postcodeStr.toUpperCase()}
Country: ${country}

CRITICAL REQUIREMENTS:
- Verify this is a valid ${country} postcode format
- Use Google Maps Geocoding API for 100% accuracy
- Return the precise latitude and longitude from Google Maps
- Include the formatted address from Google

Return the exact coordinates and verify the postcode is valid.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            lat: { type: "number" },
            lng: { type: "number" },
            formatted_address: { type: "string" },
            verified_postcode: { type: "string" }
          },
          required: ["lat", "lng"]
        }
      });
      
      if (!result.lat || !result.lng) {
        throw new Error("Invalid postcode");
      }
      
      setLocation(result);
      if (result.verified_postcode) {
        setPostcode(result.verified_postcode);
        // Update user's postcode
        await base44.auth.updateMe({ postcode: result.verified_postcode });
      }
      await searchLocalTradesmen(result);
    } catch (error) {
      console.error("Geocoding failed:", error);
      setLocationError("Invalid postcode. Please check and try again.");
      setLocation(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredTradesmen = tradesmen
    .filter(t => {
      if (tradeType === "all") return true;
      const tradeLower = (t.trade || "").toLowerCase();
      const filterLower = tradeType.toLowerCase();
      return tradeLower.includes(filterLower) || filterLower.includes(tradeLower);
    })
    .filter(t => t.distance <= searchRadius)
    .filter(t => maxCost === "any" || t.hourlyRate <= parseInt(maxCost))
    .filter(t => (t.rating || 0) >= minRating)
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
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/85 via-pink-300/45 to-orange-500/85 animate-gradient-shift blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/75 via-yellow-300/35 to-blue-500/75 animate-gradient-shift-slow blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/65 via-pink-200/40 to-orange-500/70 animate-gradient-shift-reverse blur-3xl" />
        <div className="absolute inset-0 bg-white/5" />
      </div>
      
      <style jsx>{`
        @keyframes gradient-shift {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          25% { transform: translate(15%, 10%) scale(1.2) rotate(5deg); }
          50% { transform: translate(5%, 20%) scale(1.1) rotate(-3deg); }
          75% { transform: translate(-10%, 10%) scale(1.15) rotate(4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-slow {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          33% { transform: translate(-10%, 15%) scale(1.3) rotate(-6deg); }
          66% { transform: translate(10%, -10%) scale(1.1) rotate(5deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-reverse {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          30% { transform: translate(20%, -15%) scale(1.25) rotate(7deg); }
          60% { transform: translate(-15%, 10%) scale(1.15) rotate(-4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        .animate-gradient-shift {
          animation: gradient-shift 12s ease-in-out infinite;
        }
        .animate-gradient-shift-slow {
          animation: gradient-shift-slow 15s ease-in-out infinite;
        }
        .animate-gradient-shift-reverse {
          animation: gradient-shift-reverse 13s ease-in-out infinite;
        }
      `}</style>
      
      <header className="sticky top-0 z-30 border-b bg-white/10 backdrop-blur-md border-white/20">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
            className="rounded-xl hover:bg-slate-100 text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg bg-[#F7B600] text-[#0F1E2E]">
              Q
            </div>
            <h1 className="font-bold text-lg text-white">
              Find Local Tradesmen
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Location & Refresh */}
        <div 
          className="rounded-2xl p-5 border-2"
          style={{
            background: getGradientStyle(theme, 'main'),
            backdropFilter: getBackdropFilter(),
            WebkitBackdropFilter: getBackdropFilter(),
            boxShadow: getBoxShadow('main'),
            borderColor: getBorderColor(theme),
          }}
        >
          {location ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-[#57CFA4]" />
                <div>
                  <p className="font-semibold text-white">
                    Location Enabled
                  </p>
                  <p className="text-sm text-white">
                    {postcode ? `${postcode} • ` : ""}{tradesmen.length} tradesmen found
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
              <p className="font-semibold mb-2 text-white">
                Enter your postcode
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., SW1A 1AA"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  style={{
                    background: getGradientStyle(theme, 'main'),
                    backdropFilter: getBackdropFilter(),
                    WebkitBackdropFilter: getBackdropFilter(),
                    boxShadow: getBoxShadow('main'),
                    borderColor: getBorderColor(theme),
                  }}
                  className="border-2"
                />
                <Button
                   onClick={handlePostcodeSearch}
                   style={{
                     background: getGradientStyle(theme, 'main'),
                     backdropFilter: getBackdropFilter(),
                     WebkitBackdropFilter: getBackdropFilter(),
                     boxShadow: getBoxShadow('main'),
                     borderColor: getBorderColor(theme),
                   }}
                   className="text-white font-semibold border-2"
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
            style={{
              background: getGradientStyle(theme, 'main'),
              backdropFilter: getBackdropFilter(),
              WebkitBackdropFilter: getBackdropFilter(),
              boxShadow: getBoxShadow('main'),
              borderColor: getBorderColor(theme),
            }}
            className="w-full border-2 gap-2 text-white"
          >
            <Map className="w-4 h-4" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
        )}

        {/* Mini Map */}
        {showMap && location && (
          <div className="rounded-2xl overflow-hidden border-2 bg-white/85 backdrop-blur-md border-[#1E3A57]/20">
            <div className="p-3 border-b">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F7B600]" />
                <p className="text-sm font-medium text-white">
                  Your Location: {postcode || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                </p>
                </div>
                <p className="text-xs mt-1 text-white">
                Red marker shows your exact location
                </p>
            </div>
            <div className="h-80 relative bg-slate-200">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${location.lat},${location.lng}&zoom=14&maptype=roadmap`}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        )}

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className="rounded-2xl p-4 border-2 bg-white/85 backdrop-blur-md border-[#1E3A57]/20">
            <button
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#F7B600]" />
                <h3 className="font-bold text-white">
                  Saved Searches ({savedSearches.length})
                </h3>
              </div>
              <ChevronDown className={cn(
                "w-5 h-5 transition-transform text-white",
                showSavedSearches && "rotate-180"
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
                    className="w-full text-left p-3 rounded-xl border flex items-center justify-between hover:scale-[1.02] transition-transform bg-slate-50 border-slate-200 hover:border-[#57CFA4]"
                  >
                    <span className="font-medium text-sm text-white">
                      {search.name}
                    </span>
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
        <div 
          className="rounded-2xl p-5 space-y-4 border-2"
          style={{
            background: getGradientStyle(theme, 'main'),
            backdropFilter: getBackdropFilter(),
            WebkitBackdropFilter: getBackdropFilter(),
            boxShadow: getBoxShadow('main'),
            borderColor: getBorderColor(theme),
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#F7B600]" />
              <h2 className="font-bold text-white">Filters</h2>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-xs text-blue-600 hover:bg-blue-50"
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
                className="text-xs text-blue-600 hover:bg-blue-50"
              >
                <Bookmark className="w-3 h-3 mr-1" />
                Save
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block text-white">
                Trade Type
              </label>
              <Select value={tradeType} onValueChange={(value) => {
                setTradeType(value);
                if (location) {
                  setTimeout(() => searchLocalTradesmen(), 100);
                }
              }}>
                <SelectTrigger className="border-2 bg-white/85 backdrop-blur-md border-[#1E3A57]/60">
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
              <label className="text-sm font-medium mb-1 block text-white">
                Sort By
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-2 bg-white/85 backdrop-blur-md border-[#1E3A57]/60">
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
              <label className="text-sm font-medium mb-1 block text-white">
                Max {currencySymbol}/hour
              </label>
              <Select value={maxCost} onValueChange={setMaxCost}>
                <SelectTrigger className="border-2 bg-white/85 backdrop-blur-md border-[#1E3A57]/60">
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
              <label className="text-sm font-medium mb-1 block text-white">
                Distance
              </label>
              <Select value={searchRadius.toString()} onValueChange={(v) => setSearchRadius(parseInt(v))}>
                <SelectTrigger className="border-2 bg-white/85 backdrop-blur-md border-[#1E3A57]/60">
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

            <div>
              <label className="text-sm font-medium mb-1 block text-white">
                Min Rating
              </label>
              <Select value={minRating.toString()} onValueChange={(v) => setMinRating(parseFloat(v))}>
                <SelectTrigger className="border-2 bg-white/85 backdrop-blur-md border-[#1E3A57]/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="3.5">3.5+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
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
                <label className="text-sm font-medium mb-2 block text-white">
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
                <label className="text-sm font-medium mb-2 block text-white">
                  Minimum Experience
                </label>
                <Select value={minExperience} onValueChange={setMinExperience}>
                  <SelectTrigger className="border-2 bg-white/85 backdrop-blur-md border-[#1E3A57]/60">
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
                <label className="text-sm font-medium mb-2 block text-white">
                  Availability
                </label>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger className="border-2 bg-white/85 backdrop-blur-md border-[#1E3A57]/60">
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
                <label className="text-sm font-medium mb-2 block text-white">
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
              <p className="text-sm text-white">
                Searching Google Maps, Checkatrade, RatedPeople & local directories...
              </p>
            </div>
          ) : filteredTradesmen.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-[#57CFA4]" />
              <p className="text-white">
                No tradesmen found
              </p>
              <p className="text-sm mt-1 text-white">
                Try enabling location or entering a postcode
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-white">
                {filteredTradesmen.length} tradesmen found
              </p>

              {filteredTradesmen.map((tradesman, i) => (
                <TradespersonCard key={i} tradesperson={{
                  id: i,
                  full_name: tradesman.name,
                  business_name: tradesman.name,
                  primary_specialty: tradesman.trade,
                  service_area: tradesman.address,
                  average_rating: tradesman.rating,
                  total_reviews: tradesman.reviews,
                  hourly_rate: tradesman.hourlyRate,
                  years_in_business: tradesman.yearsExperience,
                  verified: tradesman.verified,
                  availability_status: tradesman.availability === "today" ? "available" : "busy"
                }} />
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

{/* Old card code preserved below as backup */}
{false && (
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
)}