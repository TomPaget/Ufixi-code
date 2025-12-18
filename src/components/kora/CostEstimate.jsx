import { Wrench, HardHat } from "lucide-react";

export default function CostEstimate({ 
  diyMin, 
  diyMax, 
  proMin, 
  proMax, 
  isPremium = false 
}) {
  const formatCost = (min, max) => {
    if (!isPremium) return "Upgrade to see";
    if (!min && !max) return "Varies";
    if (min === max) return `$${min}`;
    return `$${min} - $${max}`;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <Wrench className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">DIY</span>
        </div>
        <p className={`font-semibold ${isPremium ? 'text-slate-200 text-lg' : 'text-slate-500 text-sm'}`}>
          {formatCost(diyMin, diyMax)}
        </p>
      </div>
      
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <HardHat className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Pro</span>
        </div>
        <p className={`font-semibold ${isPremium ? 'text-slate-200 text-lg' : 'text-slate-500 text-sm'}`}>
          {formatCost(proMin, proMax)}
        </p>
      </div>
    </div>
  );
}