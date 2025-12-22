import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { Loader2, Save, Briefcase } from "lucide-react";

const specialties = [
  "plumbing",
  "electrical",
  "hvac",
  "carpentry",
  "roofing",
  "painting",
  "general",
  "appliances"
];

export default function BusinessDetails({ user }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    trades_specialty: user?.trades_specialty || "",
    trades_specialties: user?.trades_specialties || [],
    trades_years_operated: user?.trades_years_operated || "",
    trades_location: user?.trades_location || "",
    trades_service_area: user?.trades_service_area || "",
    trades_company_number: user?.trades_company_number || "",
    trades_vat_number: user?.trades_vat_number || ""
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
    }
  });

  const toggleSpecialty = (specialty) => {
    const current = formData.trades_specialties || [];
    setFormData({
      ...formData,
      trades_specialties: current.includes(specialty)
        ? current.filter(s => s !== specialty)
        : [...current, specialty]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className={cn(
      "rounded-2xl p-6 border",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <div className="flex items-center gap-2 mb-6">
        <Briefcase className="w-5 h-5 text-[#F7B600]" />
        <h2 className={cn(
          "text-xl font-bold",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Business Details
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Primary Specialty */}
        <div>
          <Label htmlFor="specialty" className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
            Primary Specialty
          </Label>
          <Select
            value={formData.trades_specialty}
            onValueChange={(value) => setFormData({ ...formData, trades_specialty: value })}
          >
            <SelectTrigger className={cn(
              "mt-2",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                : "bg-white border-slate-200"
            )}>
              <SelectValue placeholder="Select primary specialty" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((spec) => (
                <SelectItem key={spec} value={spec} className="capitalize">
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Additional Specialties */}
        <div>
          <Label className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
            Additional Specialties (optional)
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {specialties.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => toggleSpecialty(spec)}
                className={cn(
                  "p-2 rounded-lg border text-sm font-medium capitalize transition-all",
                  formData.trades_specialties?.includes(spec)
                    ? "bg-[#57CFA4] border-[#57CFA4] text-white"
                    : theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/20 text-[#57CFA4] hover:border-[#57CFA4]/40"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                )}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Years in Business */}
        <div>
          <Label htmlFor="years" className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
            Years in Business
          </Label>
          <Input
            id="years"
            type="number"
            min="0"
            value={formData.trades_years_operated}
            onChange={(e) => setFormData({ ...formData, trades_years_operated: parseInt(e.target.value) })}
            className={cn(
              "mt-2",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                : "bg-white border-slate-200"
            )}
          />
        </div>

        {/* Location & Service Area */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location" className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
              Base Location
            </Label>
            <Input
              id="location"
              value={formData.trades_location}
              onChange={(e) => setFormData({ ...formData, trades_location: e.target.value })}
              className={cn(
                "mt-2",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
              placeholder="e.g., London, Manchester"
            />
          </div>
          <div>
            <Label htmlFor="service_area" className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
              Service Area (miles)
            </Label>
            <Input
              id="service_area"
              type="number"
              min="0"
              value={formData.trades_service_area}
              onChange={(e) => setFormData({ ...formData, trades_service_area: parseInt(e.target.value) })}
              className={cn(
                "mt-2",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
              placeholder="e.g., 25"
            />
          </div>
        </div>

        {/* Company Registration */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_number" className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
              Company Number (optional)
            </Label>
            <Input
              id="company_number"
              value={formData.trades_company_number}
              onChange={(e) => setFormData({ ...formData, trades_company_number: e.target.value })}
              className={cn(
                "mt-2",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>
          <div>
            <Label htmlFor="vat_number" className={cn(theme === "dark" ? "text-white" : "text-slate-700")}>
              VAT Number (optional)
            </Label>
            <Input
              id="vat_number"
              value={formData.trades_vat_number}
              onChange={(e) => setFormData({ ...formData, trades_vat_number: e.target.value })}
              className={cn(
                "mt-2",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-white"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Business Details
            </>
          )}
        </Button>
      </form>
    </div>
  );
}