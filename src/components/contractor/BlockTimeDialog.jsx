import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { Clock, Repeat, Calendar as CalendarIcon } from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";

export default function BlockTimeDialog({ isOpen, onClose, userId, initialSlot }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    type: "blocked",
    startDate: null,
    startTime: "09:00",
    endTime: "17:00",
    recurring: false,
    recurrence_pattern: "weekly",
    recurrence_end_date: null,
    notes: ""
  });

  useEffect(() => {
    if (initialSlot) {
      setFormData(prev => ({
        ...prev,
        startDate: initialSlot.date,
        startTime: `${initialSlot.startHour.toString().padStart(2, '0')}:00`,
        endTime: `${initialSlot.endHour.toString().padStart(2, '0')}:00`
      }));
    }
  }, [initialSlot]);

  const createBlockMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeBlock.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["timeBlocks"]);
      onClose();
      setFormData({
        title: "",
        type: "blocked",
        startDate: null,
        startTime: "09:00",
        endTime: "17:00",
        recurring: false,
        recurrence_pattern: "weekly",
        recurrence_end_date: null,
        notes: ""
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.startDate) return;

    const [startHour, startMin] = formData.startTime.split(':');
    const [endHour, endMin] = formData.endTime.split(':');
    
    const startDateTime = setMinutes(
      setHours(formData.startDate, parseInt(startHour)), 
      parseInt(startMin)
    );
    const endDateTime = setMinutes(
      setHours(formData.startDate, parseInt(endHour)), 
      parseInt(endMin)
    );

    const blockData = {
      tradesperson_id: userId,
      title: formData.title,
      type: formData.type,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      recurring: formData.recurring,
      notes: formData.notes
    };

    if (formData.recurring) {
      blockData.recurrence_pattern = formData.recurrence_pattern;
      if (formData.recurrence_end_date) {
        blockData.recurrence_end_date = format(formData.recurrence_end_date, "yyyy-MM-dd");
      }
    }

    createBlockMutation.mutate(blockData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Block Time Slot
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Lunch break, Personal appointment"
              required
            />
          </div>

          {/* Type */}
          <div>
            <Label className="mb-2 block">Type</Label>
            <RadioGroup value={formData.type} onValueChange={(type) => setFormData({ ...formData, type })}>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "blocked", label: "Blocked", color: "bg-slate-400" },
                  { value: "appointment", label: "Appointment", color: "bg-blue-500" },
                  { value: "break", label: "Break", color: "bg-amber-500" },
                  { value: "unavailable", label: "Unavailable", color: "bg-red-500" }
                ].map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center space-x-2 border rounded-xl p-3",
                      formData.type === option.value && "border-blue-500 bg-blue-50"
                    )}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                      <div className={cn("w-3 h-3 rounded", option.color)} />
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Date */}
          <div>
            <Label className="mb-2 block flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Date
            </Label>
            <Calendar
              mode="single"
              selected={formData.startDate}
              onSelect={(date) => setFormData({ ...formData, startDate: date })}
              disabled={(date) => date < new Date()}
              className="rounded-xl border"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Recurring */}
          <div className={cn(
            "border rounded-xl p-4",
            theme === "dark" ? "border-[#57CFA4]/20" : "border-slate-200"
          )}>
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Recurring
              </Label>
              <Switch
                checked={formData.recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, recurring: checked })}
              />
            </div>

            {formData.recurring && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm mb-2 block">Repeat Pattern</Label>
                  <RadioGroup 
                    value={formData.recurrence_pattern} 
                    onValueChange={(pattern) => setFormData({ ...formData, recurrence_pattern: pattern })}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "daily", label: "Daily" },
                        { value: "weekly", label: "Weekly" },
                        { value: "biweekly", label: "Bi-weekly" },
                        { value: "monthly", label: "Monthly" }
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`pattern-${option.value}`} />
                          <Label htmlFor={`pattern-${option.value}`} className="cursor-pointer text-sm">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">End Recurrence (Optional)</Label>
                  <Calendar
                    mode="single"
                    selected={formData.recurrence_end_date}
                    onSelect={(date) => setFormData({ ...formData, recurrence_end_date: date })}
                    disabled={(date) => date < new Date()}
                    className="rounded-xl border"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional details..."
              className="min-h-20"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.startDate || createBlockMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {createBlockMutation.isPending ? "Creating..." : "Block Time"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}