import { Home, Building2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const config = {
  renter: {
    label: "Your Responsibility",
    sublabel: "As the renter",
    icon: Home,
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    iconColor: "text-violet-500"
  },
  landlord: {
    label: "Landlord's Responsibility",
    sublabel: "Contact your landlord",
    icon: Building2,
    bgColor: "bg-teal-50",
    textColor: "text-teal-700",
    iconColor: "text-teal-500"
  },
  homeowner: {
    label: "Your Responsibility",
    sublabel: "As the homeowner",
    icon: Home,
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    iconColor: "text-violet-500"
  },
  varies: {
    label: "Responsibility Varies",
    sublabel: "Check your lease",
    icon: HelpCircle,
    bgColor: "bg-slate-50",
    textColor: "text-slate-700",
    iconColor: "text-slate-500"
  }
};

export default function ResponsibilityTag({ responsibility, userType }) {
  // Adjust display based on user type
  let displayType = responsibility;
  if (userType === "homeowner" && responsibility === "landlord") {
    displayType = "homeowner";
  }

  const { label, sublabel, icon: Icon, bgColor, textColor, iconColor } = config[displayType] || config.varies;

  return (
    <div className={cn("rounded-2xl p-4", bgColor)}>
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0")}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        <div>
          <p className={cn("font-medium", textColor)}>{label}</p>
          <p className={cn("text-sm opacity-75", textColor)}>{sublabel}</p>
        </div>
      </div>
    </div>
  );
}