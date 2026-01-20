import { ThemeProvider } from "@/components/kora/ThemeProvider";
import BannerAd from "@/components/kora/BannerAd";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <style>{`
          :root {
            --dark-bg: #ffffff;
            --dark-card: #ffffff;
          }
          @keyframes gradient-shift {
            0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
            25% { transform: translate(10%, 8%) scale(1.15) rotate(3deg); }
            50% { transform: translate(3%, 15%) scale(1.1) rotate(-2deg); }
            75% { transform: translate(-8%, 8%) scale(1.12) rotate(3deg); }
            100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          }
          @keyframes gradient-shift-slow {
            0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
            33% { transform: translate(-8%, 12%) scale(1.2) rotate(-4deg); }
            66% { transform: translate(8%, -8%) scale(1.1) rotate(3deg); }
            100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          }
          @keyframes gradient-shift-reverse {
            0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
            30% { transform: translate(15%, -12%) scale(1.18) rotate(5deg); }
            60% { transform: translate(-12%, 8%) scale(1.12) rotate(-3deg); }
            100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          }
          .animate-gradient-shift {
            animation: gradient-shift 18s ease-in-out infinite;
          }
          .animate-gradient-shift-slow {
            animation: gradient-shift-slow 22s ease-in-out infinite;
          }
          .animate-gradient-shift-reverse {
            animation: gradient-shift-reverse 20s ease-in-out infinite;
          }
        `}</style>
        <div className="min-h-screen relative overflow-hidden">
          {/* Animated liquid gradient background */}
          <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-200 to-slate-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-700/90 via-pink-400/50 to-orange-600/90 animate-gradient-shift blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/85 via-yellow-400/40 to-blue-600/85 animate-gradient-shift-slow blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-bl from-blue-600/75 via-pink-300/45 to-orange-600/80 animate-gradient-shift-reverse blur-3xl" />
            <div className="absolute inset-0 bg-white/5" />
          </div>
          {children}
          <BannerAd />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}