import { ShieldCheck } from "lucide-react";

export default function InsightsPrivacyBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl p-4 mb-6" style={{ background: "rgba(29,158,117,0.08)", border: "1px solid rgba(29,158,117,0.25)" }}>
      <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#1D9E75" }} />
      <div>
        <p className="text-sm font-semibold mb-0.5" style={{ color: "#1D9E75" }}>Privacy Confirmed — No Personal Data</p>
        <p className="text-xs leading-relaxed" style={{ color: "#065f46" }}>
          All records in this dataset are fully anonymised. No names, email addresses, full postcodes, phone numbers, or any other personally identifiable information (PII) is stored or displayed. 
          Only partial postcode areas (e.g. <em>SW1</em>, <em>M1</em>) or region names are used for geographic aggregation. This dataset is safe for commercial sharing and complies with UK GDPR data minimisation principles.
        </p>
      </div>
    </div>
  );
}