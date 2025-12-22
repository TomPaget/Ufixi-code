import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ArrowLeft, Plus, Calendar, Check, Clock, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function Reminders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reminder_date: "",
    repeat_frequency: "none",
    category: "other"
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => base44.entities.Reminder.list("reminder_date")
  });

  const hasHomeProfile = user?.property_type || user?.heating_type || (user?.appliances && user.appliances.length > 0);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Reminder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["reminders"]);
      setShowDialog(false);
      setFormData({
        title: "",
        description: "",
        reminder_date: "",
        repeat_frequency: "none",
        category: "other"
      });
    }
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reminder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["reminders"]);
    }
  });

  const handleComplete = (reminder) => {
    completeMutation.mutate({
      id: reminder.id,
      data: {
        ...reminder,
        is_completed: !reminder.is_completed,
        completed_date: !reminder.is_completed ? new Date().toISOString().split("T")[0] : null
      }
    });
  };

  const upcomingReminders = reminders.filter(r => !r.is_completed);
  const completedReminders = reminders.filter(r => r.is_completed);

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark"
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50"
    )}>
      <header className={cn(
        "sticky top-0 z-10 backdrop-blur-lg border-b",
        theme === "dark"
          ? "bg-slate-900/80 border-slate-700/50"
          : "bg-white/80 border-slate-200"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-xl",
                theme === "dark"
                  ? "hover:bg-slate-800 text-slate-400"
                  : "hover:bg-slate-100 text-slate-600"
              )}
              onClick={() => navigate(createPageUrl("Home"))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={cn(
              "font-semibold text-lg",
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            )}>Maintenance Reminders</h1>
          </div>
          <Button
            size="sm"
            onClick={() => setShowDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Home Profile Banner */}
        {!hasHomeProfile && (
          <div
            onClick={() => navigate(createPageUrl("HomeProfile"))}
            className={cn(
              "rounded-2xl p-4 border-2 cursor-pointer transition-all hover:scale-[1.02]",
              theme === "dark"
                ? "bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/50"
                : "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F7B600] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#0F1E2E]" />
              </div>
              <div className="flex-1">
                <h3 className={cn(
                  "font-semibold mb-1",
                  theme === "dark" ? "text-white" : "text-slate-900"
                )}>
                  Get Proactive Maintenance Reminders
                </h3>
                <p className={cn(
                  "text-sm mb-2",
                  theme === "dark" ? "text-slate-300" : "text-slate-600"
                )}>
                  Set up your home profile and we'll automatically suggest maintenance tasks based on your property
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-400 font-medium">
                  <Home className="w-4 h-4" />
                  Set Up Home Profile
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming */}
        <section>
          <h2 className={cn(
            "font-semibold mb-3 flex items-center gap-2",
            theme === "dark" ? "text-slate-200" : "text-slate-900"
          )}>
            <Clock className="w-4 h-4 text-amber-500" />
            Upcoming
          </h2>
          {upcomingReminders.length > 0 ? (
            <div className="space-y-3">
              {upcomingReminders.map((reminder, i) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "rounded-2xl p-4 border",
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700/50"
                      : "bg-white border-slate-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleComplete(reminder)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5",
                        theme === "dark"
                          ? "border-slate-600 hover:border-blue-500"
                          : "border-slate-300 hover:border-blue-500"
                      )}
                    />
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-semibold",
                        theme === "dark" ? "text-slate-100" : "text-slate-900"
                      )}>{reminder.title}</h3>
                      {reminder.description && (
                        <p className={cn(
                          "text-sm mt-1",
                          theme === "dark" ? "text-slate-400" : "text-slate-600"
                        )}>{reminder.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        <span className={cn(
                          theme === "dark" ? "text-slate-400" : "text-slate-600"
                        )}>
                          {format(new Date(reminder.reminder_date), "MMM d, yyyy")}
                        </span>
                        {reminder.repeat_frequency !== "none" && (
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            theme === "dark"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-blue-100 text-blue-700"
                          )}>
                            Repeats {reminder.repeat_frequency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={cn(
              "text-center py-8 rounded-2xl",
              theme === "dark"
                ? "bg-slate-800/50 border border-slate-700/50"
                : "bg-white border border-slate-200"
            )}>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              )}>No upcoming reminders</p>
            </div>
          )}
        </section>

        {/* Completed */}
        {completedReminders.length > 0 && (
          <section>
            <h2 className={cn(
              "font-semibold mb-3 flex items-center gap-2",
              theme === "dark" ? "text-slate-200" : "text-slate-900"
            )}>
              <Check className="w-4 h-4 text-emerald-500" />
              Completed
            </h2>
            <div className="space-y-3">
              {completedReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={cn(
                    "rounded-2xl p-4 border opacity-60",
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700/50"
                      : "bg-white border-slate-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleComplete(reminder)}
                      className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-semibold line-through",
                        theme === "dark" ? "text-slate-400" : "text-slate-500"
                      )}>{reminder.title}</h3>
                      <p className={cn(
                        "text-sm mt-1",
                        theme === "dark" ? "text-slate-500" : "text-slate-400"
                      )}>
                        Completed {format(new Date(reminder.completed_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={cn(
          "max-w-lg mx-4 rounded-3xl",
          theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            )}>Add Reminder</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }} className="space-y-4 mt-4">
            <div>
              <Label className={cn(theme === "dark" ? "text-slate-300" : "text-slate-700")}>
                Title *
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className={cn(
                  "mt-1",
                  theme === "dark"
                    ? "bg-slate-700 border-slate-600 text-slate-100"
                    : "bg-white border-slate-200"
                )}
                placeholder="e.g., Change HVAC filters"
                required
              />
            </div>

            <div>
              <Label className={cn(theme === "dark" ? "text-slate-300" : "text-slate-700")}>
                Description
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={cn(
                  "mt-1",
                  theme === "dark"
                    ? "bg-slate-700 border-slate-600 text-slate-100"
                    : "bg-white border-slate-200"
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={cn(theme === "dark" ? "text-slate-300" : "text-slate-700")}>
                  Date *
                </Label>
                <Input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({...formData, reminder_date: e.target.value})}
                  className={cn(
                    "mt-1",
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-slate-100"
                      : "bg-white border-slate-200"
                  )}
                  required
                />
              </div>
              <div>
                <Label className={cn(theme === "dark" ? "text-slate-300" : "text-slate-700")}>
                  Repeat
                </Label>
                <Select value={formData.repeat_frequency} onValueChange={(val) => setFormData({...formData, repeat_frequency: val})}>
                  <SelectTrigger className={cn(
                    "mt-1",
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-slate-100"
                      : "bg-white border-slate-200"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="biannually">Bi-annually</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Add Reminder
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}