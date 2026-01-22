import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import NotificationBell from "@/components/kora/NotificationBell";

export default function Header({ onMenuClick }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-30 border-b bg-white/10 backdrop-blur-md border-white/20 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="max-w-lg mx-auto px-5 flex items-center justify-between">
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
          className={`object-contain transition-all duration-300 ${isScrolled ? 'h-6' : 'h-8'}`}
        />

        <NotificationBell />
      </div>
    </header>
  );
}