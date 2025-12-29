import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, CheckCircle2, X, Edit3, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/kora/ThemeProvider";

export default function BookingCard({ booking, isTradesPerson = false }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [showAlternatives, setShowAlternatives] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ status, confirmedDate, confirmedEndDate, notes }) => {
      const updates = { status };
      if (confirmedDate) {
        updates.confirmed_date = confirmedDate;
        updates.confirmed_end_date = confirmedEndDate;
      }

      const updated = await base44.entities.Booking.update(booking.id, updates);

      // Send notification
      await base44.functions.invoke('createBookingNotification', {
        bookingId: booking.id,
        type: status === 'accepted' ? 'booking_accepted' : 
              status === 'declined' ? 'booking_declined' : 
              status === 'confirmed' ? 'booking_confirmed' : 'booking_updated'
      });

      // Add message to conversation
      if (booking.conversation_id) {
        let message = '';
        if (status === 'accepted') {
          message = `✅ Booking accepted for ${format(new Date(booking.proposed_date), "PPP 'at' p")}`;
        } else if (status === 'confirmed') {
          message = `✅ Booking confirmed for ${format(new Date(confirmedDate || booking.proposed_date), "PPP 'at' p")}`;
        } else if (status === 'declined') {
          message = `❌ Booking declined. ${notes || 'Please suggest alternative times.'}`;
        }

        await base44.entities.Message.create({
          conversation_id: booking.conversation_id,
          sender_id: user.id,
          content: message
        });
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['messages']);
    }
  });

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    accepted: "bg-blue-100 text-blue-800 border-blue-300",
    confirmed: "bg-green-100 text-green-800 border-green-300",
    declined: "bg-red-100 text-red-800 border-red-300",
    rescheduled: "bg-orange-100 text-orange-800 border-orange-300",
    completed: "bg-slate-100 text-slate-800 border-slate-300",
    cancelled: "bg-slate-100 text-slate-800 border-slate-300"
  };

  const handleAccept = () => {
    updateBookingMutation.mutate({
      status: 'accepted',
      confirmedDate: booking.proposed_date,
      confirmedEndDate: booking.proposed_end_date
    });
  };

  const handleConfirm = () => {
    updateBookingMutation.mutate({
      status: 'confirmed',
      confirmedDate: booking.confirmed_date || booking.proposed_date,
      confirmedEndDate: booking.confirmed_end_date || booking.proposed_end_date
    });
  };

  const handleDecline = () => {
    updateBookingMutation.mutate({
      status: 'declined',
      notes: 'Not available at this time'
    });
  };

  const displayDate = booking.confirmed_date || booking.proposed_date;
  const displayEndDate = booking.confirmed_end_date || booking.proposed_end_date;
  const duration = displayEndDate ? 
    (new Date(displayEndDate) - new Date(displayDate)) / (1000 * 60 * 60) : 
    booking.estimated_duration;

  return (
    <Card className={cn(
      "rounded-2xl border-2",
      theme === "dark" 
        ? "bg-[#1A2F42] border-[#57CFA4]/20" 
        : "bg-white border-slate-200"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              theme === "dark" ? "bg-[#F7B600]/20" : "bg-[#F7B600]/10"
            )}>
              <User className="w-5 h-5 text-[#F7B600]" />
            </div>
            <div>
              <p className={cn(
                "font-semibold",
                theme === "dark" ? "text-white" : "text-slate-900"
              )}>
                {isTradesPerson ? booking.customer_name : booking.tradesperson_name}
              </p>
              <p className={cn(
                "text-xs",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
              )}>
                {isTradesPerson ? 'Customer' : 'Tradesperson'}
              </p>
            </div>
          </div>
          <Badge className={cn("border", statusColors[booking.status])}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date & Time */}
        <div className="flex items-center gap-2">
          <Calendar className={cn(
            "w-4 h-4",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )} />
          <span className={cn(
            "text-sm",
            theme === "dark" ? "text-slate-300" : "text-slate-700"
          )}>
            {format(new Date(displayDate), "PPP 'at' p")}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2">
          <Clock className={cn(
            "w-4 h-4",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )} />
          <span className={cn(
            "text-sm",
            theme === "dark" ? "text-slate-300" : "text-slate-700"
          )}>
            {duration} {duration === 1 ? 'hour' : 'hours'}
          </span>
        </div>

        {/* Location */}
        {booking.location && (
          <div className="flex items-center gap-2">
            <MapPin className={cn(
              "w-4 h-4",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )} />
            <span className={cn(
              "text-sm",
              theme === "dark" ? "text-slate-300" : "text-slate-700"
            )}>
              {booking.location}
            </span>
          </div>
        )}

        {/* Notes */}
        {booking.notes && (
          <div className={cn(
            "rounded-xl p-3 text-sm",
            theme === "dark" ? "bg-[#0F1E2E]/50" : "bg-slate-50"
          )}>
            <p className={cn(
              theme === "dark" ? "text-slate-300" : "text-slate-700"
            )}>
              {booking.notes}
            </p>
          </div>
        )}

        {/* AI Suggestions */}
        {booking.ai_suggestions?.length > 0 && (
          <div className={cn(
            "rounded-xl p-3",
            theme === "dark" ? "bg-blue-900/30" : "bg-blue-50"
          )}>
            <p className={cn(
              "text-xs font-semibold mb-2 flex items-center gap-1",
              theme === "dark" ? "text-blue-400" : "text-blue-900"
            )}>
              <Sparkles className="w-3 h-3" />
              AI Suggestions:
            </p>
            <ul className="text-xs space-y-1">
              {booking.ai_suggestions.slice(0, 2).map((suggestion, i) => (
                <li key={i} className={cn(
                  theme === "dark" ? "text-blue-300" : "text-blue-800"
                )}>
                  • {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {booking.status === 'pending' && isTradesPerson && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAccept}
              disabled={updateBookingMutation.isPending}
              className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button
              onClick={handleDecline}
              disabled={updateBookingMutation.isPending}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              <X className="w-4 h-4 mr-1" />
              Decline
            </Button>
          </div>
        )}

        {booking.status === 'accepted' && !isTradesPerson && (
          <Button
            onClick={handleConfirm}
            disabled={updateBookingMutation.isPending}
            className="w-full rounded-xl bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Confirm Booking
          </Button>
        )}
      </CardContent>
    </Card>
  );
}