import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Download, 
  Send, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Ban
} from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  draft: { color: "bg-slate-100 text-slate-700", icon: FileText, label: "Draft" },
  sent: { color: "bg-blue-100 text-blue-700", icon: Send, label: "Sent" },
  paid: { color: "bg-green-100 text-green-700", icon: CheckCircle2, label: "Paid" },
  overdue: { color: "bg-red-100 text-red-700", icon: AlertCircle, label: "Overdue" },
  cancelled: { color: "bg-slate-100 text-slate-500", icon: Ban, label: "Cancelled" }
};

export default function InvoiceCard({ invoice }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);

  const StatusIcon = statusConfig[invoice.status]?.icon || FileText;

  const downloadInvoice = async () => {
    try {
      const response = await base44.functions.invoke('generateInvoice', {
        jobId: invoice.job_id,
        templateStyle: invoice.template_style
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const sendInvoice = async () => {
    setSending(true);
    try {
      await base44.functions.invoke('sendInvoiceEmail', {
        invoiceId: invoice.id
      });
      queryClient.invalidateQueries(['invoices']);
    } catch (error) {
      console.error('Send failed:', error);
    } finally {
      setSending(false);
    }
  };

  const markAsPaid = async () => {
    try {
      await base44.entities.Invoice.update(invoice.id, {
        status: 'paid',
        paid_date: new Date().toISOString()
      });
      queryClient.invalidateQueries(['invoices']);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <div className={cn(
      "rounded-2xl border p-5",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
          )}>
            <FileText className="w-6 h-6 text-[#F7B600]" />
          </div>
          <div>
            <h3 className={cn(
              "font-semibold",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}>
              {invoice.invoice_number}
            </h3>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              {invoice.customer_name}
            </p>
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
          statusConfig[invoice.status]?.color
        )}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig[invoice.status]?.label}
        </div>
      </div>

      <div className={cn(
        "grid grid-cols-2 gap-4 mb-4 p-3 rounded-xl",
        theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
      )}>
        <div>
          <p className={cn(
            "text-xs",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
          )}>
            Amount
          </p>
          <p className={cn(
            "text-lg font-bold",
            theme === "dark" ? "text-white" : "text-slate-900"
          )}>
            £{invoice.total_amount.toFixed(2)}
          </p>
        </div>
        <div>
          <p className={cn(
            "text-xs",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
          )}>
            Due Date
          </p>
          <p className={cn(
            "text-sm font-medium",
            theme === "dark" ? "text-white" : "text-slate-900"
          )}>
            {format(new Date(invoice.due_date), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={downloadInvoice}
          className="flex-1 rounded-xl"
        >
          <Download className="w-4 h-4 mr-1" />
          Download
        </Button>
        
        {invoice.status === 'draft' && (
          <Button
            size="sm"
            onClick={sendInvoice}
            disabled={sending}
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-1" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        )}
        
        {invoice.status === 'sent' && (
          <Button
            size="sm"
            onClick={markAsPaid}
            className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Mark Paid
          </Button>
        )}
      </div>
    </div>
  );
}