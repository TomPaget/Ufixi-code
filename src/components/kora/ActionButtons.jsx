import { Wrench, MessageSquare, Phone, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ActionButtons({ 
  onDIY, 
  onLandlord, 
  onProfessional, 
  userType,
  isPremium,
  responsibility 
}) {
  const showLandlord = userType === "renter" && responsibility === "landlord";

  return (
    <div className="space-y-3">
      <Button
        onClick={onDIY}
        variant="outline"
        className={cn(
          "w-full h-14 rounded-2xl justify-start gap-4 border-2",
          isPremium 
            ? "border-[#6B9080] text-[#6B9080] hover:bg-[#6B9080]/5" 
            : "border-slate-200 text-slate-400"
        )}
        disabled={!isPremium}
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          isPremium ? "bg-[#6B9080]/10" : "bg-slate-100"
        )}>
          {isPremium ? (
            <Wrench className="w-5 h-5" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
        </div>
        <div className="text-left">
          <p className="font-medium">DIY Guide</p>
          <p className="text-xs opacity-70">
            {isPremium ? "Step-by-step instructions" : "Premium feature"}
          </p>
        </div>
      </Button>

      {showLandlord && (
        <Button
          onClick={onLandlord}
          variant="outline"
          className="w-full h-14 rounded-2xl justify-start gap-4 border-2 border-teal-500 text-teal-600 hover:bg-teal-50"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-medium">Talk to Landlord</p>
            <p className="text-xs opacity-70">What to say & your rights</p>
          </div>
        </Button>
      )}

      <Button
        onClick={onProfessional}
        variant="outline"
        className="w-full h-14 rounded-2xl justify-start gap-4 border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Phone className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="font-medium">Find a Professional</p>
          <p className="text-xs opacity-70">What to ask & expect</p>
        </div>
      </Button>
    </div>
  );
}