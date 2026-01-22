import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function NotificationBell() {
  const { theme } = useTheme();
  
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!user?.id) return [];
      return base44.entities.Notification.filter({ user_id: user.id, read: false });
    },
    enabled: !!user?.id,
    refetchInterval: 30000 // Poll every 30 seconds
  });

  const unreadCount = notifications.length;

  return (
    <Link 
      to={createPageUrl("Notifications")}
      className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100"
    >
      <Bell className="w-5 h-5 text-[#63c49f]" />
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </motion.span>
      )}
    </Link>
  );
}