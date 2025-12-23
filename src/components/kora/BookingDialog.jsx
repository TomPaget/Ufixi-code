import { useState } from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Clock, CreditCard, MessageCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

export default function BookingDialog({ isOpen, onClose, tradesperson, issueId }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");

  const createJobMutation = useMutation({
    mutationFn: async (jobData) => {
      const job = await base44.entities.Job.create(jobData);
      
      // Create conversation
      const conversation = await base44.entities.Conversation.create({
        participant_1_id: jobData.customer_id,
        participant_1_name: jobData.customer_name,
        participant_2_id: jobData.tradesperson_id,
        participant_2_name: jobData.tradesperson_name,
        last_message: `Booking request for ${jobData.title}`,
        last_message_date: new Date().toISOString()
      });
      
      // Send initial message
      await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_id: jobData.customer_id,
        sender_name: jobData.customer_name,
        content: `Hi! I've requested a booking for ${format(new Date(jobData.start_date), "PPP")} at ${selectedTime}. ${description}`
      });

      return { job, conversation };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["jobs"]);
      setStep(4);
    }
  });

  const handleBooking = async () => {
    const user = await base44.auth.me();
    
    createJobMutation.mutate({
      customer_id: user.id,
      customer_name: user.full_name,
      tradesperson_id: tradesperson.id,
      tradesperson_name: tradesperson.full_name,
      title: `${tradesperson.primary_specialty} Service`,
      description: description,
      trade_type: tradesperson.primary_specialty,
      status: "pending",
      priority: "medium",
      start_date: `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00`,
      payment_status: "pending",
      hourly_rate: tradesperson.hourly_rate || 65,
      estimated_hours: 2,
      estimated_cost: (tradesperson.hourly_rate || 65) * 2
    });
  };

  const handleClose = () => {
    setStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setDescription("");
    onClose();
  };

  if (step === 4) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Requested! 🎉</h2>
            <p className="text-slate-600 mb-6">
              {tradesperson.full_name} will review your request and respond within 24 hours.
            </p>
            <div className="space-y-3">
              <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700">
                Done
              </Button>
              <Button variant="outline" className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                View Messages
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl mx-4 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Book {tradesperson.full_name}</DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                step >= s ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
              )}>
                {s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "flex-1 h-1 mx-2",
                  step > s ? "bg-blue-600" : "bg-slate-200"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Select Date
              </h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                className="rounded-xl border"
              />
            </div>

            {selectedDate && (
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Select Time
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        "p-3 rounded-xl border-2 font-medium transition-all",
                        selectedTime === time
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-slate-200 hover:border-blue-300"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => setStep(2)}
              disabled={!selectedDate || !selectedTime}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">Describe the work needed</Label>
              <Textarea
                placeholder="Provide details about what you need done..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-32"
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold mb-2">Booking Summary</h4>
              <div className="space-y-1 text-sm text-slate-600">
                <p>Date: {format(selectedDate, "PPP")}</p>
                <p>Time: {selectedTime}</p>
                <p>Tradesperson: {tradesperson.full_name}</p>
                <p>Rate: £{tradesperson.hourly_rate || 65}/hour</p>
                <p>Est. Cost: £{(tradesperson.hourly_rate || 65) * 2} (2 hours)</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!description.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Payment Method
              </h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border rounded-xl p-4 hover:border-blue-500 transition-colors">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      <div className="font-medium">Credit/Debit Card</div>
                      <div className="text-sm text-slate-500">Pay securely with card</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-xl p-4 hover:border-blue-500 transition-colors">
                    <RadioGroupItem value="invoice" id="invoice" />
                    <Label htmlFor="invoice" className="flex-1 cursor-pointer">
                      <div className="font-medium">Pay After Service</div>
                      <div className="text-sm text-slate-500">Receive invoice after completion</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>How it works:</strong> Your booking request is sent to the tradesperson. 
                Once they accept, you'll be able to message them directly. Payment is processed after service completion.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleBooking}
                disabled={createJobMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {createJobMutation.isPending ? "Sending..." : "Send Booking Request"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}