import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { Loader2, Save, Clock } from "lucide-react";

const daysOfWeek = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" }
];

export default function AvailabilityManager({ user }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [availability, setAvailability] = useState({
    accepting_jobs: user?.trades_accepting_jobs !== false,
    emergency_available: user?.trades_emergency_available || false,
    working_days: user?.trades_working_days || ["monday", "tuesday", "wednesday", "thursday", "friday"],
    max_jobs_per_week: user?.trades_max_jobs_per_week || 5
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe({
      trades_accepting_jobs: data.accepting_jobs,
      trades_emergency_available: data.emergency_available,
      trades_working_days: data.working_days,
      trades_max_jobs_per_week: data.max_jobs_per_week
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
    }
  });

  const toggleDay = (dayId) => {
    setAvailability({
      ...availability,
      working_days: availability.working_days.includes(dayId)
        ? availability.working_days.filter(d => d !== dayId)
        : [...availability.working_days, dayId]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(availability);
  };

  return (
    <div className={cn(
      "rounded-2xl p-6 border",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-[#F7B600]" />
        <h2 className={cn(
          "text-xl font-bold",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Availability Settings
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Accepting Jobs Toggle */}
        <div className={cn(
          "flex items-center justify-between p-4 rounded-xl border",
          theme === "dark"
            ? "bg-[#0F1E2E] border-[#57CFA4]/20"
            : "bg-slate-50 border-slate-200"
        )}>
          <div>
            <Label className={cn(
              "text-base font-semibold",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}>
              Accepting New Jobs
            </Label>
            <p className={cn(
              "text-sm mt-1",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Turn this off when you're fully booked
            </p>
          </div>
          <Switch
            checked={availability.accepting_jobs}
            onCheckedChange={(checked) => setAvailability({ ...availability, accepting_jobs: checked })}
          />
        </div>

        {/* Emergency Availability */}
        <div className={cn(
          "flex items-center justify-between p-4 rounded-xl border",
          theme === "dark"
            ? "bg-[#0F1E2E] border-[#57CFA4]/20"
            : "bg-slate-50 border-slate-200"
        )}>
          <div>
            <Label className={cn(
              "text-base font-semibold",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}>
              Emergency Availability
            </Label>
            <p className={cn(
              "text-sm mt-1",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Available for urgent/emergency calls
            </p>
          </div>
          <Switch
            checked={availability.emergency_available}
            onCheckedChange={(checked) => setAvailability({ ...availability, emergency_available: checked })}
          />
        </div>

        {/* Working Days */}
        <div>
          <Label className={cn(
            "text-base font-semibold mb-3 block",
            theme === "dark" ? "text-white" : "text-slate-900"
          )}>
            Working Days
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {daysOfWeek.map((day) => (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                className={cn(
                  "p-3 rounded-xl border-2 font-medium transition-all",
                  availability.working_days.includes(day.id)
                    ? "bg-[#57CFA4] border-[#57CFA4] text-white"
                    : theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/20 text-[#57CFA4] hover:border-[#57CFA4]/40"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Max Jobs Per Week */}
        <div>
          <Label htmlFor="max_jobs" className={cn(
            "text-base font-semibold",
            theme === "dark" ? "text-white" : "text-slate-900"
          )}>
            Maximum Jobs Per Week
          </Label>
          <div className="flex items-center gap-4 mt-2">
            <input
              id="max_jobs"
              type="range"
              min="1"
              max="20"
              value={availability.max_jobs_per_week}
              onChange={(e) => setAvailability({ ...availability, max_jobs_per_week: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className={cn(
              "text-2xl font-bold w-12 text-center",
              theme === "dark" ? "text-[#F7B600]" : "text-blue-600"
            )}>
              {availability.max_jobs_per_week}
            </span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-white"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Availability
            </>
          )}
        </Button>
      </form>
    </div>
  );
}