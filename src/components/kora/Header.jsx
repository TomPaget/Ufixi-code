import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import HamburgerMenu from "@/components/kora/HamburgerMenu";
import NotificationBell from "@/components/kora/NotificationBell";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-sm border-slate-200/50">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMenuOpen(true)}
            className="rounded-xl hover:bg-slate-100 text-[#1E3A57]"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6943ddc3165afcd16ccf0414/22c89923a_ufixi_secondary_RGB.png"
            alt="Ufixi Logo"
            className="h-8 w-auto"
          />

          <NotificationBell />
        </div>
      </header>
    </>
  );
}