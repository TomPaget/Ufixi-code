import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Home, 
  Plus, 
  Droplets, 
  Zap, 
  Thermometer, 
  CloudRain,
  Camera,
  Bell,
  Wifi,
  WifiOff,
  Trash2,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import SmartHomeConnectDialog from "@/components/kora/SmartHomeConnectDialog";
import SmartHomeAlertCard from "@/components/kora/SmartHomeAlertCard";

const deviceIcons = {
  water_leak_sensor: Droplets,
  smart_thermostat: Thermometer,
  smart_plug: Zap,
  energy_monitor: Zap,
  smoke_detector: Bell,
  carbon_monoxide_detector: Bell,
  humidity_sensor: CloudRain,
  temperature_sensor: Thermometer,
  camera: Camera
};

const platformColors = {
  google_home: "bg-blue-500",
  amazon_alexa: "bg-cyan-500",
  apple_homekit: "bg-slate-800"
};

export default function SmartHome() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ["smartHomeDevices"],
    queryFn: () => base44.entities.SmartHomeDevice.list("-connected_date")
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["smartHomeAlerts"],
    queryFn: () => base44.entities.SmartHomeAlert.filter({ 
      status: { $in: ["new", "acknowledged", "investigating"] }
    })
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: (deviceId) => base44.entities.SmartHomeDevice.delete(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries(["smartHomeDevices"]);
    }
  });

  const toggleMonitoringMutation = useMutation({
    mutationFn: ({ id, enabled }) => 
      base44.entities.SmartHomeDevice.update(id, { monitoring_enabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries(["smartHomeDevices"]);
    }
  });

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/20 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h1 className={cn(
              "font-bold text-lg",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Smart Home
            </h1>
          </div>
          <Button
            onClick={() => setShowConnectDialog(true)}
            className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl p-6 border-2",
            theme === "dark"
              ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
              : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
          )}
        >
          <h2 className={cn(
            "text-xl font-bold mb-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Automated Issue Detection
          </h2>
          <p className={cn(
            "text-sm",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
            Connect your smart home devices to automatically detect and report potential issues before they become major problems.
          </p>
          
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className={cn(
              "rounded-xl p-3 text-center",
              theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
            )}>
              <p className={cn(
                "text-2xl font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {devices.filter(d => d.monitoring_enabled).length}
              </p>
              <p className={cn(
                "text-xs mt-1",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Active
              </p>
            </div>
            <div className={cn(
              "rounded-xl p-3 text-center",
              theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
            )}>
              <p className={cn(
                "text-2xl font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {alerts.length}
              </p>
              <p className={cn(
                "text-xs mt-1",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Alerts
              </p>
            </div>
            <div className={cn(
              "rounded-xl p-3 text-center",
              theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
            )}>
              <p className={cn(
                "text-2xl font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {devices.length}
              </p>
              <p className={cn(
                "text-xs mt-1",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Devices
              </p>
            </div>
          </div>
        </motion.div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div>
            <h3 className={cn(
              "font-semibold mb-3 flex items-center gap-2",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              <Bell className="w-5 h-5 text-red-500" />
              Active Alerts ({alerts.length})
            </h3>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <SmartHomeAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        )}

        {/* Connected Devices */}
        <div>
          <h3 className={cn(
            "font-semibold mb-3",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Connected Devices ({devices.length})
          </h3>

          {devicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-24 rounded-2xl animate-pulse",
                    theme === "dark" ? "bg-[#1A2F42]" : "bg-slate-100"
                  )}
                />
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className={cn(
              "text-center py-12 rounded-2xl border-2 border-dashed",
              theme === "dark"
                ? "bg-[#1A2F42]/50 border-[#57CFA4]/30"
                : "bg-slate-50 border-slate-300"
            )}>
              <Home className={cn(
                "w-12 h-12 mx-auto mb-3",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
              )} />
              <p className={cn(
                "font-medium mb-1",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                No devices connected yet
              </p>
              <p className={cn(
                "text-sm mb-4",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Connect your smart home devices to start monitoring
              </p>
              <Button
                onClick={() => setShowConnectDialog(true)}
                className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Connect Device
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => {
                const Icon = deviceIcons[device.device_type] || Home;
                const isOnline = device.monitoring_enabled;
                
                return (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-2xl p-4 border",
                      theme === "dark"
                        ? "bg-[#1A2F42] border-[#57CFA4]/20"
                        : "bg-white border-slate-200"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        platformColors[device.platform] || "bg-slate-500",
                        "text-white"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={cn(
                            "font-semibold truncate",
                            theme === "dark" ? "text-white" : "text-[#1E3A57]"
                          )}>
                            {device.device_name}
                          </h4>
                          {isOnline ? (
                            <Wifi className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>

                        <p className={cn(
                          "text-sm capitalize",
                          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                        )}>
                          {device.device_type.replace(/_/g, " ")}
                        </p>

                        {device.location && (
                          <p className={cn(
                            "text-xs mt-1",
                            theme === "dark" ? "text-[#57CFA4]/70" : "text-slate-500"
                          )}>
                            📍 {device.location}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleMonitoringMutation.mutate({
                              id: device.id,
                              enabled: !device.monitoring_enabled
                            })}
                            className="h-7 text-xs"
                          >
                            {device.monitoring_enabled ? "Pause" : "Resume"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteDeviceMutation.mutate(device.id)}
                            className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className={cn(
          "rounded-2xl p-5 border",
          theme === "dark"
            ? "bg-blue-900/30 border-blue-500/30"
            : "bg-blue-50 border-blue-200"
        )}>
          <h4 className={cn(
            "font-semibold mb-2",
            theme === "dark" ? "text-blue-400" : "text-blue-900"
          )}>
            How It Works
          </h4>
          <ul className={cn(
            "space-y-2 text-sm",
            theme === "dark" ? "text-blue-200" : "text-blue-800"
          )}>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">1.</span>
              <span>Connect your smart home devices (water sensors, thermostats, energy monitors)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">2.</span>
              <span>QuoFix monitors them 24/7 for unusual patterns</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">3.</span>
              <span>Get instant alerts when potential issues are detected</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">4.</span>
              <span>Start the diagnosis and repair process immediately</span>
            </li>
          </ul>
        </div>
      </main>

      <SmartHomeConnectDialog
        isOpen={showConnectDialog}
        onClose={() => setShowConnectDialog(false)}
      />
    </div>
  );
}