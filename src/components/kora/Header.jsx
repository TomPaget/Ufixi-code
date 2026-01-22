import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import NotificationBell from "@/components/kora/NotificationBell";

export default function Header({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-[#f9f7e7]/80 backdrop-blur-md border-slate-300/30">
      <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick}
          className="rounded-xl hover:bg-slate-700 text-[#63c49f]"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6943ddc3165afcd16ccf0414/8a320ec2d_ufixi_White_RGB.png"
          alt="Ufixi Logo"
          className="h-8 object-contain"
        />

        <NotificationBell />
      </div>
    </header>
  );
}