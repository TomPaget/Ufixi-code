import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Home, 
  Flame, 
  Calendar,
  Plus,
  X,
  Loader2,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function HomeProfile() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [propertyType, setPropertyType] = useState("");
  const [propertyAge, setPropertyAge] = useState("");
  const [heatingType, setHeatingType] = useState("");
  const [heatingLastService, setHeatingLastService] = useState("");
  const [appliances, setAppliances] = useState([]);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(true);
  const [generating, setGenerating] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    if (user) {
      setPropertyType(user.property_type || "");
      setPropertyAge(user.property_age || "");
      setHeatingType(user.heating_type || "");
      setHeatingLastService(user.heating_last_service || "");
      setAppliances(user.appliances || []);
      setMaintenanceEnabled(user.maintenance_reminders_enabled !== false);
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
    }
  });

  const addAppliance = () => {
    setAppliances([...appliances, { name: "", type: "", age_years: "", last_service: "" }]);
  };

  const removeAppliance = (index) => {
    setAppliances(appliances.filter((_, i) => i !== index));
  };

  const updateAppliance = (index, field, value) => {
    const updated = [...appliances];
    updated[index][field] = value;
    setAppliances(updated);
  };

  const generateReminders = async () => {
    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this home profile, suggest 5-8 proactive maintenance reminders:

Property Type: ${propertyType || "not specified"}
Property Age: ${propertyAge || "not specified"}
Heating System: ${heatingType || "not specified"}
Last Heating Service: ${heatingLastService || "not specified"}
Appliances: ${appliances.length > 0 ? appliances.map(a => `${a.name} (${a.age_years} years old)`).join(", ") : "none listed"}

For each maintenance task, provide:
- Title (short, e.g., "Service Boiler")
- Description (what needs to be done)
- Recommended frequency in months (1, 3, 6, 12, etc.)
- Category (hvac, plumbing, electrical, appliances, exterior, other)
- Priority (high, medium, low) based on safety and property age

Focus on:
1. Safety-critical tasks
2. Tasks that prevent expensive damage
3. Seasonal maintenance
4. Appliance-specific servicing

Return realistic, UK-standard maintenance schedules.`,
        response_json_schema: {
          type: "object",
          properties: {
            reminders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  frequency_months: { type: "number" },
                  category: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] }
                },
                required: ["title", "description", "frequency_months", "category"]
              }
            }
          },
          required: ["reminders"]
        }
      });

      // Create reminders
      const today = new Date();
      const reminderPromises = response.reminders.map(r => {
        const reminderDate = new Date(today);
        reminderDate.setMonth(reminderDate.getMonth() + 1); // Start in 1 month

        const repeatFrequency = 
          r.frequency_months === 1 ? "monthly" :
          r.frequency_months === 3 ? "quarterly" :
          r.frequency_months === 6 ? "biannually" :
          r.frequency_months === 12 ? "yearly" : "none";

        return base44.entities.Reminder.create({
          title: r.title,
          description: r.description,
          reminder_date: reminderDate.toISOString().split("T")[0],
          repeat_frequency: repeatFrequency,
          category: r.category,
          is_completed: false
        });
      });

      await Promise.all(reminderPromises);

      await base44.auth.updateMe({
        last_maintenance_check: new Date().toISOString().split("T")[0]
      });

      queryClient.invalidateQueries(["reminders"]);
      
      navigate(createPageUrl("Reminders"));
    } catch (error) {
      console.error("Failed to generate reminders:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      property_type: propertyType,
      property_age: propertyAge,
      heating_type: heatingType,
      heating_last_service: heatingLastService,
      appliances: appliances.filter(a => a.name && a.type),
      maintenance_reminders_enabled: maintenanceEnabled
    });
  };

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-xl",
                theme === "dark"
                  ? "hover:bg-[#57CFA4]/20 text-[#57CFA4]"
                  : "hover:bg-slate-100 text-[#1E3A57]"
              )}
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={cn(
              "font-bold text-lg",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>Home Profile</h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] font-semibold"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Info Banner */}
        <div className={cn(
          "rounded-2xl p-4 border",
          theme === "dark"
            ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
            : "bg-[#57CFA4]/10 border-[#57CFA4]/30"
        )}>
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#F7B600] flex-shrink-0 mt-0.5" />
            <div>
              <p className={cn(
                "text-sm font-medium mb-1",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                Get Proactive Maintenance Reminders
              </p>
              <p className={cn(
                "text-xs",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>
                Tell us about your home and we'll suggest maintenance tasks to prevent issues before they happen
              </p>
            </div>
          </div>
        </div>

        {/* Property Type */}
        <div>
          <Label className={cn(
            "mb-3 flex items-center gap-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            <Home className="w-4 h-4" />
            Property Type
          </Label>
          <RadioGroup value={propertyType} onValueChange={setPropertyType}>
            <div className="grid grid-cols-2 gap-3">
              {["house", "apartment", "flat", "bungalow", "other"].map(type => (
                <label
                  key={type}
                  className={cn(
                    "flex items-center space-x-2 p-3 rounded-xl border-2 cursor-pointer transition-colors",
                    propertyType === type
                      ? "border-[#F7B600] bg-[#F7B600]/10"
                      : theme === "dark"
                        ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                        : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <RadioGroupItem value={type} id={type} />
                  <Label htmlFor={type} className="capitalize cursor-pointer">{type}</Label>
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Property Age */}
        <div>
          <Label className={cn(
            "mb-3 flex items-center gap-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            <Calendar className="w-4 h-4" />
            Property Age
          </Label>
          <RadioGroup value={propertyAge} onValueChange={setPropertyAge}>
            <div className="space-y-2">
              {[
                { value: "new_build", label: "New Build (0-2 years)" },
                { value: "0-10_years", label: "0-10 years" },
                { value: "10-20_years", label: "10-20 years" },
                { value: "20-50_years", label: "20-50 years" },
                { value: "50+_years", label: "50+ years" }
              ].map(age => (
                <label
                  key={age.value}
                  className={cn(
                    "flex items-center space-x-2 p-3 rounded-xl border-2 cursor-pointer transition-colors",
                    propertyAge === age.value
                      ? "border-[#F7B600] bg-[#F7B600]/10"
                      : theme === "dark"
                        ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                        : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <RadioGroupItem value={age.value} id={age.value} />
                  <Label htmlFor={age.value} className="cursor-pointer">{age.label}</Label>
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Heating System */}
        <div>
          <Label className={cn(
            "mb-3 flex items-center gap-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            <Flame className="w-4 h-4" />
            Heating System
          </Label>
          <RadioGroup value={heatingType} onValueChange={setHeatingType}>
            <div className="space-y-2">
              {[
                { value: "gas_boiler", label: "Gas Boiler" },
                { value: "electric_boiler", label: "Electric Boiler" },
                { value: "heat_pump", label: "Heat Pump" },
                { value: "electric_heaters", label: "Electric Heaters" },
                { value: "other", label: "Other" }
              ].map(heating => (
                <label
                  key={heating.value}
                  className={cn(
                    "flex items-center space-x-2 p-3 rounded-xl border-2 cursor-pointer transition-colors",
                    heatingType === heating.value
                      ? "border-[#F7B600] bg-[#F7B600]/10"
                      : theme === "dark"
                        ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                        : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <RadioGroupItem value={heating.value} id={heating.value} />
                  <Label htmlFor={heating.value} className="cursor-pointer">{heating.label}</Label>
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Last Service Date */}
        {heatingType && (
          <div>
            <Label className={cn(
              "mb-2 block",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Last Heating Service Date
            </Label>
            <Input
              type="date"
              value={heatingLastService}
              onChange={(e) => setHeatingLastService(e.target.value)}
              className={cn(
                "border-2",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-[#1E3A57]/20"
              )}
            />
          </div>
        )}

        {/* Appliances */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className={cn(
              "flex items-center gap-2",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Major Appliances
            </Label>
            <Button
              size="sm"
              variant="outline"
              onClick={addAppliance}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {appliances.length === 0 ? (
            <div className={cn(
              "text-center py-6 rounded-xl border-2 border-dashed",
              theme === "dark"
                ? "border-[#57CFA4]/30 text-[#57CFA4]"
                : "border-slate-200 text-slate-500"
            )}>
              <p className="text-sm">No appliances added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appliances.map((appliance, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-xl border-2 space-y-3",
                    theme === "dark"
                      ? "border-[#57CFA4]/30 bg-[#1A2F42]"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <Label className={cn(
                      "text-sm font-semibold",
                      theme === "dark" ? "text-white" : "text-[#1E3A57]"
                    )}>
                      Appliance {index + 1}
                    </Label>
                    <button
                      onClick={() => removeAppliance(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Name</Label>
                      <Input
                        placeholder="e.g., Washing Machine"
                        value={appliance.name}
                        onChange={(e) => updateAppliance(index, "name", e.target.value)}
                        className={cn(
                          "text-sm",
                          theme === "dark"
                            ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                            : "bg-white border-slate-200"
                        )}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Type</Label>
                      <Input
                        placeholder="e.g., Bosch"
                        value={appliance.type}
                        onChange={(e) => updateAppliance(index, "type", e.target.value)}
                        className={cn(
                          "text-sm",
                          theme === "dark"
                            ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                            : "bg-white border-slate-200"
                        )}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Age (years)</Label>
                      <Input
                        type="number"
                        placeholder="5"
                        value={appliance.age_years}
                        onChange={(e) => updateAppliance(index, "age_years", e.target.value)}
                        className={cn(
                          "text-sm",
                          theme === "dark"
                            ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                            : "bg-white border-slate-200"
                        )}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Last Service</Label>
                      <Input
                        type="date"
                        value={appliance.last_service}
                        onChange={(e) => updateAppliance(index, "last_service", e.target.value)}
                        className={cn(
                          "text-sm",
                          theme === "dark"
                            ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                            : "bg-white border-slate-200"
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance Reminders Toggle */}
        <div className={cn(
          "flex items-center justify-between p-4 rounded-xl border",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/30"
            : "bg-white border-slate-200"
        )}>
          <div>
            <p className={cn(
              "font-medium",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Proactive Reminders
            </p>
            <p className={cn(
              "text-xs mt-0.5",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Get automated maintenance suggestions
            </p>
          </div>
          <Switch
            checked={maintenanceEnabled}
            onCheckedChange={setMaintenanceEnabled}
          />
        </div>

        {/* Generate Reminders Button */}
        {maintenanceEnabled && (propertyType || heatingType || appliances.length > 0) && (
          <Button
            onClick={generateReminders}
            disabled={generating || updateMutation.isPending}
            className="w-full bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-white rounded-xl h-12"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Reminders...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Generate Maintenance Reminders
              </>
            )}
          </Button>
        )}

        <p className={cn(
          "text-xs text-center",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
        )}>
          Based on your home profile, we'll create personalized maintenance reminders to keep your property in top condition
        </p>
      </main>
    </div>
  );
}