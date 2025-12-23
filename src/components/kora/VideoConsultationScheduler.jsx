import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Video, Clock, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { format, addMinutes, setHours, setMinutes } from "date-fns";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export default function VideoConsultationScheduler({ 
  tradespersonId, 
  tradespersonName,
  issueId,
  isOpen, 
  onClose 
}) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [duration, setDuration] = useState(30);
  const [step, setStep] = useState(1);

  const createConsultationMutation = useMutation({
    mutationFn: async (data) => {
      const consultation = await base44.entities.VideoConsultation.create(data);
      
      // Send notification
      try {
        await base44.functions.invoke('sendNotification', {
          userId: data.tradesperson_id,
          type: 'consultation_scheduled',
          title: 'New Video Consultation Scheduled',
          message: `${data.customer_name} has scheduled a video consultation with you for ${format(new Date(data.scheduled_date), 'PPpp')}`
        });
      } catch (error) {
        console.error('Notification failed:', error);
      }
      
      return consultation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["consultations"]);
      onClose();
      setStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
    }
  });

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(':');
    const scheduledDateTime = setMinutes(setHours(selectedDate, parseInt(hours)), parseInt(minutes));

    const user = await base44.auth.me();
    
    createConsultationMutation.mutate({
      customer_id: user.id,
      customer_name: user.full_name,
      tradesperson_id: tradespersonId,
      tradesperson_name: tradespersonName,
      issue_id: issueId,
      scheduled_date: scheduledDateTime.toISOString(),
      duration_minutes: duration,
      room_id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            Schedule Video Consultation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Date */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Video consultations allow you to discuss your issue in real-time with {tradespersonName}. 
                    The call will be recorded and AI will extract key points and action items.
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select a date
                </label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-xl border"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((mins) => (
                    <Button
                      key={mins}
                      variant={duration === mins ? "default" : "outline"}
                      onClick={() => setDuration(mins)}
                      className="rounded-xl"
                    >
                      {mins} mins
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!selectedDate}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Select Time */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CalendarIcon className="w-4 h-4" />
                {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">
                  Select a time
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => setSelectedTime(time)}
                      className="rounded-xl"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSchedule}
                  disabled={!selectedTime || createConsultationMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  {createConsultationMutation.isPending ? "Scheduling..." : "Schedule Consultation"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}