import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, FileText, Send } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PaymentRequestDialog({ job, isOpen, onClose, onComplete }) {
  const { theme } = useTheme();
  const [analyzing, setAnalyzing] = useState(false);
  const [finalCost, setFinalCost] = useState(job.actual_cost || job.estimated_cost || "");
  const [breakdown, setBreakdown] = useState("");
  const [invoiceDetails, setInvoiceDetails] = useState(null);

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this completed job and provide cost confirmation:

Job: ${job.title}
Description: ${job.description}
Estimated Cost: £${job.estimated_cost || "Not specified"}
Hours Worked: ${job.estimated_hours || "Not specified"}
Hourly Rate: £${job.hourly_rate || "Not specified"}

Provide:
1. Suggested final cost (realistic for UK, based on job scope)
2. Professional cost breakdown (labor, materials, additional charges)
3. Invoice line items with descriptions
4. Any adjustment explanations if different from estimate

Be fair and professional.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_cost: { type: "number" },
            breakdown: { type: "string" },
            line_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  amount: { type: "number" }
                }
              }
            },
            adjustment_notes: { type: "string" }
          }
        }
      });

      setFinalCost(result.suggested_cost);
      setBreakdown(result.breakdown);
      setInvoiceDetails(result);
    } catch (error) {
      console.error("AI analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateInvoice = async () => {
    const invoice = {
      job_id: job.id,
      customer_id: job.customer_id,
      customer_name: job.customer_name,
      tradesperson_id: job.tradesperson_id,
      tradesperson_name: job.tradesperson_name,
      job_title: job.title,
      amount: parseFloat(finalCost),
      line_items: invoiceDetails?.line_items || [
        { description: job.title, amount: parseFloat(finalCost) }
      ],
      breakdown: breakdown || invoiceDetails?.breakdown,
      created_date: new Date().toISOString()
    };

    // Update job with final cost and request payment
    await base44.entities.Job.update(job.id, {
      actual_cost: parseFloat(finalCost),
      payment_status: "requested",
      payment_requested_date: new Date().toISOString(),
      notes: breakdown ? `${job.notes || ""}\n\nCost Breakdown:\n${breakdown}` : job.notes,
      status: "completed",
      completion_date: new Date().toISOString()
    });

    // Auto-generate invoice using AI
    try {
      await base44.functions.invoke('generateInvoice', {
        jobId: job.id,
        templateStyle: 'professional',
        additionalNotes: breakdown || ""
      });
    } catch (error) {
      console.error('Invoice generation failed:', error);
    }

    // Send notification to customer
    await base44.entities.Notification.create({
      user_id: job.customer_id,
      title: "Payment Request",
      message: `${job.tradesperson_name} has completed "${job.title}" and is requesting payment of £${finalCost}`,
      type: "payment",
      priority: "high",
      related_entity_type: "Job",
      related_entity_id: job.id
    });

    onComplete(invoice);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-lg",
        theme === "dark" ? "bg-[#1A2F42] border-[#57CFA4]/20" : "bg-white"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Complete Job & Request Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* AI Analysis Button */}
          <Button
            onClick={handleAIAnalysis}
            disabled={analyzing}
            variant="outline"
            className="w-full"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2 text-[#F7B600]" />
                AI Cost Recommendation
              </>
            )}
          </Button>

          {/* Final Cost */}
          <div>
            <Label className={cn(
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-700"
            )}>
              Final Cost (£) *
            </Label>
            <Input
              type="number"
              step="0.01"
              value={finalCost}
              onChange={(e) => setFinalCost(e.target.value)}
              placeholder="Enter final cost"
              className={cn(
                "mt-2",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
            {job.estimated_cost && (
              <p className={cn(
                "text-xs mt-1",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
              )}>
                Original estimate: £{job.estimated_cost}
              </p>
            )}
          </div>

          {/* Cost Breakdown */}
          <div>
            <Label className={cn(
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-700"
            )}>
              Cost Breakdown (Optional)
            </Label>
            <Textarea
              value={breakdown}
              onChange={(e) => setBreakdown(e.target.value)}
              placeholder="E.g., Labor: £200, Materials: £150, Call-out fee: £50"
              className={cn(
                "mt-2 min-h-20",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>

          {/* AI Suggestions */}
          {invoiceDetails && (
            <div className={cn(
              "rounded-xl p-4 border",
              theme === "dark"
                ? "bg-[#F7B600]/10 border-[#F7B600]/30"
                : "bg-[#F7B600]/5 border-[#F7B600]/30"
            )}>
              <p className="text-xs font-medium text-[#F7B600] mb-2">
                AI Recommendations
              </p>
              {invoiceDetails.line_items && (
                <div className="space-y-1">
                  {invoiceDetails.line_items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className={cn(
                        theme === "dark" ? "text-white" : "text-slate-700"
                      )}>
                        {item.description}
                      </span>
                      <span className="font-semibold text-[#F7B600]">
                        £{item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {invoiceDetails.adjustment_notes && (
                <p className={cn(
                  "text-xs mt-2 italic",
                  theme === "dark" ? "text-white/70" : "text-slate-600"
                )}>
                  {invoiceDetails.adjustment_notes}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateInvoice}
              disabled={!finalCost || parseFloat(finalCost) <= 0}
              className="flex-1 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Payment Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}