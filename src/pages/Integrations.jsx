import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Check,
  X,
  RefreshCw,
  Settings as SettingsIcon,
  AlertCircle,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const integrations = [
  {
    id: "reapit",
    name: "Reapit",
    category: "property",
    icon: Building2,
    color: "from-blue-500 to-blue-600",
    description: "Sync property listings, viewings, and maintenance records",
    features: ["Property sync", "Viewing schedules", "Issue tracking", "Tenant details"]
  },
  {
    id: "yardi",
    name: "Yardi",
    category: "property",
    icon: Building2,
    color: "from-green-500 to-green-600",
    description: "Connect property management data and maintenance workflows",
    features: ["Portfolio sync", "Work orders", "Tenant management", "Asset tracking"]
  },
  {
    id: "arthur_online",
    name: "Arthur Online",
    category: "property",
    icon: Building2,
    color: "from-purple-500 to-purple-600",
    description: "Estate agency CRM integration for seamless property management",
    features: ["Property details", "Client data", "Valuations", "Marketing"]
  },
  {
    id: "xero",
    name: "Xero",
    category: "accounting",
    icon: DollarSign,
    color: "from-cyan-500 to-cyan-600",
    description: "Automatically sync costs and create expense records",
    features: ["Cost tracking", "Invoice generation", "Expense reports", "Tax coding"]
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "accounting",
    icon: DollarSign,
    color: "from-emerald-500 to-emerald-600",
    description: "Track maintenance costs and generate financial reports",
    features: ["Expense tracking", "Vendor management", "Reports", "Bill payments"]
  }
];

export default function Integrations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [syncing, setSyncing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: connections = {}, isLoading } = useQuery({
    queryKey: ["integration-connections"],
    queryFn: async () => {
      // Fetch user's saved integration connections
      return user?.integrations || {};
    },
    enabled: !!user
  });

  const connectMutation = useMutation({
    mutationFn: async ({ integrationId, credentials }) => {
      await base44.auth.updateMe({
        integrations: {
          ...connections,
          [integrationId]: {
            connected: true,
            connected_at: new Date().toISOString(),
            credentials: credentials
          }
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["integration-connections"]);
      setSelectedIntegration(null);
      setApiKey("");
      setApiSecret("");
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async (integrationId) => {
      const updated = { ...connections };
      delete updated[integrationId];
      await base44.auth.updateMe({
        integrations: updated
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["integration-connections"]);
    }
  });

  const handleSync = async (integrationId) => {
    setSyncing(true);
    try {
      await base44.functions.invoke('syncIntegration', {
        integrationId,
        userId: user.id
      });
      queryClient.invalidateQueries(["business-issues"]);
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = () => {
    connectMutation.mutate({
      integrationId: selectedIntegration.id,
      credentials: {
        api_key: apiKey,
        api_secret: apiSecret
      }
    });
  };

  if (user?.account_type !== "business") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-slate-600 mb-4">Integrations are only available for business accounts</p>
          <Button onClick={() => navigate(createPageUrl("BusinessPricing"))}>
            Upgrade to Business
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 border-b",
        theme === "dark" 
          ? "bg-[#0F1E2E] border-[#57CFA4]/20" 
          : "bg-white border-slate-200"
      )}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/10 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className={cn(
              "text-lg font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Integrations
            </h1>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Connect your property management and accounting software
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-12 space-y-12">
        {/* Property Management */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-[#F7B600]" />
            <h2 className={cn(
              "text-xl font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Property Management
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.filter(i => i.category === "property").map((integration) => {
              const Icon = integration.icon;
              const isConnected = connections[integration.id]?.connected;

              return (
                <div
                  key={integration.id}
                  className={cn(
                    "rounded-2xl border p-6",
                    theme === "dark"
                      ? "bg-[#1A2F42] border-[#57CFA4]/20"
                      : "bg-white border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    `bg-gradient-to-br ${integration.color}`
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className={cn(
                    "font-bold text-lg mb-2",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {integration.name}
                  </h3>

                  <p className={cn(
                    "text-sm mb-4",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    {integration.description}
                  </p>

                  <div className="space-y-1 mb-4">
                    {integration.features.map((feature, idx) => (
                      <div key={idx} className={cn(
                        "text-xs flex items-center gap-2",
                        theme === "dark" ? "text-slate-400" : "text-slate-600"
                      )}>
                        <Check className="w-3 h-3 text-[#57CFA4]" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isConnected ? (
                    <div className="space-y-2">
                      <div className={cn(
                        "flex items-center gap-2 p-2 rounded-lg",
                        theme === "dark"
                          ? "bg-green-900/20 text-green-400"
                          : "bg-green-50 text-green-700"
                      )}>
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(integration.id)}
                          disabled={syncing}
                          className="flex-1"
                        >
                          <RefreshCw className={cn("w-4 h-4 mr-1", syncing && "animate-spin")} />
                          Sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectMutation.mutate(integration.id)}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setSelectedIntegration(integration)}
                      className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Accounting Software */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-6 h-6 text-[#57CFA4]" />
            <h2 className={cn(
              "text-xl font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Accounting Software
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {integrations.filter(i => i.category === "accounting").map((integration) => {
              const Icon = integration.icon;
              const isConnected = connections[integration.id]?.connected;

              return (
                <div
                  key={integration.id}
                  className={cn(
                    "rounded-2xl border p-6",
                    theme === "dark"
                      ? "bg-[#1A2F42] border-[#57CFA4]/20"
                      : "bg-white border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    `bg-gradient-to-br ${integration.color}`
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className={cn(
                    "font-bold text-lg mb-2",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {integration.name}
                  </h3>

                  <p className={cn(
                    "text-sm mb-4",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    {integration.description}
                  </p>

                  <div className="space-y-1 mb-4">
                    {integration.features.map((feature, idx) => (
                      <div key={idx} className={cn(
                        "text-xs flex items-center gap-2",
                        theme === "dark" ? "text-slate-400" : "text-slate-600"
                      )}>
                        <Check className="w-3 h-3 text-[#57CFA4]" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isConnected ? (
                    <div className="space-y-2">
                      <div className={cn(
                        "flex items-center gap-2 p-2 rounded-lg",
                        theme === "dark"
                          ? "bg-green-900/20 text-green-400"
                          : "bg-green-50 text-green-700"
                      )}>
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(integration.id)}
                          disabled={syncing}
                          className="flex-1"
                        >
                          <RefreshCw className={cn("w-4 h-4 mr-1", syncing && "animate-spin")} />
                          Sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectMutation.mutate(integration.id)}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setSelectedIntegration(integration)}
                      className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Connection Dialog */}
      <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
        <DialogContent className={cn(
          "max-w-lg",
          theme === "dark" ? "bg-[#1A2F42] border-[#57CFA4]/20" : "bg-white"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Connect {selectedIntegration?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Enter your {selectedIntegration?.name} API credentials to connect your account.
            </p>

            <div>
              <Label className={cn(
                "mb-2 block",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                API Key *
              </Label>
              <Input
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={cn(
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
              />
            </div>

            <div>
              <Label className={cn(
                "mb-2 block",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                API Secret (if required)
              </Label>
              <Input
                type="password"
                placeholder="Enter your API secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className={cn(
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
              />
            </div>

            <div className={cn(
              "p-3 rounded-xl border text-xs",
              theme === "dark"
                ? "bg-blue-900/20 border-blue-500/30 text-blue-300"
                : "bg-blue-50 border-blue-200 text-blue-700"
            )}>
              <p className="font-semibold mb-1">Where to find your API credentials:</p>
              <p>
                Visit your {selectedIntegration?.name} account settings → API or Developer section to generate credentials.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setSelectedIntegration(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConnect}
                disabled={!apiKey || connectMutation.isPending}
                className="flex-1 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
              >
                {connectMutation.isPending ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}