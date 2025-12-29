import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Loader2, Sparkles } from "lucide-react";
import { format, addDays, setHours, setMinutes } from "date-fns";

export default function BookingDialog({ 
  open, 
  onClose, 
  tradespersonId, 
  tradespersonName,
  jobId,
  conversationId 
}) {
  const queryClient = useQueryClient();
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("09:00");
  const [duration, setDuration] = useState(2);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      const booking = await base44.entities.Booking.create(bookingData);
      
      // Send notification to tradesperson
      await base44.functions.invoke('createBookingNotification', {
        bookingId: booking.id,
        type: 'new_booking_request'
      });
      
      // Add message to conversation if exists
      if (conversationId) {
        await base44.entities.Message.create({
          conversation_id: conversationId,
          sender_id: bookingData.customer_id,
          content: `📅 New booking request for ${format(new Date(bookingData.proposed_date), "PPP 'at' p")}\nDuration: ${duration} hours\nLocation: ${location || 'To be confirmed'}`
        });
      }
      
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['messages']);
      onClose();
    }
  });

  const getAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const { data } = await base44.functions.invoke('getAISchedulingSuggestions', {
        tradespersonId,
        proposedDate: proposedDate ? new Date(`${proposedDate}T${proposedTime}`).toISOString() : null,
        duration,
        notes
      });
      setAiSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const user = await base44.auth.me();
    const startDateTime = new Date(`${proposedDate}T${proposedTime}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

    await createBookingMutation.mutateAsync({
      job_id: jobId,
      customer_id: user.id,
      customer_name: user.full_name,
      tradesperson_id: tradespersonId,
      tradesperson_name: tradespersonName,
      conversation_id: conversationId,
      proposed_date: startDateTime.toISOString(),
      proposed_end_date: endDateTime.toISOString(),
      estimated_duration: duration,
      location,
      notes,
      ai_suggestions: aiSuggestions,
      status: 'pending'
    });
  };

  const quickDates = [
    { label: "Tomorrow", date: addDays(new Date(), 1) },
    { label: "In 2 Days", date: addDays(new Date(), 2) },
    { label: "Next Week", date: addDays(new Date(), 7) }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-4 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label>Propose a Date & Time</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <Input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <Input
                  type="time"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
            </div>
            
            {/* Quick Date Buttons */}
            <div className="flex gap-2 mt-2">
              {quickDates.map((quick) => (
                <Button
                  key={quick.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProposedDate(format(quick.date, "yyyy-MM-dd"))}
                  className="text-xs"
                >
                  {quick.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Estimated Duration (hours)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              min="0.5"
              step="0.5"
              required
              className="rounded-xl mt-2"
            />
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., 123 Main St, London"
              className="rounded-xl mt-2"
            />
          </div>

          <div>
            <Label>Additional Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requirements or details..."
              className="rounded-xl mt-2 min-h-20"
            />
          </div>

          {/* AI Suggestions */}
          {proposedDate && (
            <Button
              type="button"
              variant="outline"
              onClick={getAISuggestions}
              disabled={loadingAI}
              className="w-full rounded-xl"
            >
              {loadingAI ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting AI Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get AI Scheduling Suggestions
                </>
              )}
            </Button>
          )}

          {aiSuggestions.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Suggestions:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                {aiSuggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBookingMutation.isPending}
              className="flex-1 rounded-xl bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Send Booking Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}