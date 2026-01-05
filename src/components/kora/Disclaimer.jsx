import { Info } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex gap-3">
        <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="font-medium text-slate-300">Disclaimer:</span> Fixplain provides informational guidance only, not professional advice. Always consult qualified professionals for repairs involving electrical, plumbing, structural, or safety-critical systems.
        </p>
      </div>
    </div>
  );
}