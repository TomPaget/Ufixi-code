import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, 
  FileText, 
  Search,
  Filter,
  Loader2
} from "lucide-react";
import InvoiceCard from "@/components/contractor/InvoiceCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Invoices() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", user?.id],
    queryFn: () => base44.entities.Invoice.filter({
      tradesperson_id: user.id
    }),
    enabled: !!user
  });

  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           invoice.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === "draft").length,
    sent: invoices.filter(i => i.status === "sent").length,
    paid: invoices.filter(i => i.status === "paid").length,
    totalRevenue: invoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + i.total_amount, 0)
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
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("TradesDashboard"))}
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/20 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className={cn(
              "text-xl font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Invoices
            </h1>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Manage your invoices
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn(
            "rounded-2xl p-4 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <p className={cn(
              "text-xs mb-1",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
            )}>
              Total Invoices
            </p>
            <p className={cn(
              "text-2xl font-bold",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}>
              {stats.total}
            </p>
          </div>
          <div className={cn(
            "rounded-2xl p-4 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <p className={cn(
              "text-xs mb-1",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
            )}>
              Total Revenue
            </p>
            <p className={cn(
              "text-2xl font-bold",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}>
              £{stats.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className={cn(
            "rounded-2xl p-4 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <p className={cn(
              "text-xs mb-1",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
            )}>
              Paid
            </p>
            <p className={cn(
              "text-2xl font-bold text-green-500"
            )}>
              {stats.paid}
            </p>
          </div>
          <div className={cn(
            "rounded-2xl p-4 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <p className={cn(
              "text-xs mb-1",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
            )}>
              Awaiting Payment
            </p>
            <p className={cn(
              "text-2xl font-bold text-blue-500"
            )}>
              {stats.sent}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
            )} />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#57CFA4]" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn(
                "flex-1",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Invoices List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#57CFA4]" />
          </div>
        ) : filteredInvoices.length > 0 ? (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        ) : (
          <div className={cn(
            "text-center py-12 rounded-2xl border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <FileText className={cn(
              "w-12 h-12 mx-auto mb-3",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
            )} />
            <p className={cn(
              "font-medium",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}>
              No invoices found
            </p>
            <p className={cn(
              "text-sm mt-1",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
            )}>
              Invoices are automatically created when jobs are completed
            </p>
          </div>
        )}
      </main>
    </div>
  );
}