import { Info } from "lucide-react";

export default function Disclaimer() {
  return (
    <div 
      className="text-slate-800 p-4 rounded-xl border border-2"
      style={{
        background: `linear-gradient(135deg, rgba(219,234,254,0.05) 0%, rgba(191,219,254,0.02) 40%, rgba(147,197,253,0.01) 100%), 
                     radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 40%),
                     radial-gradient(circle at 80% 80%, rgba(147,197,253,0.02) 0%, transparent 50%)`,
        backdropFilter: 'blur(30px) saturate(220%) brightness(1.15) contrast(1.1)',
        WebkitBackdropFilter: 'blur(30px) saturate(220%) brightness(1.15) contrast(1.1)',
        boxShadow: `inset -1px -1px 3px rgba(0,0,0,0.03), 
                    inset 1px 1px 4px rgba(255,255,255,0.15),
                    0 10px 40px rgba(31,65,100,0.05),
                    0 1px 3px rgba(255,255,255,0.1),
                    inset 0 -1px 0px rgba(0,0,0,0.02)`,
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <div className="flex gap-3">
        <Info className="text-slate-800 mt-0.5 lucide lucide-info w-5 h-5 flex-shrink-0" />
        <p className="text-slate-800 text-xs leading-relaxed">Disclaimer: UFixi provides informational guidance only, not professional advice. Always consult qualified professionals for repairs involving electrical, plumbing, structural, or safety-critical systems.

        </p>
      </div>
    </div>);

}