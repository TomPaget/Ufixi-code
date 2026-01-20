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
            font-family: 'Coolvetica', sans-serif;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'DM Sans', sans-serif;
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