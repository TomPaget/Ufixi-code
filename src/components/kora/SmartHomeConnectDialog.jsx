import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Home } from "lucide-react";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function SmartHomeConnectDialog({ isOpen, onClose }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [location, setLocation] = useState("");

  const createDeviceMutation = useMutation({
    mutationFn: (deviceData) => base44.entities.SmartHomeDevice.create(deviceData),
    onSuccess: () => {
      queryClient.invalidateQueries(["smartHomeDevices"]);
      setStep(3);
    }
  });

  const handleConnect = () => {
    createDeviceMutation.mutate({
      device_id: deviceId || `${platform}-${Date.now()}`,
      device_name: deviceName,
      device_type: deviceType,
      platform: platform,
      location: location,
      monitoring_enabled: true,
      connected_date: new Date().toISOString()
    });
  };

  const handleClose = () => {
    setStep(1);
    setPlatform("");
    setDeviceType("");
    setDeviceName("");
    setDeviceId("");
    setLocation("");
    onClose();
  };

  if (step === 3) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Device Connected! 🎉</h2>
            <p className="text-slate-600 mb-6">
              {deviceName} is now monitoring for issues
            </p>
            <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-4 rounded-3xl">
        <DialogHeader>
          <DialogTitle>Connect Smart Home Device</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 mt-4">
            <div>
              <Label className="mb-2 block">Select Platform</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "google_home", label: "Google Home", color: "bg-blue-500" },
                  { value: "amazon_alexa", label: "Alexa", color: "bg-cyan-500" },
                  { value: "apple_homekit", label: "HomeKit", color: "bg-slate-800" }
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      platform === p.value
                        ? `${p.color} text-white border-transparent`
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Home className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-xs font-medium">{p.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!platform}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-4">
            <div>
              <Label className="mb-2 block">Device Type</Label>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water_leak_sensor">Water Leak Sensor</SelectItem>
                  <SelectItem value="smart_thermostat">Smart Thermostat</SelectItem>
                  <SelectItem value="smart_plug">Smart Plug</SelectItem>
                  <SelectItem value="energy_monitor">Energy Monitor</SelectItem>
                  <SelectItem value="smoke_detector">Smoke Detector</SelectItem>
                  <SelectItem value="carbon_monoxide_detector">CO Detector</SelectItem>
                  <SelectItem value="humidity_sensor">Humidity Sensor</SelectItem>
                  <SelectItem value="temperature_sensor">Temperature Sensor</SelectItem>
                  <SelectItem value="camera">Camera</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Device Name</Label>
              <Input
                placeholder="e.g., Kitchen Leak Sensor"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2 block">Location (Optional)</Label>
              <Input
                placeholder="e.g., Kitchen, Bathroom"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2 block">Device ID (Optional)</Label>
              <Input
                placeholder="From your smart home app"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Find this in your {platform.replace(/_/g, " ")} app settings
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleConnect}
                disabled={!deviceType || !deviceName || createDeviceMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {createDeviceMutation.isPending ? "Connecting..." : "Connect Device"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}