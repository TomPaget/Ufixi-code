import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Search,
  Home,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import IssueCard from "@/components/kora/IssueCard";

export default function PropertyIssues() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: allIssues = [], isLoading } = useQuery({
    queryKey: ["business-issues"],
    queryFn: () => base44.entities.Issue.list("-created_date", 1000),
    enabled: user?.account_type === "business"
  });

  // Group issues by property
  const propertiesMap = {};
  allIssues.forEach(issue => {
    if (issue.property_name) {
      if (!propertiesMap[issue.property_name]) {
        propertiesMap[issue.property_name] = {
          name: issue.property_name,
          address: issue.property_address || "No address",
          category: issue.property_category || "residential",
          issues: []
        };
      }
      propertiesMap[issue.property_name].issues.push(issue);
    }
  });

  const properties = Object.values(propertiesMap);

  // Filter properties based on search and category
  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || property.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Paginate properties
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const categoryColors = {
    residential: "from-blue-500 to-blue-600",
    commercial: "from-purple-500 to-purple-600",
    rental: "from-green-500 to-green-600",
    sale_listing: "from-orange-500 to-orange-600",
    inspection: "from-pink-500 to-pink-600"
  };

  if (!user || user.account_type !== "business") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-slate-600 mb-4">This feature is only available for business accounts</p>
          <Button onClick={() => navigate(createPageUrl("BusinessPricing"))}>
            Upgrade to Business
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 border-b",
        theme === "dark" 
          ? "bg-[#0F1E2E] border-[#57CFA4]/20" 
          : "bg-white border-slate-200"
      )}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/10 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className={cn(
              "text-lg font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Property Issues
            </h1>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              {properties.length} properties • {allIssues.length} total issues
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
            )} />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {["all", "residential", "commercial", "rental", "sale_listing", "inspection"].map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "whitespace-nowrap capitalize",
                  selectedCategory === cat
                    ? "bg-[#4BC896] hover:bg-[#4BC896]/90 text-[#1E3A57] border-[#4BC896]"
                    : theme === "dark"
                      ? "border-[#57CFA4]/30 text-white hover:bg-[#57CFA4]/10"
                      : "bg-white text-[#1E3A57] border-slate-200 hover:bg-slate-50"
                )}
              >
                {cat.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Pagination Info */}
        {filteredProperties.length > 0 && (
          <div className="flex items-center justify-between">
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Showing {((page - 1) * itemsPerPage) + 1}-{Math.min(page * itemsPerPage, filteredProperties.length)} of {filteredProperties.length}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className={cn(
                  "text-sm px-3",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl h-64 animate-pulse",
                  theme === "dark" ? "bg-[#1A2F42]" : "bg-slate-200"
                )}
              />
            ))}
          </div>
        ) : paginatedProperties.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProperties.map((property) => {
              const activeIssues = property.issues.filter(i => i.status === "active").length;
              const resolvedIssues = property.issues.filter(i => i.status === "resolved").length;
              const inProgressIssues = property.issues.filter(i => i.status === "in_progress").length;

              return (
                <div
                  key={property.name}
                  className={cn(
                    "rounded-2xl border overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                    theme === "dark"
                      ? "bg-[#1A2F42] border-[#57CFA4]/20"
                      : "bg-white border-slate-200"
                  )}
                  onClick={() => navigate(createPageUrl(`PropertyDetail?name=${encodeURIComponent(property.name)}`))}
                >
                  {/* Property Header */}
                  <div className={cn(
                    "p-4 bg-gradient-to-br text-white",
                    categoryColors[property.category] || "from-slate-500 to-slate-600"
                  )}>
                    <div className="flex items-start justify-between mb-2">
                      <Building2 className="w-6 h-6" />
                      <span className="text-xs px-2 py-1 rounded-full bg-white/20 capitalize">
                        {property.category.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{property.name}</h3>
                    <div className="flex items-center gap-1 text-sm opacity-90">
                      <MapPin className="w-3 h-3" />
                      <p className="text-xs">{property.address}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className={cn(
                        "text-center p-2 rounded-xl",
                        theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
                      )}>
                        <AlertCircle className="w-4 h-4 mx-auto mb-1 text-red-500" />
                        <p className={cn(
                          "text-lg font-bold",
                          theme === "dark" ? "text-white" : "text-[#1E3A57]"
                        )}>
                          {activeIssues}
                        </p>
                        <p className={cn(
                          "text-xs",
                          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                        )}>
                          Active
                        </p>
                      </div>

                      <div className={cn(
                        "text-center p-2 rounded-xl",
                        theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
                      )}>
                        <Clock className="w-4 h-4 mx-auto mb-1 text-[#F7B600]" />
                        <p className={cn(
                          "text-lg font-bold",
                          theme === "dark" ? "text-white" : "text-[#1E3A57]"
                        )}>
                          {inProgressIssues}
                        </p>
                        <p className={cn(
                          "text-xs",
                          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                        )}>
                          In Progress
                        </p>
                      </div>

                      <div className={cn(
                        "text-center p-2 rounded-xl",
                        theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
                      )}>
                        <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-[#57CFA4]" />
                        <p className={cn(
                          "text-lg font-bold",
                          theme === "dark" ? "text-white" : "text-[#1E3A57]"
                        )}>
                          {resolvedIssues}
                        </p>
                        <p className={cn(
                          "text-xs",
                          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                        )}>
                          Resolved
                        </p>
                      </div>
                    </div>

                    {/* Recent Issues Preview */}
                    {property.issues.length > 0 && (
                      <div className={cn(
                        "text-xs pt-3 border-t",
                        theme === "dark" ? "border-[#57CFA4]/20" : "border-slate-200"
                      )}>
                        <p className={cn(
                          "font-medium mb-1",
                          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                        )}>
                          Latest issue:
                        </p>
                        <p className={cn(
                          "truncate",
                          theme === "dark" ? "text-white" : "text-[#1E3A57]"
                        )}>
                          {property.issues[0].title}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={cn(
            "text-center py-16 rounded-2xl border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <Home className={cn(
              "w-12 h-12 mx-auto mb-4",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
            )} />
            <p className={cn(
              "mb-2",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              No properties found
            </p>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Start scanning issues with property details to see them here
            </p>
          </div>
        )}
      </main>
    </div>
  );
}