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
        `}</style>
        <div className="min-h-screen">
          <div className="flex justify-center py-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6943ddc3165afcd16ccf0414/0928d6cfd_ufixi_secondary_RGB.png"
              alt="UFixi Logo"
              className="h-12 w-auto"
            />
          </div>
          {children}
          <BannerAd />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}