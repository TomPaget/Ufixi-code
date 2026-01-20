import { Info } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="bg-slate-100 text-slate-800 p-4 rounded-xl border border-slate-700/50">
      <div className="flex gap-3">
        <Info className="text-slate-800 mt-0.5 lucide lucide-info w-5 h-5 flex-shrink-0" />
        <p className="text-slate-800 text-xs leading-relaxed">Disclaimer: Fixplain provides informational guidance only, not professional advice. Always consult qualified professionals for repairs involving electrical, plumbing, structural, or safety-critical systems.

        </p>
      </div>
    </div>);

}