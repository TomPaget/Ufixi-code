import { Info } from "lucide-react";

export default function Disclaimer() {
  return (
    <div 
      className="text-slate-800 p-4 rounded-xl border bg-white/40 backdrop-blur-md border-slate-200"
    >
      <div className="flex gap-3">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#1a2f42' }} />
        <p className="text-xs leading-relaxed" style={{ color: '#1a2f42' }}>Disclaimer: UFixi provides informational guidance only, not professional advice. Always consult qualified professionals for repairs involving electrical, plumbing, structural, or safety-critical systems.

        </p>
      </div>
    </div>
  );
}