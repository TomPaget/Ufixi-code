import { ThemeProvider, useTheme } from "@/components/kora/ThemeProvider";
import BannerAd from "@/components/kora/BannerAd";
import ErrorBoundary from "@/components/ErrorBoundary";

function LayoutContent({ children }) {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen">
      <style>{`
        :root {
          --dark-bg: #ffffff;
          --dark-card: #ffffff;
          ${theme === 'dark' ? `
            --gradient-1: #1a1a2e;
            --gradient-2: #dc2626;
            --gradient-3: #fbbf24;
            --gradient-4: #60a5fa;
          ` : `
            --gradient-1: #0066cc;
            --gradient-2: #ff1493;
            --gradient-3: #ffd700;
            --gradient-4: #87ceeb;
          `}
        }
      `}</style>
      {children}
      <BannerAd />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <LayoutContent>{children}</LayoutContent>
        <div className="min-h-screen">
          {children}
          <BannerAd />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}