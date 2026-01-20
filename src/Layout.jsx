import { ThemeProvider } from "@/components/kora/ThemeProvider";
import BannerAd from "@/components/kora/BannerAd";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
          :root {
            --dark-bg: #ffffff;
            --dark-card: #ffffff;
          }
          * {
            font-family: 'DM Sans', sans-serif;
            font-weight: normal;
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