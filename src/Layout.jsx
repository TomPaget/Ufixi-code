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
            font-family: 'Times New Roman', Times, serif;
          }
          * {
            font-family: 'Times New Roman', Times, serif;
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