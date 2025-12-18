import { ThemeProvider } from "@/components/kora/ThemeProvider";
import BannerAd from "@/components/kora/BannerAd";

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <style>{`
        :root {
          --dark-bg: #0F1E2E;
          --dark-card: #1A2F42;
        }
      `}</style>
      <div className="min-h-screen">
        {children}
        <BannerAd />
      </div>
    </ThemeProvider>
  );
}