import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Calendar, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BookingCard from "@/components/kora/BookingCard";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/kora/ThemeProvider";

export default function Bookings() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("all");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => base44.entities.Booking.list("-created_date")
  });

  const isTradesPerson = user?.account_type === "trades";

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return booking.status === "pending";
    if (activeTab === "confirmed") return ["accepted", "confirmed"].includes(booking.status);
    if (activeTab === "past") return ["completed", "cancelled"].includes(booking.status);
    return true;
  });

  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const confirmedCount = bookings.filter(b => ["accepted", "confirmed"].includes(b.status)).length;

  return (
    <div className={cn(
      "min-h-screen",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-10 border-b-2",
        theme === "dark"
          ? "bg-[#0F1E2E] border-[#57CFA4]"
          : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
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
              "font-bold text-xl",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              My Bookings
            </h1>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>
              Manage your appointments
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={cn(
            "grid w-full grid-cols-4 rounded-2xl p-1",
            theme === "dark"
              ? "bg-[#1A2F42]"
              : "bg-white"
          )}>
            <TabsTrigger value="all" className="rounded-xl">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl">
              Pending
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-yellow-500 text-white">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-xl">
              Confirmed
              {confirmedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-green-500 text-white">
                  {confirmedCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="rounded-xl">
              Past
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl h-32 animate-pulse",
                  theme === "dark"
                    ? "bg-[#1A2F42]"
                    : "bg-white"
                )}
              />
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                isTradesPerson={isTradesPerson}
              />
            ))}
          </div>
        ) : (
          <div className={cn(
            "text-center py-12 rounded-2xl border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
              theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-100"
            )}>
              <Calendar className={cn(
                "w-8 h-8",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
              )} />
            </div>
            <p className={cn(
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            )}>
              No bookings yet
            </p>
            <p className={cn(
              "text-sm mt-1",
              theme === "dark" ? "text-slate-500" : "text-slate-500"
            )}>
              {activeTab === "all" 
                ? "Start by requesting a booking with a tradesperson"
                : `No ${activeTab} bookings`
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
}