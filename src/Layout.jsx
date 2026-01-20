import { ThemeProvider } from "@/components/kora/ThemeProvider";
import BannerAd from "@/components/kora/BannerAd";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <style>{`
          :root {
            --dark-bg: #0a1929;
            --dark-card: #1a2332;
          }
        `}</style>
        <div className="min-h-screen">
          {children}
          <BannerAd />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}