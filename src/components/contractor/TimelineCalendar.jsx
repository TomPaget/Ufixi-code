import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  Calendar as CalendarIcon,
  Briefcase,
  Coffee,
  X
} from "lucide-react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
  isWithinInterval
} from "date-fns";
import BlockTimeDialog from "./BlockTimeDialog";

const timeSlots = Array.from({ length: 12 }, (_, i) => 8 + i); // 8am - 7pm

const typeConfig = {
  blocked: { color: "bg-slate-400", icon: X, label: "Blocked" },
  appointment: { color: "bg-blue-500", icon: Briefcase, label: "Appointment" },
  break: { color: "bg-amber-500", icon: Coffee, label: "Break" },
  unavailable: { color: "bg-red-500", icon: Clock, label: "Unavailable" }
};

export default function TimelineCalendar({ userId }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch time blocks for the current week
  const { data: timeBlocks = [], isLoading } = useQuery({
    queryKey: ["timeBlocks", userId, format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const blocks = await base44.entities.TimeBlock.filter({
        tradesperson_id: userId
      });
      
      // Filter blocks that fall within current week
      return blocks.filter(block => {
        const blockStart = parseISO(block.start_time);
        const blockEnd = parseISO(block.end_time);
        return isWithinInterval(blockStart, { start: startOfDay(weekStart), end: endOfDay(weekEnd) }) ||
               isWithinInterval(blockEnd, { start: startOfDay(weekStart), end: endOfDay(weekEnd) });
      });
    },
    enabled: !!userId
  });

  // Fetch jobs/appointments
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs", userId],
    queryFn: () => base44.entities.Job.filter({ 
      tradesperson_id: userId,
      status: { $in: ["accepted", "in_progress"] }
    }),
    enabled: !!userId
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (blockId) => base44.entities.TimeBlock.delete(blockId),
    onSuccess: () => {
      queryClient.invalidateQueries(["timeBlocks"]);
    }
  });

  // Get blocks for a specific time slot
  const getBlocksForSlot = (day, hour) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return timeBlocks.filter(block => {
      const blockStart = parseISO(block.start_time);
      const blockEnd = parseISO(block.end_time);
      
      return isWithinInterval(slotStart, { start: blockStart, end: blockEnd }) ||
             isWithinInterval(slotEnd, { start: blockStart, end: blockEnd }) ||
             (slotStart <= blockStart && slotEnd >= blockEnd);
    });
  };

  // Get jobs for a specific day
  const getJobsForDay = (day) => {
    return jobs.filter(job => {
      if (!job.start_date) return false;
      const jobDate = parseISO(job.start_date);
      return isSameDay(jobDate, day);
    });
  };

  const handleSlotClick = (day, hour) => {
    setSelectedSlot({ 
      date: day, 
      startHour: hour,
      endHour: hour + 1
    });
    setShowBlockDialog(true);
  };

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 border-b flex items-center justify-between",
        theme === "dark" ? "border-[#57CFA4]/20" : "border-slate-200"
      )}>
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-[#F7B600]" />
          <h2 className={cn(
            "text-lg font-bold",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Weekly Timeline
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(new Date())}
            className="rounded-xl text-sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="rounded-xl"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Week Display */}
      <div className="p-4">
        <div className="text-center mb-4">
          <p className={cn(
            "text-sm font-medium",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-xs font-medium text-slate-500"></div>
              {weekDays.map(day => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "text-center p-2 rounded-lg",
                    isSameDay(day, new Date()) && (theme === "dark" 
                      ? "bg-[#57CFA4]/20 text-[#57CFA4]" 
                      : "bg-blue-50 text-blue-600")
                  )}
                >
                  <div className="text-xs font-medium">
                    {format(day, "EEE")}
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    theme === "dark" ? "text-white" : "text-slate-900"
                  )}>
                    {format(day, "d")}
                  </div>
                  {getJobsForDay(day).length > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      {getJobsForDay(day).length} job{getJobsForDay(day).length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="space-y-1">
              {timeSlots.map(hour => (
                <div key={hour} className="grid grid-cols-8 gap-1">
                  <div className={cn(
                    "text-xs font-medium text-right pr-2 py-2",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                  )}>
                    {hour}:00
                  </div>
                  {weekDays.map(day => {
                    const blocks = getBlocksForSlot(day, hour);
                    const hasBlocks = blocks.length > 0;

                    return (
                      <button
                        key={`${day.toISOString()}-${hour}`}
                        onClick={() => handleSlotClick(day, hour)}
                        className={cn(
                          "min-h-12 rounded-lg border transition-all relative group",
                          hasBlocks 
                            ? `${typeConfig[blocks[0].type].color} text-white border-transparent`
                            : theme === "dark"
                              ? "border-[#57CFA4]/10 hover:border-[#57CFA4]/30 hover:bg-[#0F1E2E]/50"
                              : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {hasBlocks && blocks[0] && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                            {React.createElement(typeConfig[blocks[0].type].icon, {
                              className: "w-3 h-3 mb-1"
                            })}
                            <span className="text-[10px] font-medium truncate w-full text-center px-1">
                              {blocks[0].title || typeConfig[blocks[0].type].label}
                            </span>
                          </div>
                        )}
                        {!hasBlocks && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-3 h-3 text-slate-400" />
                          </div>
                        )}
                        {hasBlocks && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlockMutation.mutate(blocks[0].id);
                            }}
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 rounded-full p-0.5 m-0.5"
                          >
                            <X className="w-2 h-2 text-white" />
                          </button>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
          {Object.entries(typeConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded", config.color)} />
              <span className={cn(
                "text-xs font-medium",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                {config.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <BlockTimeDialog
        isOpen={showBlockDialog}
        onClose={() => {
          setShowBlockDialog(false);
          setSelectedSlot(null);
        }}
        userId={userId}
        initialSlot={selectedSlot}
      />
    </div>
  );
}