import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Bell, 
  Check, 
  Trash2,
  AlertTriangle,
  Briefcase,
  Calendar,
  CreditCard,
  MessageCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import LavaLampBackground from "@/components/kora/LavaLampBackground";

const typeIcons = {
  issue_update: AlertTriangle,
  work_request: Briefcase,
  appointment: Calendar,
  payment: CreditCard,
  message: MessageCircle,
  general: Info
};

const priorityColors = {
  low: "text-blue-500",
  normal: "text-slate-500",
  high: "text-orange-500",
  urgent: "text-red-500"
};

export default function Notifications() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id }, "-created_date")
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id => 
        base44.entities.Notification.update(id, { read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    }
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(createPageUrl(notification.action_url));
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      <LavaLampBackground />
      <div className="relative z-10">
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
              onClick={() => navigate(createPageUrl("Home"))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={cn(
              "font-bold text-lg",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>Notifications</h1>
          </div>
          {unreadNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]"
              )}
            >
              Mark all read
            </Button>
          )}
        </div>
        </header>

        <main className="max-w-lg mx-auto px-5 py-6">
        <Tabs defaultValue="unread" className="w-full">
          <TabsList className={cn(
            "w-full grid grid-cols-2 mb-6",
            theme === "dark" ? "bg-[#1A2F42]" : "bg-slate-100"
          )}>
            <TabsTrigger value="unread">
              Unread {unreadNotifications.length > 0 && (
                <Badge className="ml-2 bg-red-500">{unreadNotifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-3">
            {unreadNotifications.length === 0 ? (
              <div className={cn(
                "text-center py-12 rounded-2xl border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}>
                <Bell className={cn(
                  "w-12 h-12 mx-auto mb-3",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
                )} />
                <p className={cn(
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  No unread notifications
                </p>
              </div>
            ) : (
              unreadNotifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Info;
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="rounded-2xl p-4 border-2 cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,110,50,0.15)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        theme === "dark"
                          ? "bg-[#57CFA4]/20"
                          : "bg-blue-100"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          priorityColors[notification.priority]
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={cn(
                            "font-semibold text-sm",
                            theme === "dark" ? "text-white" : "text-slate-900"
                          )}>
                            {notification.title}
                          </h3>
                          <p className={cn(
                            "text-xs whitespace-nowrap",
                            theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                          )}>
                            {format(new Date(notification.created_date), "MMM d")}
                          </p>
                        </div>
                        <p className={cn(
                          "text-sm",
                          theme === "dark" ? "text-white" : "text-slate-700"
                        )}>
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation.mutate(notification.id);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(notification.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-3">
            {notifications.length === 0 ? (
              <div className={cn(
                "text-center py-12 rounded-2xl border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}>
                <Bell className={cn(
                  "w-12 h-12 mx-auto mb-3",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
                )} />
                <p className={cn(
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Info;
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01]"
                    style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,110,50,0.15)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        theme === "dark"
                          ? "bg-[#57CFA4]/20"
                          : "bg-blue-100"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          priorityColors[notification.priority]
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={cn(
                            "font-semibold text-sm",
                            notification.read
                              ? theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                              : theme === "dark" ? "text-white" : "text-slate-900"
                          )}>
                            {notification.title}
                          </h3>
                          <p className={cn(
                            "text-xs whitespace-nowrap",
                            theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                          )}>
                            {format(new Date(notification.created_date), "MMM d")}
                          </p>
                        </div>
                        <p className={cn(
                          "text-sm",
                          notification.read
                            ? theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                            : theme === "dark" ? "text-white" : "text-slate-700"
                        )}>
                          {notification.message}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(notification.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
          </Tabs>
          </main>
          </div>
          </div>
  );
}