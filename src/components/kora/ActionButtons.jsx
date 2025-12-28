import { Wrench, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ActionButtons({ 
  onDIY, 
  onLandlord, 
  onProfessional, 
  userType,
  responsibility,
  tradeType
}) {
  const navigate = useNavigate();
  const showLandlord = userType === "renter" && responsibility === "landlord";

  return (
    <div className="space-y-3">
      <Button
        onClick={onDIY}
        variant="outline"
        className="w-full h-14 rounded-2xl justify-start gap-4 border-2 border-emerald-500 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-left">
          <p className="font-medium">DIY Guide</p>
          <p className="text-xs opacity-70">Step-by-step instructions</p>
        </div>
      </Button>

      {showLandlord && (
        <Button
          onClick={onLandlord}
          variant="outline"
          className="w-full h-14 rounded-2xl justify-start gap-4 border-2 border-teal-500 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-left">
            <p className="font-medium">Talk to Landlord</p>
            <p className="text-xs opacity-70">What to say & your rights</p>
          </div>
        </Button>
      )}

      <Button
        onClick={() => {
          if (tradeType) {
            navigate(createPageUrl(`FindTradesmen?trade=${tradeType}`));
          } else {
            onProfessional();
          }
        }}
        variant="outline"
        className="w-full h-14 rounded-2xl justify-start gap-4 border-2 border-blue-500 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <Phone className="w-5 h-5 text-blue-400" />
        </div>
        <div className="text-left">
          <p className="font-medium">Find a Professional</p>
          <p className="text-xs opacity-70">What to ask & expect</p>
        </div>
      </Button>
    </div>
  );
}